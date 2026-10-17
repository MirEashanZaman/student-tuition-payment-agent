import { Injectable } from '@nestjs/common';
import {
  ISafetyRule,
  SafetyRuleContext,
  SafetyRuleEvaluation,
} from './safety-rule.interface';

@Injectable()
export class PerTransferLimitRule implements ISafetyRule {
  readonly ruleName = 'PER_TRANSFER_LIMIT_RULE';

  evaluate(context: SafetyRuleContext): SafetyRuleEvaluation {
    const envLimit = parseFloat(process.env.MAX_TRANSFER_LIMIT_BDT || process.env.PER_TRANSFER_LIMIT || '');
    const defaultLimit = !isNaN(envLimit) && envLimit > 0 ? envLimit : 400000;
    const maxLimit = context.maxPerTransferBdt ?? defaultLimit;
    const currency = process.env.DEFAULT_SOURCE_CURRENCY || 'BDT';

    if (context.amountBdt !== undefined && context.amountBdt > maxLimit) {
      return {
        passed: false,
        code: 'OVER_PER_TRANSFER_LIMIT',
        reason: `Transfer of ${context.amountBdt.toLocaleString()} ${currency} exceeds the per-transfer limit of ${maxLimit.toLocaleString()} ${currency}.`,
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class DailyLimitRule implements ISafetyRule {
  readonly ruleName = 'DAILY_LIMIT_RULE';

  evaluate(context: SafetyRuleContext): SafetyRuleEvaluation {
    const envDaily = parseFloat(process.env.DAILY_TRANSFER_LIMIT_BDT || process.env.DAILY_TRANSFER_LIMIT || '');
    const defaultDaily = !isNaN(envDaily) && envDaily > 0 ? envDaily : 1000000;
    const dailyLimit = context.dailyLimitBdt ?? defaultDaily;
    const dailySpent = context.dailySpentBdt ?? 0;
    const amount = context.amountBdt ?? 0;
    const currency = process.env.DEFAULT_SOURCE_CURRENCY || 'BDT';

    if (dailySpent + amount > dailyLimit) {
      return {
        passed: false,
        code: 'OVER_DAILY_LIMIT',
        reason: `Transfer would cause total daily spending (${(dailySpent + amount).toLocaleString()} ${currency}) to exceed the daily limit of ${dailyLimit.toLocaleString()} ${currency}.`,
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class AccountBalanceRule implements ISafetyRule {
  readonly ruleName = 'ACCOUNT_BALANCE_RULE';

  evaluate(context: SafetyRuleContext): SafetyRuleEvaluation {
    const balance = context.balanceBdt ?? 0;
    const amount = context.amountBdt ?? 0;
    const currency = process.env.DEFAULT_SOURCE_CURRENCY || 'BDT';

    if (amount > balance) {
      return {
        passed: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: `Insufficient funds. Required: ${amount.toLocaleString()} ${currency}, Available: ${balance.toLocaleString()} ${currency}.`,
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class SafetyRuleEngine {
  private rules: ISafetyRule[] = [];

  constructor() {
    this.registerRule(new PerTransferLimitRule());
    this.registerRule(new DailyLimitRule());
    this.registerRule(new AccountBalanceRule());
  }

  registerRule(rule: ISafetyRule): this {
    this.rules.push(rule);
    return this;
  }

  evaluateAll(context: SafetyRuleContext): SafetyRuleEvaluation {
    for (const rule of this.rules) {
      const res = rule.evaluate(context);
      if (!res.passed) {
        return res;
      }
    }
    return { passed: true };
  }

  getRegisteredRules(): string[] {
    return this.rules.map((r) => r.ruleName);
  }
}
