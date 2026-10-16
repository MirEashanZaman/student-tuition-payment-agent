export interface RouteComparisonItem {
  routeId: string;
  providerName: string;
  sourceAmountBdt: number;
  targetAmountUsd: number;
  exchangeRate: number;
  inverseRate: number;
  flatFeeBdt: number;
  percentageFeeBdt: number;
  totalFeeBdt: number;
  fxMarkupLossBdt: number;
  totalCostBdt: number;
  speedHours: number;
  speedDescription: string;
  reliabilityScore: number;
  complianceRating: string;
  compositeScore: number;
  rank: number;
  estimatedDeliveryDate: string;
  deadlineWarning: boolean;
  deadlineNotice?: string;
  recommendationReason: string;
}

export interface RouteComparisonResult {
  studentId: string;
  targetAmountUsd: number;
  tuitionDeadline?: string;
  bestOverallRoute: RouteComparisonItem;
  cheapestRoute: RouteComparisonItem;
  fastestRoute: RouteComparisonItem;
  allRoutes: RouteComparisonItem[];
  scoringWeights: {
    costWeight: number;
    speedWeight: number;
    reliabilityWeight: number;
  };
}

export interface DraftTransferResult {
  transferId: string;
  status: 'PENDING_CONFIRMATION';
  studentId: string;
  studentName: string;
  recipientUniversity: string;
  studentRegNumber: string;
  targetAmountUsd: number;
  sourceAmountBdt: number;
  totalFeeBdt: number;
  providerName: string;
  confirmationToken: string;
  expiresInMinutes: number;
  deadlineWarning: boolean;
  estimatedDeliveryDate: string;
  actionRequired: string;
}

export interface ConfirmedTransferResult {
  transferId: string;
  status: 'CONFIRMED';
  studentId: string;
  newBalanceBdt: number;
  dailySpentBdt: number;
  deductedBdt: number;
  providerName: string;
  recipientUniversity: string;
  targetAmountUsd: number;
  confirmedAt: string;
  auditLogId: string;
}
