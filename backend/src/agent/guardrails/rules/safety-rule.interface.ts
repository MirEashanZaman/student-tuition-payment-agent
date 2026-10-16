export interface SafetyRuleContext {
  amountBdt?: number;
  balanceBdt?: number;
  dailySpentBdt?: number;
  dailyLimitBdt?: number;
  maxPerTransferBdt?: number;
  [key: string]: any;
}

export interface SafetyRuleEvaluation {
  passed: boolean;
  code?: string;
  reason?: string;
}

export interface ISafetyRule {
  readonly ruleName: string;
  evaluate(context: SafetyRuleContext): SafetyRuleEvaluation;
}
