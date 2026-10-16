export interface InjectionCheckResult {
  isSuspicious: boolean;
  flaggedPatterns: string[];
  sanitizedText: string;
}

export class PromptInjectionFilter {
  private static readonly SUSPICIOUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions?/i,
    /ignore\s+(this|the)\s+(system|security|safety|developer|policy)\s+prompt/i,
    /override\s+(transfer|daily|security|financial|permission|tier)\s+(limit|policy|rule|guardrail)/i,
    /bypass\s+(safety|guardrails|confirmation|verification|permission|tier|limit|policy)/i,
    /execute\s+(immediately|now|without\s+confirmation|without\s+approval)/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /set\s+(your|the)\s+(permission|access|role|tier)\s+(to|=)\s*(execute|draft|read_only|read-only|draft|execute)/i,
    /disregard\s+(the\s+)?(safety|security|financial|permission|tier)\s+(rules?|guardrails?|policies?)/i,
    /system\s+override/i,
    /drop\s+table/i,
    /delete\s+from\s+accounts/i,
    /transfer\s+all\s+funds/i,
    /set\s+balance\s*=/i,
    /new\s+system\s+prompt/i,
    /act\s+as\s+(admin|developer|root|system)/i,
  ];

  static sanitizeUserText(userInput: string): string {
    if (!userInput) {
      return '';
    }

    const normalized = userInput
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return '';
    }

    return normalized;
  }

  static inspect(userInput: string): InjectionCheckResult {
    if (!userInput) {
      return { isSuspicious: false, flaggedPatterns: [], sanitizedText: '' };
    }

    const normalizedInput = this.sanitizeUserText(userInput);
    const flagged: string[] = [];

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(normalizedInput)) {
        flagged.push(pattern.source);
      }
    }

    const sanitizedText = flagged.length > 0
      ? '[User content was blocked and treated as untrusted data only. No system rules, limits, or permission tiers were changed.]'
      : normalizedInput;

    return {
      isSuspicious: flagged.length > 0,
      flaggedPatterns: flagged,
      sanitizedText,
    };
  }
}
