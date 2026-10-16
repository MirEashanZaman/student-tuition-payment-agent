import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
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

@Injectable()
export class AgentToolsService {
  private readonly logger = new Logger(AgentToolsService.name);

  constructor(private readonly db: DatabaseService) {}

  async getBalance(studentId: string) {
    const account = await this.db.getAccountByStudentId(studentId);
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
  ): Promise<RouteComparisonResult> {
    if (isNaN(amountUsd) || amountUsd <= 0) {
      throw new BadRequestException('Amount in USD must be greater than 0');
    }

    const rates = await this.db.getAllRates();
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

    routeItems.forEach((r) => {
      const costScore = maxCost === minCost ? 100 : ((maxCost - r.totalCostBdt) / (maxCost - minCost)) * 100;
      const speedScore = maxHours === minHours ? 100 : ((maxHours - r.speedHours) / (maxHours - minHours)) * 100;
      const relScore = r.reliabilityScore * 100;

      const deadlinePenalty = r.deadlineWarning ? 40 : 0;

      const rawComposite = 0.50 * costScore + 0.30 * speedScore + 0.20 * relScore - deadlinePenalty;
      r.compositeScore = +Math.max(0, rawComposite).toFixed(1);
    });

    routeItems.sort((a, b) => b.compositeScore - a.compositeScore);
    routeItems.forEach((r, idx) => {
      r.rank = idx + 1;
      if (idx === 0) {
        r.recommendationReason = r.deadlineWarning
          ? 'Highest ranked available, but please note arrival date warning.'
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
        bestRoute: routeItems[0].providerName,
        bestCompositeScore: routeItems[0].compositeScore,
        deadlineWarningTriggered: routeItems.some((r) => r.deadlineWarning),
      }),
      status: 'SUCCESS',
      ip_address: '127.0.0.1',
      created_at: new Date(),
    });

    return {
      studentId,
      targetAmountUsd: amountUsd,
      tuitionDeadline,
      bestOverallRoute: routeItems[0],
      cheapestRoute,
      fastestRoute,
      allRoutes: routeItems,
      scoringWeights: {
        costWeight: 0.50,
        speedWeight: 0.30,
        reliabilityWeight: 0.20,
      },
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

    const transfer = await this.db.getTransferById(transferId);
    if (!transfer) {
      throw new NotFoundException(`Transfer ${transferId} not found`);
    }

    if (transfer.status !== 'PENDING_CONFIRMATION') {
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

  async getAuditLog(limit = 50) {
    const logs = await this.db.getAuditLogs(limit);
    return logs;
  }
}
