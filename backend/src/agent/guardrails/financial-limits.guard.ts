export interface LimitValidationResult {
  isValid: boolean;
  reason?: string;
  code?: 'OVER_PER_TRANSFER_LIMIT' | 'OVER_DAILY_LIMIT' | 'INSUFFICIENT_FUNDS' | 'ANOMALOUS_AMOUNT' | 'INVALID_INPUT';
}

export class FinancialLimitsGuard {
  static readonly DEFAULT_PER_TRANSFER_LIMIT_BDT = 400000.00;
  static readonly DEFAULT_DAILY_LIMIT_BDT = 1000000.00;

  static getLimits() {
    return {
      perTransferLimit: parseFloat(process.env.MAX_TRANSFER_LIMIT_BDT || '') || this.DEFAULT_PER_TRANSFER_LIMIT_BDT,
      dailyLimit: parseFloat(process.env.DAILY_TRANSFER_LIMIT_BDT || '') || this.DEFAULT_DAILY_LIMIT_BDT,
    };
  }

  static validateTransfer(
    amountBdt: number,
    currentBalance: number,
    dailySpent: number,
  ): LimitValidationResult {
    const limits = this.getLimits();

    if (isNaN(amountBdt) || amountBdt <= 0) {
      return {
        isValid: false,
        code: 'INVALID_INPUT',
        reason: 'Transfer amount must be a positive number greater than 0.',
      };
    }

    if (amountBdt > 5000000) {
      return {
        isValid: false,
        code: 'ANOMALOUS_AMOUNT',
        reason: `Flagged suspicious anomaly: Requested amount of ${amountBdt.toLocaleString()} BDT exceeds hard safety ceiling.`,
      };
    }

    if (amountBdt > limits.perTransferLimit) {
      return {
        isValid: false,
        code: 'OVER_PER_TRANSFER_LIMIT',
        reason: `Transfer amount of ${amountBdt.toLocaleString()} BDT exceeds the per-transfer security limit of ${limits.perTransferLimit.toLocaleString()} BDT.`,
      };
    }

    if (dailySpent + amountBdt > limits.dailyLimit) {
      return {
        isValid: false,
        code: 'OVER_DAILY_LIMIT',
        reason: `Transfer would cause total daily spend (${(dailySpent + amountBdt).toLocaleString()} BDT) to exceed the daily limit of ${limits.dailyLimit.toLocaleString()} BDT. Current spent today: ${dailySpent.toLocaleString()} BDT.`,
      };
    }

    if (amountBdt > currentBalance) {
      return {
        isValid: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: `Insufficient balance. Required: ${amountBdt.toLocaleString()} BDT, Available: ${currentBalance.toLocaleString()} BDT.`,
      };
    }

    return { isValid: true };
  }
}
