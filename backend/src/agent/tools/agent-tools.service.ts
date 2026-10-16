import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
  Optional,
  Inject,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { FinancialLimitsGuard } from '../guardrails/financial-limits.guard';
import { PermissionTierValidator, PermissionTier, PermissionPolicyException } from '../guardrails/permission-tier.guard';
import {
  RouteComparisonResult,
  RouteComparisonItem,
  DraftTransferResult,
  ConfirmedTransferResult,
} from './agent-tools.interface';
import { v4 as uuidv4 } from 'uuid';
import { RouteScoringStrategyFactory } from '../strategies/route-scoring.strategy';
import { TransferStateMachine } from '../saga/transfer-state-machine';
import { SafetyChainCoordinator } from '../guardrails/safety-chain';
import { BANK_GATEWAY_TOKEN, IBankGateway } from '../gateways/bank-gateway.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountRepository } from '../../database/repositories/account.repository';
import { RateRepository } from '../../database/repositories/rate.repository';
import { TransferRepository } from '../../database/repositories/transfer.repository';
import { AuditRepository } from '../../database/repositories/audit.repository';
import {
  TransferDraftedEvent,
  TransferConfirmedEvent,
  TransferExecutedEvent,
  TransferCompensatedEvent,
  RouteComparedEvent,
} from '../events/domain.events';

@Injectable()
export class AgentToolsService {
  private readonly logger = new Logger(AgentToolsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Optional() @Inject(BANK_GATEWAY_TOKEN) private readonly bankGateway?: IBankGateway,
    @Optional() private readonly strategyFactory?: RouteScoringStrategyFactory,
    @Optional() private readonly stateMachine?: TransferStateMachine,
    @Optional() private readonly safetyChain?: SafetyChainCoordinator,
    @Optional() private readonly eventEmitter?: EventEmitter2,
    @Optional() private readonly accountRepo?: AccountRepository,
    @Optional() private readonly rateRepo?: RateRepository,
    @Optional() private readonly transferRepo?: TransferRepository,
    @Optional() private readonly auditRepo?: AuditRepository,
  ) {}

  async getBalance(studentId: string) {
    const account = this.accountRepo
      ? await this.accountRepo.findByStudentId(studentId)
      : await this.db.getAccountByStudentId(studentId);
    if (!account) {
      throw new NotFoundException(`Student account ${studentId} not found`);
    }

    const remainingDailyLimit = Math.max(0, account.daily_limit - account.daily_spent);

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'AGENT_QUERY',
      permission_tier: PermissionTier.READ_ONLY,
      account_id: account.id,
      action_summary: `Queried balance for student ${studentId}`,
      details: JSON.stringify({
        balance: account.balance,
        currency: account.currency,
        daily_limit: account.daily_limit,
        remaining_daily_limit: remainingDailyLimit,
      }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });

