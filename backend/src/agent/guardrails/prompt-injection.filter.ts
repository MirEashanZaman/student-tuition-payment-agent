export interface InjectionCheckResult {
  isSuspicious: boolean;
  flaggedPatterns: string[];
  sanitizedText: string;
}

export class PromptInjectionFilter {
  private static readonly SUSPICIOUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /override\s+(transfer|daily|security|financial)\s+limit/i,
    /bypass\s+(safety|guardrails|confirmation|verification)/i,
    /execute\s+(immediately|now|without\s+confirmation)/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /system\s+override/i,
    /drop\s+table/i,
    /delete\s+from\s+accounts/i,
    /transfer\s+all\s+funds/i,
    /set\s+balance\s*=/i,
  ];

  static inspect(userInput: string): InjectionCheckResult {
    if (!userInput) {
      return { isSuspicious: false, flaggedPatterns: [], sanitizedText: '' };
    }

    const flagged: string[] = [];
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(userInput)) {
        flagged.push(pattern.source);
      }
    }

    const sanitizedText = userInput
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
      .trim();

    return {
      isSuspicious: flagged.length > 0,
      flaggedPatterns: flagged,
      sanitizedText,
    };
  }
}
