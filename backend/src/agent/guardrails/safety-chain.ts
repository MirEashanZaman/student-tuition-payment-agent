import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PromptInjectionFilter } from './prompt-injection.filter';
import { FinancialLimitsGuard } from './financial-limits.guard';
import { PermissionTierValidator } from './permission-tier.guard';

export interface SafetyCheckContext {
  toolName?: string;
  isUserInitiated?: boolean;
  amountBdt?: number;
  dailySpentBdt?: number;
  currentBalanceBdt?: number;
  userConsent?: boolean;
  confirmationToken?: string;
  expectedToken?: string;
  tokenExpiresAt?: Date;
  userPrompt?: string;
}

export interface SafetyCheckResult {
  passed: boolean;
  blockedBy?: string;
  reason?: string;
}

export abstract class SafetyCheckHandler {
  private nextHandler?: SafetyCheckHandler;

  setNext(handler: SafetyCheckHandler): SafetyCheckHandler {
    this.nextHandler = handler;
    return handler;
  }

  async handle(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    const result = await this.check(context);
    if (!result.passed) {
      return result;
    }
    if (this.nextHandler) {
      return this.nextHandler.handle(context);
    }
    return { passed: true };
  }

  protected abstract check(context: SafetyCheckContext): Promise<SafetyCheckResult>;
}

@Injectable()
export class PromptInjectionCheckHandler extends SafetyCheckHandler {
  protected async check(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    if (!context.userPrompt) {
      return { passed: true };
    }
    const isTampering = PromptInjectionFilter.isLimitOrTierTampering(context.userPrompt);
    const result = PromptInjectionFilter.inspect(context.userPrompt);
    if (result.isSuspicious || isTampering) {
      return {
        passed: false,
        blockedBy: 'PromptInjectionCheckHandler',
        reason: 'Prompt injection pattern flagged: ' + (result.flaggedPatterns.length > 0 ? result.flaggedPatterns.join(', ') : 'Limit or tier tampering attempt detected'),
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class PermissionTierCheckHandler extends SafetyCheckHandler {
  protected async check(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    if (!context.toolName) {
      return { passed: true };
    }
    const result = PermissionTierValidator.validateToolExecution(
      context.toolName,
      context.isUserInitiated ?? false,
    );
    if (!result.allowed) {
      return {
        passed: false,
        blockedBy: 'PermissionTierCheckHandler',
        reason: result.reason || 'Permission tier policy violated',
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class FinancialLimitCheckHandler extends SafetyCheckHandler {
  protected async check(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    if (context.amountBdt === undefined) {
      return { passed: true };
    }
    const dailySpent = context.dailySpentBdt || 0;
    const balance = context.currentBalanceBdt || 0;

    const result = FinancialLimitsGuard.validateTransfer(context.amountBdt, balance, dailySpent);
    if (!result.isValid) {
      return {
        passed: false,
        blockedBy: 'FinancialLimitCheckHandler',
        reason: result.reason,
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class ConfirmationCheckHandler extends SafetyCheckHandler {
  protected async check(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    if (context.toolName !== 'confirmTransfer') {
      return { passed: true };
    }
    if (context.userConsent !== true) {
      return {
        passed: false,
        blockedBy: 'ConfirmationCheckHandler',
        reason: 'Explicit user consent required to execute fund movement.',
      };
    }
    if (!context.confirmationToken) {
      return {
        passed: false,
        blockedBy: 'ConfirmationCheckHandler',
        reason: 'Missing confirmation token.',
      };
    }
    if (context.expectedToken && context.confirmationToken !== context.expectedToken) {
      return {
        passed: false,
        blockedBy: 'ConfirmationCheckHandler',
        reason: 'Invalid confirmation token.',
      };
    }
    if (context.tokenExpiresAt && new Date() > context.tokenExpiresAt) {
      return {
        passed: false,
        blockedBy: 'ConfirmationCheckHandler',
        reason: 'Confirmation token has expired. Please generate a new draft.',
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class AnomalyCheckHandler extends SafetyCheckHandler {
  protected async check(context: SafetyCheckContext): Promise<SafetyCheckResult> {
    if (context.amountBdt !== undefined) {
      if (isNaN(context.amountBdt) || !isFinite(context.amountBdt)) {
        return {
          passed: false,
          blockedBy: 'AnomalyCheckHandler',
          reason: 'Amount is not a valid finite number.',
        };
      }
      if (context.amountBdt <= 0) {
        return {
          passed: false,
          blockedBy: 'AnomalyCheckHandler',
          reason: 'Transfer amount must be strictly greater than zero.',
        };
      }
      const envCeiling = parseFloat(process.env.ANOMALY_CEILING_LIMIT || '');
      const anomalyCeiling = !isNaN(envCeiling) && envCeiling > 0 ? envCeiling : 5000000;
      const currency = process.env.DEFAULT_SOURCE_CURRENCY || 'BDT';
      if (context.amountBdt > anomalyCeiling) {
        return {
          passed: false,
          blockedBy: 'AnomalyCheckHandler',
          reason: `Flagged suspicious anomaly: Requested amount exceeds hard safety ceiling of ${anomalyCeiling.toLocaleString()} ${currency}.`,
        };
      }
    }
    return { passed: true };
  }
}

@Injectable()
export class SafetyChainCoordinator {
  private chain: SafetyCheckHandler;

  constructor(
    promptInjection: PromptInjectionCheckHandler,
    permissionTier: PermissionTierCheckHandler,
    financialLimit: FinancialLimitCheckHandler,
    confirmationCheck: ConfirmationCheckHandler,
    anomalyCheck: AnomalyCheckHandler,
  ) {
    promptInjection
      .setNext(permissionTier)
      .setNext(anomalyCheck)
      .setNext(financialLimit)
      .setNext(confirmationCheck);

    this.chain = promptInjection;
  }

  async validate(context: SafetyCheckContext): Promise<void> {
    const result = await this.chain.handle(context);
    if (!result.passed) {
      if (result.blockedBy === 'PermissionTierCheckHandler') {
        throw new ForbiddenException(result.reason);
      }
      throw new BadRequestException(result.reason);
    }
  }
}
