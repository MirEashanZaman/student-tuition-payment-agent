export interface Account {
  studentId: string;
  studentName: string;
  currency: string;
  balance: number;
  dailyLimit: number;
  dailySpent: number;
  remainingDailyLimit: number;
  approximateUsdEquivalent: number;
}

export interface AuthUser {
  studentId: string;
  studentName: string;
  email: string;
  role: string;
  balance: number;
  currency: string;
  dailyLimit?: number;
  dailySpent?: number;
}

export interface AuthSession {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface LoginCredentials {
  studentIdOrEmail: string;
  password: string;
}

export interface RouteItem {
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
  bestOverallRoute: RouteItem;
  cheapestRoute: RouteItem;
  fastestRoute: RouteItem;
  allRoutes: RouteItem[];
  scoringWeights: {
    costWeight: number;
    speedWeight: number;
    reliabilityWeight: number;
  };
}

export interface TransferDraft {
  transferId: string;
  status: 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SETTLED' | 'CANCELLED' | 'BLOCKED';
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

export interface TransferRecord {
  id: string;
  account_id: string;
  student_id: string;
  recipient_university: string;
  student_reg_number: string;
  source_currency: string;
  target_currency: string;
  target_amount_usd: number;
  source_amount_bdt: number;
  fee_total_bdt: number;
  fx_rate_applied: number;
  rate_id: string;
  provider_name: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'PROCESSING' | 'SETTLED' | 'CANCELLED' | 'BLOCKED';
  tuition_deadline?: string;
  estimated_delivery?: string;
  deadline_warning: boolean;
  confirmed_at?: string;
  why_recommended?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  event_type: string;
  permission_tier: 'READ_ONLY' | 'DRAFT' | 'EXECUTE';
  account_id?: string;
  transfer_id?: string;
  action_summary: string;
  details?: string;
  status: 'SUCCESS' | 'BLOCKED' | 'FLAGGED' | 'WARNING';
  ip_address: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  text: string;
  timestamp: string;
  comparisonData?: RouteComparisonResult;
  draftData?: TransferDraft;
  suggestedActions?: Array<{
    label: string;
    actionType: 'CONFIRM_DRAFT' | 'SELECT_ROUTE' | 'CHECK_BALANCE';
    payload: any;
  }>;
  securityFlags?: {
    isSuspicious: boolean;
    flaggedPatterns: string[];
  };
}