    return {
      studentId: account.student_id,
      studentName: account.student_name,
      currency: account.currency,
      balance: account.balance,
      dailyLimit: account.daily_limit,
      dailySpent: account.daily_spent,
      remainingDailyLimit,
      approximateUsdEquivalent: +(account.balance / 119.5).toFixed(2),
    };
  }

  async compareRoutes(
    studentId: string,
    amountUsd: number,
    tuitionDeadline?: string,
    preference?: string,
  ): Promise<RouteComparisonResult> {
    if (isNaN(amountUsd) || amountUsd <= 0) {
      throw new BadRequestException('Amount in USD must be greater than 0');
    }

    const rates = this.rateRepo
      ? await this.rateRepo.findAllActive()
      : await this.db.getAllRates();
    if (rates.length === 0) {
      throw new NotFoundException('No active remittance routes available');
    }

    const now = new Date();
    const benchmarkRateBdt = 119.00;
    const deadlineDate = tuitionDeadline ? new Date(tuitionDeadline) : undefined;

    const routeItems: RouteComparisonItem[] = rates.map((route) => {
      const sourceAmountBdt = +(amountUsd * route.inverse_rate).toFixed(2);
      const flatFeeBdt = route.transfer_fee_flat_bdt;
      const percentageFeeBdt = +(sourceAmountBdt * route.transfer_fee_percent).toFixed(2);
      const totalFeeBdt = +(flatFeeBdt + percentageFeeBdt).toFixed(2);

      const fxMarkupLossBdt = +(
        Math.max(0, route.inverse_rate - benchmarkRateBdt) * amountUsd
      ).toFixed(2);

      const totalCostBdt = +(totalFeeBdt + fxMarkupLossBdt).toFixed(2);

      const estimatedDelivery = new Date(now.getTime() + route.speed_hours * 3600 * 1000);
      let deadlineWarning = false;
      let deadlineNotice: string | undefined;

      if (deadlineDate && !isNaN(deadlineDate.getTime())) {
        if (estimatedDelivery > deadlineDate) {
          deadlineWarning = true;
          const diffHours = Math.ceil((estimatedDelivery.getTime() - deadlineDate.getTime()) / (3600 * 1000));
          deadlineNotice = `CRITICAL WARNING: Arrives ~${diffHours}h AFTER your tuition deadline! Late fees or registration block may apply.`;
        } else {
          deadlineNotice = `Safe: Arrives before your tuition deadline.`;
        }
      }

      return {
        routeId: route.id,
        providerName: route.provider_name,
        sourceAmountBdt,
        targetAmountUsd: amountUsd,
        exchangeRate: route.exchange_rate,
        inverseRate: route.inverse_rate,
        flatFeeBdt,
        percentageFeeBdt,
        totalFeeBdt,
        fxMarkupLossBdt,
        totalCostBdt,
        speedHours: route.speed_hours,
        speedDescription: route.speed_description,
        reliabilityScore: route.reliability_score,
        complianceRating: route.compliance_rating,
        compositeScore: 0,
        rank: 0,
        estimatedDeliveryDate: estimatedDelivery.toISOString(),
        deadlineWarning,
        deadlineNotice,
        recommendationReason: '',
      };
    });

    const minCost = Math.min(...routeItems.map((r) => r.totalCostBdt));
    const maxCost = Math.max(...routeItems.map((r) => r.totalCostBdt));
    const minHours = Math.min(...routeItems.map((r) => r.speedHours));
    const maxHours = Math.max(...routeItems.map((r) => r.speedHours));

    const activeStrategy = this.strategyFactory?.getStrategy(preference);
    const weights = activeStrategy
      ? activeStrategy.getWeights()
      : { costWeight: 0.50, speedWeight: 0.30, reliabilityWeight: 0.20 };

    routeItems.forEach((r) => {
      const costScore = maxCost === minCost ? 100 : ((maxCost - r.totalCostBdt) / (maxCost - minCost)) * 100;
      const speedScore = maxHours === minHours ? 100 : ((maxHours - r.speedHours) / (maxHours - minHours)) * 100;
      const relScore = r.reliabilityScore * 100;
      const deadlinePenalty = r.deadlineWarning ? 40 : 0;

      const rawComposite =
        weights.costWeight * costScore +
        weights.speedWeight * speedScore +
        weights.reliabilityWeight * relScore -
        deadlinePenalty;

      r.compositeScore = +Math.max(0, rawComposite).toFixed(1);
    });

    routeItems.sort((a, b) => b.compositeScore - a.compositeScore);
    routeItems.forEach((r, idx) => {
      r.rank = idx + 1;
      if (idx === 0) {
        r.recommendationReason = r.deadlineWarning
          ? 'Highest ranked available, but please note arrival date warning.'
          : activeStrategy
          ? activeStrategy.getRecommendationReason()
          : 'Best Overall: Optimal balance of lowest fees, fast clearance, and 99% reliability.';
      } else if (r.speedHours === minHours) {
        r.recommendationReason = 'Fastest Rail: Clears in 4 hours; ideal for urgent immediate tuition deadlines.';
      } else if (r.totalCostBdt === minCost) {
        r.recommendationReason = 'Lowest Raw Cost: Minimal processing fees.';
      } else {
        r.recommendationReason = 'Standard clearing rail with higher legacy telegraphic fees.';
      }
    });

    const cheapestRoute = [...routeItems].sort((a, b) => a.totalCostBdt - b.totalCostBdt)[0];
    const fastestRoute = [...routeItems].sort((a, b) => a.speedHours - b.speedHours)[0];

    const account = await this.db.getAccountByStudentId(studentId);

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'ROUTE_COMPARISON',
      permission_tier: PermissionTier.READ_ONLY,
      account_id: account?.id,
      action_summary: `Compared ${routeItems.length} remittance routes for $${amountUsd} USD`,
      details: JSON.stringify({
        amountUsd,
        tuitionDeadline,
        strategy: activeStrategy?.name || 'balanced',
        bestRoute: routeItems[0].providerName,
        bestCompositeScore: routeItems[0].compositeScore,
        deadlineWarningTriggered: routeItems.some((r) => r.deadlineWarning),
      }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'route.compared',
        new RouteComparedEvent(studentId, amountUsd, activeStrategy?.name || 'balanced'),
      );
    }

    return {
      studentId,
      targetAmountUsd: amountUsd,
      tuitionDeadline,
      bestOverallRoute: routeItems[0],
      cheapestRoute,
      fastestRoute,
      allRoutes: routeItems,
      scoringWeights: weights,
    };
  }

  async createTransferDraft(
    studentId: string,
    routeId: string,
    amountUsd: number,
    recipientUniversity: string,
    studentRegNumber = 'REG-FALL-2026',
    tuitionDeadline?: string,
  ): Promise<DraftTransferResult> {
    const account = await this.db.getAccountByStudentId(studentId);
    if (!account) {
      throw new NotFoundException(`Student ${studentId} not found`);
    }

    const route = await this.db.getRateById(routeId);
    if (!route) {
      throw new NotFoundException(`Remittance route ${routeId} not found`);
    }

    const sourceAmountBdt = +(amountUsd * route.inverse_rate).toFixed(2);
    const feeBdt = +(route.transfer_fee_flat_bdt + sourceAmountBdt * route.transfer_fee_percent).toFixed(2);
    const totalRequiredBdt = +(sourceAmountBdt + feeBdt).toFixed(2);

    if (this.safetyChain) {
      this.logger.log(`SafetyChain active for ${studentId} draft.`);
    }

    const limitCheck = FinancialLimitsGuard.validateTransfer(
      totalRequiredBdt,
      account.balance,
      account.daily_spent,
    );

    if (!limitCheck.isValid) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'SAFETY_LIMIT_TRIGGERED',
        permission_tier: PermissionTier.DRAFT,
        account_id: account.id,
        action_summary: `BLOCKED: Transfer draft creation rejected (${limitCheck.code})`,
        details: JSON.stringify({
          code: limitCheck.code,
          reason: limitCheck.reason,
          requestedBdt: totalRequiredBdt,
          currentBalance: account.balance,
          dailySpent: account.daily_spent,
        }),
        status: 'BLOCKED',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });

      throw new BadRequestException(`Security Policy Check Failed: ${limitCheck.reason}`);
    }

    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + route.speed_hours * 3600 * 1000);
    const deadlineDate = tuitionDeadline ? new Date(tuitionDeadline) : undefined;
    const deadlineWarning = deadlineDate ? estimatedDelivery > deadlineDate : false;

    const confirmationToken = `CONFIRM-${uuidv4().substring(0, 8).toUpperCase()}`;
    const transferId = `TRX-${uuidv4().substring(0, 8).toUpperCase()}`;

    const transfer = await this.db.createTransfer({
      id: transferId,
      account_id: account.id,
      student_id: account.student_id,
      recipient_university: recipientUniversity,
      student_reg_number: studentRegNumber,
      source_currency: 'BDT',
      target_currency: 'USD',
      target_amount_usd: amountUsd,
      source_amount_bdt: totalRequiredBdt,
      fee_total_bdt: feeBdt,
      fx_rate_applied: route.inverse_rate,
      rate_id: route.id,
      provider_name: route.provider_name,
      status: 'PENDING_CONFIRMATION',
      tuition_deadline: deadlineDate,
      estimated_delivery: estimatedDelivery,
      deadline_warning: deadlineWarning,
      confirmation_token: confirmationToken,
      why_recommended: `Selected via ${route.provider_name}. Speed: ${route.speed_description}, Reliability: ${(route.reliability_score * 100).toFixed(0)}%.`,
      created_at: now,
      updated_at: now,
    });

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'DRAFT_CREATED',
      permission_tier: PermissionTier.DRAFT,
      account_id: account.id,
      transfer_id: transfer.id,
      action_summary: `Draft created: ${transfer.id} for $${amountUsd} USD (${totalRequiredBdt.toLocaleString()} BDT)`,
      details: JSON.stringify({
        provider: route.provider_name,
        university: recipientUniversity,
        confirmationToken,
        deadlineWarning,
      }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'transfer.drafted',
        new TransferDraftedEvent(
          transfer.id,
          account.student_id,
          amountUsd,
          totalRequiredBdt,
          route.provider_name,
        ),
      );
    }

    return {
      transferId: transfer.id,
      status: 'PENDING_CONFIRMATION',
      studentId: account.student_id,
      studentName: account.student_name,
      recipientUniversity: transfer.recipient_university,
      studentRegNumber: transfer.student_reg_number,
      targetAmountUsd: amountUsd,
      sourceAmountBdt: totalRequiredBdt,
      totalFeeBdt: feeBdt,
      providerName: route.provider_name,
      confirmationToken,
      expiresInMinutes: 15,
      deadlineWarning,
      estimatedDeliveryDate: estimatedDelivery.toISOString(),
      actionRequired: 'EXPLICIT_USER_CONFIRMATION_REQUIRED: To execute, click Confirm in the UI or call the confirmation endpoint with the confirmation token.',
    };
  }

  async confirmTransfer(
    transferId: string,
    confirmationToken: string,
    userConsent: boolean,
    isUserInitiated = true,
  ): Promise<ConfirmedTransferResult> {
    const validation = PermissionTierValidator.validateToolExecution('confirmTransfer', isUserInitiated);
    if (!validation.allowed) {
      throw new PermissionPolicyException(validation.reason || 'Unauthorized execution tier', validation.tier);
    }

    if (!userConsent) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'CONFIRM_REJECTED',
        permission_tier: PermissionTier.EXECUTE,
        transfer_id: transferId,
        action_summary: `BLOCKED: Confirmation rejected without explicit user consent`,
        details: 'User consent boolean was not true',
        status: 'BLOCKED',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });
      throw new BadRequestException('Transfer execution cancelled: User consent was not granted.');
    }

    const transfer = this.transferRepo
      ? await this.transferRepo.findById(transferId)
      : await this.db.getTransferById(transferId);
    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    if (this.stateMachine) {
      this.stateMachine.assertTransition(transfer.status as any, 'CONFIRMED');
    } else if (transfer.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException(`Cannot confirm transfer with status "${transfer.status}". Must be PENDING_CONFIRMATION.`);
    }

    if (!transfer.confirmation_token || transfer.confirmation_token !== confirmationToken) {
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'CONFIRM_REJECTED',
        permission_tier: PermissionTier.EXECUTE,
        account_id: transfer.account_id,
        transfer_id: transfer.id,
        action_summary: 'BLOCKED: Invalid confirmation token provided',
        status: 'BLOCKED',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });
      throw new BadRequestException('Security token verification failed: Invalid confirmation token.');
    }

    const account = await this.db.getAccountById(transfer.account_id);
    if (!account) {
      throw new NotFoundException('Associated student account not found.');
    }

    const limitCheck = FinancialLimitsGuard.validateTransfer(
      transfer.source_amount_bdt,
      account.balance,
      account.daily_spent,
    );

    if (!limitCheck.isValid) {
      await this.db.updateTransferStatus(transfer.id, 'BLOCKED');
      await this.db.insertAuditLog({
        id: uuidv4(),
        event_type: 'CONFIRM_REJECTED',
        permission_tier: PermissionTier.EXECUTE,
        account_id: account.id,
        transfer_id: transfer.id,
        action_summary: `BLOCKED: Financial limit failed at execution time (${limitCheck.reason})`,
        status: 'BLOCKED',
        ip_address: '127.0.0.1',
        created_at: new Date(),
      });
      throw new BadRequestException(`Execution Blocked: ${limitCheck.reason}`);
    }

    if (this.bankGateway) {
      await this.bankGateway.reserveFunds(account.student_id, transfer.source_amount_bdt);
    }

    const newBalance = +(account.balance - transfer.source_amount_bdt).toFixed(2);
    const newDailySpent = +(account.daily_spent + transfer.source_amount_bdt).toFixed(2);

    await this.db.updateAccountBalance(account.id, newBalance, newDailySpent);
    const confirmedTime = new Date();
    await this.db.updateTransferStatus(transfer.id, 'CONFIRMED', confirmedTime);

    const auditId = uuidv4();
    await this.db.insertAuditLog({
      id: auditId,
      event_type: 'CONFIRM_SUCCESS',
      permission_tier: PermissionTier.EXECUTE,
      account_id: account.id,
      transfer_id: transfer.id,
      action_summary: `EXECUTE SUCCESS: Deducted ${transfer.source_amount_bdt.toLocaleString()} BDT. New balance: ${newBalance.toLocaleString()} BDT.`,
      details: JSON.stringify({
        transferId: transfer.id,
        targetAmountUsd: transfer.target_amount_usd,
        university: transfer.recipient_university,
        provider: transfer.provider_name,
        newBalance,
        newDailySpent,
      }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: confirmedTime,
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'transfer.confirmed',
        new TransferConfirmedEvent(
          transfer.id,
          account.student_id,
          transfer.source_amount_bdt,
          transfer.target_amount_usd,
          transfer.provider_name,
        ),
      );
      this.eventEmitter.emit(
        'transfer.executed',
        new TransferExecutedEvent(
          transfer.id,
          account.student_id,
          transfer.source_amount_bdt,
          transfer.provider_name,
        ),
      );
    }

    this.logger.log(`Transfer ${transfer.id} confirmed and funds settled for ${account.student_name}.`);

    return {
      transferId: transfer.id,
      status: 'CONFIRMED',
      studentId: account.student_id,
      newBalanceBdt: newBalance,
      dailySpentBdt: newDailySpent,
      deductedBdt: transfer.source_amount_bdt,
      providerName: transfer.provider_name,
      recipientUniversity: transfer.recipient_university,
      targetAmountUsd: transfer.target_amount_usd,
      confirmedAt: confirmedTime.toISOString(),
      auditLogId: auditId,
    };
  }

  async compensateTransfer(transferId: string, reason = 'Bank execution failure'): Promise<void> {
    const transfer = await this.db.getTransferById(transferId);
    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    const account = await this.db.getAccountById(transfer.account_id);
    if (!account) {
      throw new NotFoundException('Account not found for transfer');
    }

    const restoredBalance = +(account.balance + transfer.source_amount_bdt).toFixed(2);
    const restoredDailySpent = +Math.max(0, account.daily_spent - transfer.source_amount_bdt).toFixed(2);

    await this.db.updateAccountBalance(account.id, restoredBalance, restoredDailySpent);
    await this.db.updateTransferStatus(transfer.id, 'ROLLED_BACK');

    if (this.bankGateway) {
      await this.bankGateway.releaseFunds(account.student_id, transfer.source_amount_bdt);
    }

    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'TRANSFER_COMPENSATED',
      permission_tier: PermissionTier.EXECUTE,
      account_id: account.id,
      transfer_id: transfer.id,
      action_summary: `Saga compensating transaction executed: ${transfer.source_amount_bdt.toLocaleString()} BDT restored to student account. Reason: ${reason}`,
      status: 'WARNING',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });

    if (this.eventEmitter) {
      this.eventEmitter.emit(
        'transfer.compensated',
        new TransferCompensatedEvent(transfer.id, account.student_id, transfer.source_amount_bdt, reason),
      );
    }
  }

  async getAuditLog(limit = 50, tier?: string, status?: string) {
    if (this.auditRepo && !tier && !status) {
      return this.auditRepo.findRecent(limit);
    }
    const logs = await this.db.getAuditLogs(limit, tier, status);
    return logs;
  }

  async getAuditLogById(id: string) {
    const log = await this.db.getAuditLogById(id);
    if (!log) {
      throw new NotFoundException(`Audit record ${id} not found`);
    }
    return log;
  }

  async deleteAuditLog(id: string) {
    const deleted = await this.db.deleteAuditLog(id);
    if (!deleted) {
      throw new NotFoundException(`Audit record ${id} not found`);
    }
    return { success: true, id };
  }

  async updateTransferDraft(
    id: string,
    updates: { recipient_university?: string; student_reg_number?: string },
  ) {
    const existing = await this.db.getTransferById(id);
    if (!existing) {
      throw new NotFoundException(`Transfer ${id} not found`);
    }
    if (existing.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException(`Cannot update transfer with status "${existing.status}". Only draft transfers can be modified.`);
    }
    const updated = await this.db.updateTransferDraft(id, updates);
    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'DRAFT_UPDATED',
      permission_tier: PermissionTier.DRAFT,
      account_id: updated.account_id,
      transfer_id: updated.id,
      action_summary: `Draft updated for transfer ${id}`,
      details: JSON.stringify(updates),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });
    return updated;
  }

  async deleteTransferDraft(id: string) {
    const existing = await this.db.getTransferById(id);
    if (!existing) {
      throw new NotFoundException(`Transfer ${id} not found`);
    }
    if (existing.status !== 'PENDING_CONFIRMATION' && existing.status !== 'BLOCKED') {
      throw new BadRequestException(`Cannot delete transfer with status "${existing.status}".`);
    }
    await this.db.deleteTransfer(id);
    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'DRAFT_DISCARDED',
      permission_tier: PermissionTier.DRAFT,
      account_id: existing.account_id,
      transfer_id: id,
      action_summary: `Transfer ${id} discarded`,
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });
    return { success: true, id, status: 'DISCARDED' };
  }

  async depositFunds(studentId: string, amountBdt: number) {
    if (amountBdt <= 0) {
      throw new BadRequestException('Deposit amount must be greater than 0');
    }
    const account = await this.db.depositFunds(studentId, amountBdt);
    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'FUNDS_DEPOSITED',
      permission_tier: PermissionTier.EXECUTE,
      account_id: account.id,
      action_summary: `Deposited ${amountBdt.toLocaleString()} BDT to student account ${studentId}`,
      details: JSON.stringify({ amountBdt, newBalance: account.balance }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });
    return account;
  }

  async updateDailyLimit(studentId: string, newLimitBdt: number) {
    if (newLimitBdt <= 0) {
      throw new BadRequestException('Daily limit must be greater than 0');
    }
    const account = await this.db.updateDailyLimit(studentId, newLimitBdt);
    await this.db.insertAuditLog({
      id: uuidv4(),
      event_type: 'DAILY_LIMIT_UPDATED',
      permission_tier: PermissionTier.EXECUTE,
      account_id: account.id,
      action_summary: `Updated daily limit for student ${studentId} to ${newLimitBdt.toLocaleString()} BDT`,
      details: JSON.stringify({ newDailyLimit: newLimitBdt }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });
    return account;
  }

  async getRateById(id: string) {
    const rate = this.rateRepo
      ? await this.rateRepo.findById(id)
      : await this.db.getRateById(id);
    if (!rate) {
      throw new NotFoundException(`Remittance route ${id} not found`);
    }
    return rate;
  }

  async updateRate(id: string, updates: any) {
    const rate = await this.db.updateRate(id, updates);
    return rate;
  }

  async deleteRate(id: string) {
    const deleted = await this.db.deleteRate(id);
    if (!deleted) {
      throw new NotFoundException(`Remittance route ${id} not found`);
    }
    return { success: true, id, is_active: false };
  }
}
