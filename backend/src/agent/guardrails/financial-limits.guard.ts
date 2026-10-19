export interface LimitValidationResult {
  isValid: boolean;
  reason?: string;
  code?: 'OVER_PER_TRANSFER_LIMIT' | 'OVER_DAILY_LIMIT' | 'OVER_ANNUAL_QUOTA' | 'INSUFFICIENT_FUNDS' | 'ANOMALOUS_AMOUNT' | 'INVALID_INPUT';
}

export class FinancialLimitsGuard {
  static readonly DEFAULT_PER_TRANSFER_LIMIT_BDT = 400000.00;
  static readonly DEFAULT_DAILY_LIMIT_BDT = 1000000.00;
  static readonly DEFAULT_ANOMALY_CEILING_LIMIT = 5000000.00;
  static readonly DEFAULT_ANNUAL_QUOTA_BDT = 1500000.00;

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
      annualQuota:
        parseFloat(process.env.ANNUAL_STUDENT_QUOTA_BDT || '') ||
        this.DEFAULT_ANNUAL_QUOTA_BDT,
      currency: process.env.DEFAULT_SOURCE_CURRENCY || 'BDT',
    };
  }

  static validateAnomaly(
    amountBdt: number,
    currentBalance?: number,
  ): LimitValidationResult {
    const limits = this.getLimits();

    if (isNaN(amountBdt) || !Number.isFinite(amountBdt) || amountBdt <= 0) {
      return {
        isValid: false,
        code: 'INVALID_INPUT',
        reason: 'Transfer amount must be a positive finite number greater than 0.',
      };
    }

    if (amountBdt > limits.anomalyCeiling) {
      return {
        isValid: false,
        code: 'ANOMALOUS_AMOUNT',
        reason: `Flagged suspicious anomaly: Requested amount of ${amountBdt.toLocaleString()} ${limits.currency} exceeds hard safety ceiling of ${limits.anomalyCeiling.toLocaleString()} ${limits.currency}.`,
      };
    }

    return { isValid: true };
  }

  static validateTransfer(
    amountBdt: number,
    currentBalance: number,
    dailySpent: number,
    annualSpent?: number,
  ): LimitValidationResult {
    const anomalyCheck = this.validateAnomaly(amountBdt, currentBalance);
    if (!anomalyCheck.isValid) {
      return anomalyCheck;
    }

    const limits = this.getLimits();
    const safeBalance = !isNaN(currentBalance) && Number.isFinite(currentBalance) ? currentBalance : 0;
    const safeDailySpent = !isNaN(dailySpent) && Number.isFinite(dailySpent) ? dailySpent : 0;
    const projectedDailySpent = +(safeDailySpent + amountBdt).toFixed(2);

    if (amountBdt > limits.perTransferLimit) {
      return {
        isValid: false,
        code: 'OVER_PER_TRANSFER_LIMIT',
        reason: `Transfer amount of ${amountBdt.toLocaleString()} ${limits.currency} exceeds the per-transfer security limit of ${limits.perTransferLimit.toLocaleString()} ${limits.currency}.`,
      };
    }

    if (projectedDailySpent > limits.dailyLimit) {
      return {
        isValid: false,
        code: 'OVER_DAILY_LIMIT',
        reason: `Transfer would cause total daily spend (${projectedDailySpent.toLocaleString()} ${limits.currency}) to exceed the daily limit of ${limits.dailyLimit.toLocaleString()} ${limits.currency}. Current spent today: ${safeDailySpent.toLocaleString()} ${limits.currency}.`,
      };
    }

    if (annualSpent !== undefined) {
      const safeAnnualSpent = !isNaN(annualSpent) && Number.isFinite(annualSpent) ? annualSpent : 0;
      const projectedAnnual = +(safeAnnualSpent + amountBdt).toFixed(2);
      if (projectedAnnual > limits.annualQuota) {
        return {
          isValid: false,
          code: 'OVER_ANNUAL_QUOTA',
          reason: `Transfer would cause total academic year spend (${projectedAnnual.toLocaleString()} ${limits.currency}) to exceed the Bangladesh Bank annual student quota of ${limits.annualQuota.toLocaleString()} ${limits.currency}. Current spent this academic year: ${safeAnnualSpent.toLocaleString()} ${limits.currency}.`,
        };
      }
    }

    if (amountBdt > safeBalance) {
      return {
        isValid: false,
        code: 'INSUFFICIENT_FUNDS',
        reason: `Insufficient balance. Required: ${amountBdt.toLocaleString()} ${limits.currency}, Available: ${safeBalance.toLocaleString()} ${limits.currency}.`,
      };
    }

    return { isValid: true };
  }
}
