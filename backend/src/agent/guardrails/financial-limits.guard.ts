export interface LimitValidationResult {
  isValid: boolean;
  reason?: string;
  code?: 'OVER_PER_TRANSFER_LIMIT' | 'OVER_DAILY_LIMIT' | 'INSUFFICIENT_FUNDS' | 'ANOMALOUS_AMOUNT' | 'INVALID_INPUT';
}

export class FinancialLimitsGuard {
  static readonly DEFAULT_PER_TRANSFER_LIMIT_BDT = 400000.00;
  static readonly DEFAULT_DAILY_LIMIT_BDT = 1000000.00;
  static readonly DEFAULT_ANOMALY_CEILING_LIMIT = 5000000.00;

  static getLimits() {
    return {
      perTransferLimit:
        parseFloat(process.env.MAX_TRANSFER_LIMIT_BDT || process.env.PER_TRANSFER_LIMIT || '') ||
        this.DEFAULT_PER_TRANSFER_LIMIT_BDT,
      dailyLimit:
        parseFloat(process.env.DAILY_TRANSFER_LIMIT_BDT || process.env.DAILY_TRANSFER_LIMIT || '') ||
        this.DEFAULT_DAILY_LIMIT_BDT,
      anomalyCeiling:
        parseFloat(process.env.ANOMALY_CEILING_LIMIT || '') ||
        this.DEFAULT_ANOMALY_CEILING_LIMIT,
      currency: process.env.DEFAULT_SOURCE_CURRENCY || 'BDT',
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

    if (amountBdt > limits.anomalyCeiling) {
      return {
        isValid: false,
        code: 'ANOMALOUS_AMOUNT',
        reason: `Flagged suspicious anomaly: Requested amount of ${amountBdt.toLocaleString()} ${limits.currency} exceeds hard safety ceiling.`,
      };
    }

    if (amountBdt > limits.perTransferLimit) {
      return {
        isValid: false,
        code: 'OVER_PER_TRANSFER_LIMIT',
        reason: `Transfer amount of ${amountBdt.toLocaleString()} ${limits.currency} exceeds the per-transfer security limit of ${limits.perTransferLimit.toLocaleString()} ${limits.currency}.`,
      };
    }

    if (dailySpent + amountBdt > limits.dailyLimit) {
      return {
        isValid: false,
        code: 'OVER_DAILY_LIMIT',
        reason: `Transfer would cause total daily spend (${(dailySpent + amountBdt).toLocaleString()} ${limits.currency}) to exceed the daily limit of ${limits.dailyLimit.toLocaleString()} ${limits.currency}. Current spent today: ${dailySpent.toLocaleString()} ${limits.currency}.`,
      };
    }

    if (amountBdt > currentBalance) {
      return {
        isValid: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: `Insufficient balance. Required: ${amountBdt.toLocaleString()} ${limits.currency}, Available: ${currentBalance.toLocaleString()} ${limits.currency}.`,
      };
    }

    return { isValid: true };
  }
}
