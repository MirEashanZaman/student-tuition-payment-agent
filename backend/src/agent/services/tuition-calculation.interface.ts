import { RateRecord } from '../../database/database.service';
import { RouteComparisonItem } from '../tools/agent-tools.interface';
import { RouteScoringStrategy } from '../strategies/route-scoring.strategy';

export interface RouteCostBreakdown {
  sourceAmountBdt: number;
  flatFeeBdt: number;
  percentageFeeBdt: number;
  totalFeeBdt: number;
  fxMarkupLossBdt: number;
  totalCostBdt: number;
}

export interface DeadlineEvaluation {
  estimatedDelivery: Date;
  deadlineWarning: boolean;
  deadlineNotice?: string;
}

export interface ITuitionCalculator {
  calculateRouteCost(amountUsd: number, route: RateRecord, benchmarkRateBdt?: number): RouteCostBreakdown;
  evaluateDeadline(routeSpeedHours: number, tuitionDeadline?: string, fromDate?: Date): DeadlineEvaluation;
  rankRoutes(routes: RouteComparisonItem[], strategy?: RouteScoringStrategy): RouteComparisonItem[];
}

export const TUITION_CALCULATOR_TOKEN = Symbol('ITuitionCalculator');
