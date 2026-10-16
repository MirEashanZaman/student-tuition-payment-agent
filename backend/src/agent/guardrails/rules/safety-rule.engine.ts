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
    const maxLimit = context.maxPerTransferBdt ?? 400000;
    if (context.amountBdt !== undefined && context.amountBdt > maxLimit) {
      return {
        passed: false,
        code: 'OVER_PER_TRANSFER_LIMIT',
        reason: `Transfer of ${context.amountBdt.toLocaleString()} BDT exceeds the per-transfer limit of ${maxLimit.toLocaleString()} BDT.`,
      };
    }
    return { passed: true };
  }
}

@Injectable()
export class DailyLimitRule implements ISafetyRule {
  readonly ruleName = 'DAILY_LIMIT_RULE';

  evaluate(context: SafetyRuleContext): SafetyRuleEvaluation {
    const dailyLimit = context.dailyLimitBdt ?? 1000000;
    const dailySpent = context.dailySpentBdt ?? 0;
    const amount = context.amountBdt ?? 0;

    if (dailySpent + amount > dailyLimit) {
      return {
        passed: false,
        code: 'OVER_DAILY_LIMIT',
        reason: `Transfer would cause total daily spending (${(dailySpent + amount).toLocaleString()} BDT) to exceed the daily limit of ${dailyLimit.toLocaleString()} BDT.`,
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

    if (amount > balance) {
      return {
        passed: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: `Insufficient funds. Required: ${amount.toLocaleString()} BDT, Available: ${balance.toLocaleString()} BDT.`,
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
