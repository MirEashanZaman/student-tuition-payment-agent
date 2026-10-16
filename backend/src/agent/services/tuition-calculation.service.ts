import { Injectable } from '@nestjs/common';
import { RateRecord } from '../../database/database.service';
import { RouteComparisonItem } from '../tools/agent-tools.interface';
import { RouteScoringStrategy } from '../strategies/route-scoring.strategy';
import {
  ITuitionCalculator,
  RouteCostBreakdown,
  DeadlineEvaluation,
} from './tuition-calculation.interface';

@Injectable()
export class TuitionCalculationService implements ITuitionCalculator {
  calculateRouteCost(
    amountUsd: number,
    route: RateRecord,
    benchmarkRateBdt = 119.0,
  ): RouteCostBreakdown {
    const sourceAmountBdt = +(amountUsd * route.inverse_rate).toFixed(2);
    const flatFeeBdt = route.transfer_fee_flat_bdt;
    const percentageFeeBdt = +(sourceAmountBdt * route.transfer_fee_percent).toFixed(2);
    const totalFeeBdt = +(flatFeeBdt + percentageFeeBdt).toFixed(2);

    const fxMarkupLossBdt = +(
      Math.max(0, route.inverse_rate - benchmarkRateBdt) * amountUsd
    ).toFixed(2);

    const totalCostBdt = +(totalFeeBdt + fxMarkupLossBdt).toFixed(2);

    return {
      sourceAmountBdt,
      flatFeeBdt,
      percentageFeeBdt,
      totalFeeBdt,
      fxMarkupLossBdt,
      totalCostBdt,
    };
  }

  evaluateDeadline(
    routeSpeedHours: number,
    tuitionDeadline?: string,
    fromDate = new Date(),
  ): DeadlineEvaluation {
    const estimatedDelivery = new Date(fromDate.getTime() + routeSpeedHours * 3600 * 1000);
    const deadlineDate = tuitionDeadline ? new Date(tuitionDeadline) : undefined;
    let deadlineWarning = false;
    let deadlineNotice: string | undefined;

    if (deadlineDate && !isNaN(deadlineDate.getTime())) {
      if (estimatedDelivery > deadlineDate) {
        deadlineWarning = true;
        const diffHours = Math.ceil(
          (estimatedDelivery.getTime() - deadlineDate.getTime()) / (3600 * 1000),
        );
        deadlineNotice = `CRITICAL WARNING: Arrives ~${diffHours}h AFTER your tuition deadline! Late fees or registration block may apply.`;
      } else {
        deadlineNotice = 'Safe: Arrives before your tuition deadline.';
      }
    }

    return {
      estimatedDelivery,
      deadlineWarning,
      deadlineNotice,
    };
  }

  rankRoutes(
    routes: RouteComparisonItem[],
    strategy?: RouteScoringStrategy,
  ): RouteComparisonItem[] {
    if (routes.length === 0) return [];

    const minCost = Math.min(...routes.map((r) => r.totalCostBdt));
    const maxCost = Math.max(...routes.map((r) => r.totalCostBdt));
    const minHours = Math.min(...routes.map((r) => r.speedHours));
    const maxHours = Math.max(...routes.map((r) => r.speedHours));

    const weights = strategy
      ? strategy.getWeights()
      : { costWeight: 0.5, speedWeight: 0.3, reliabilityWeight: 0.2 };

    routes.forEach((r) => {
      const costScore =
        maxCost === minCost ? 100 : ((maxCost - r.totalCostBdt) / (maxCost - minCost)) * 100;
      const speedScore =
        maxHours === minHours ? 100 : ((maxHours - r.speedHours) / (maxHours - minHours)) * 100;
      const relScore = r.reliabilityScore * 100;
      const deadlinePenalty = r.deadlineWarning ? 40 : 0;

      const rawComposite =
        weights.costWeight * costScore +
        weights.speedWeight * speedScore +
        weights.reliabilityWeight * relScore -
        deadlinePenalty;

      r.compositeScore = +Math.max(0, rawComposite).toFixed(1);
    });

    routes.sort((a, b) => b.compositeScore - a.compositeScore);

    routes.forEach((r, idx) => {
      r.rank = idx + 1;
      if (idx === 0) {
        r.recommendationReason = r.deadlineWarning
          ? 'Highest ranked available, but please note arrival date warning.'
          : strategy
          ? strategy.getRecommendationReason()
          : 'Best Overall: Optimal balance of lowest fees, fast clearance, and 99% reliability.';
      } else if (r.speedHours === minHours) {
        r.recommendationReason =
          'Fastest Rail: Clears in 4 hours; ideal for urgent immediate tuition deadlines.';
      } else if (r.totalCostBdt === minCost) {
        r.recommendationReason = 'Lowest Raw Cost: Minimal processing fees.';
      } else {
        r.recommendationReason = 'Standard clearing rail with higher legacy telegraphic fees.';
      }
    });

    return routes;
  }
}
