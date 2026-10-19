export interface InjectionCheckResult {
  isSuspicious: boolean;
  flaggedPatterns: string[];
  sanitizedText: string;
}

export class PromptInjectionFilter {
  private static readonly SUSPICIOUS_PATTERNS = [
    /ignore\s+(all\s+)?(previous\s+|prior\s+|existing\s+)?instructions?/i,
    /ignore\s+(this|the)\s+(system|security|safety|developer|policy)\s+prompt/i,
    /override\s+(transfer|daily|security|financial|permission|tier|safety|all)?\s*(limit|policy|rule|guardrail|tier)s?/i,
    /bypass\s+(all\s+)?(safety|guardrails|confirmation|verification|permission|tier|limit|policy|checks?)/i,
    /execute\s+(immediately|now|without\s+confirmation|without\s+approval|without\s+token)/i,
    /you\s+are\s+now\s+(in\s+developer\s+mode|[a-z0-9_-]*(?:admin|root|unrestricted|jailbroken))/i,
    /set\s+(your|the|my|account)?\s*(permission|access|role|tier)\s*(to|=|\:)\s*(execute|draft|read_only|read-only|admin|root|superuser)/i,
    /disregard\s+(the\s+)?(safety|security|financial|permission|tier)\s+(rules?|guardrails?|policies?)/i,
    /system\s+override/i,
    /drop\s+table/i,
    /delete\s+from\s+accounts/i,
    /transfer\s+all\s+funds/i,
    /set\s+balance\s*=/i,
    /new\s+system\s+prompt/i,
    /act\s+as\s+(admin|developer|root|system|unrestricted)/i,
    /dan\s+mode/i,
    /jailbreak/i,
    /developer\s+override/i,
    /(set|change|raise|increase|update|modify|lift|remove|disable)\s+(the\s+|my\s+|account\s+|transfer\s+|daily\s+)?(transfer|daily|financial|safety)?\s*limits?/i,
    /limit\s*(=|:|\s+to)\s*[0-9]+/i,
    /unlimited\s+(transfer|spending|balance|funds|allowance)/i,
    /(elevate|escalate|promote|grant|upgrade)\s+(my\s+|your\s+|user\s+)?(permission|tier|role|privilege|access|rights)/i,
    /grant\s+(me\s+)?(execute|admin|root|full)\s*(access|permission|tier|rights)?/i,
    /switch\s+(to|=)?\s*(execute|admin|root|superuser)\s*(tier|mode|role)?/i,
    /\[(system|instruction|developer|admin)\]/i,
    /<\s*(system|instruction|admin|override)\s*>/i,
    /###\s*instruction/i,
    /pretend\s+(you\s+are|to\s+be)\s+(an\s+)?unrestricted/i,
    /(system\s+prompt|system\s+instructions?)\s*(dump|leak|reveal|output|display)/i,
    /(output|display|show|reveal|dump|leak|repeat)\s+(your\s+)?(original\s+|initial\s+|system\s+)?(system\s+prompt|instructions?|rules?)/i,
  ];

  private static normalizeUserText(userInput: string): string {
    if (!userInput || typeof userInput !== 'string') {
      return '';
    }

    const capped = userInput.length > 20000 ? userInput.slice(0, 20000) : userInput;
    const normalized = capped
      .normalize('NFKC')
      .replace(/[\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g, '')
      .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return '';
    }

    return normalized;
  }

  private static escapeHtml(userInput: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return userInput.replace(/[&<>"']/g, (character) => entities[character]);
  }

  static sanitizeUserText(userInput: string): string {
    return this.escapeHtml(this.normalizeUserText(userInput));
  }

  static treatAsData(userInput: string): string {
    const sanitized = this.sanitizeUserText(userInput);
    return `[DATA_PAYLOAD]\n${sanitized}\n[/DATA_PAYLOAD]`;
  }

  static isLimitOrTierTampering(userInput: string): boolean {
    const normalized = this.normalizeUserText(userInput);
    const tamperingPatterns = [
      /(set|change|raise|increase|update|modify|lift|remove|disable|override)\s+(the\s+|my\s+|account\s+|transfer\s+|daily\s+)?(transfer|daily|financial|safety|permission)?\s*(limits?|tier|tiers|policy)/i,
      /limit\s*(=|:|\s+to)\s*[0-9]+/i,
      /unlimited\s+(transfer|spending|balance|funds|allowance)/i,
      /(elevate|escalate|promote|grant|upgrade|set|change|override)\s+(my\s+|your\s+|user\s+)?(permission|tier|role|privilege|access|rights)/i,
      /grant\s+(me\s+)?(execute|admin|root|full)\s*(access|permission|tier|rights)?/i,
      /switch\s+(to|=)?\s*(execute|admin|root|superuser)\s*(tier|mode|role)?/i,
      /set\s+(your|the|my|account)?\s*(permission|access|role|tier)\s*(to|=|\:)\s*(execute|draft|read_only|read-only|admin|root|superuser)/i,
    ];
    return tamperingPatterns.some((pattern) => pattern.test(normalized));
  }

  static inspect(userInput: string): InjectionCheckResult {
    if (!userInput) {
      return { isSuspicious: false, flaggedPatterns: [], sanitizedText: '' };
    }

    const normalizedInput = this.normalizeUserText(userInput);
    const flagged: string[] = [];

    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(normalizedInput)) {
        flagged.push(pattern.source);
      }
    }

    const sanitizedText = flagged.length > 0
      ? '[User content was blocked and treated as untrusted data only. No system rules, limits, or permission tiers were changed.]'
      : this.escapeHtml(normalizedInput);

    return {
      isSuspicious: flagged.length > 0,
      flaggedPatterns: flagged,
      sanitizedText,
    };
  }
}
