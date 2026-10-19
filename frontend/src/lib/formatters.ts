export interface FinancialBoundaries {
  perTransferLimit: number;
  dailyLimit: number;
  annualQuota: number;
  defaultCurrency: string;
  systemTimezone: string;
  apiBaseUrl: string;
}

export function getFinancialBoundaries(): FinancialBoundaries {
  const perTransferLimit =
    parseFloat(process.env.NEXT_PUBLIC_MAX_TRANSFER_LIMIT || '') || 400000.0;
  const dailyLimit =
    parseFloat(process.env.NEXT_PUBLIC_DAILY_TRANSFER_LIMIT || '') || 1000000.0;
  const annualQuota =
    parseFloat(process.env.NEXT_PUBLIC_ANNUAL_STUDENT_QUOTA_BDT || '') || 1500000.0;
  const defaultCurrency = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'BDT';
  const systemTimezone =
    process.env.NEXT_PUBLIC_TIMEZONE ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4568/api';

  return {
    perTransferLimit,
    dailyLimit,
    annualQuota,
    defaultCurrency,
    systemTimezone,
    apiBaseUrl,
  };
}

export function formatCurrency(
  amount: number,
  currencyCode?: string,
  locale?: string,
): string {
  const currency = currencyCode || process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'BDT';
  const activeLocale =
    locale ||
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US');

  try {
    return new Intl.NumberFormat(activeLocale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(activeLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  }
}

export function formatDateTime(
  dateInput: Date | string | number,
  timezone?: string,
  locale?: string,
): string {
  const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return '';
  }

  const activeTimezone =
    timezone ||
    process.env.NEXT_PUBLIC_TIMEZONE ||
    (typeof Intl !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC');
  const activeLocale =
    locale ||
    process.env.NEXT_PUBLIC_DEFAULT_LOCALE ||
    (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-US');

  try {
    return new Intl.DateTimeFormat(activeLocale, {
      timeZone: activeTimezone,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
