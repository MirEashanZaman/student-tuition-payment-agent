import { Injectable } from '@nestjs/common';
import { RateRecord } from '../../database/database.service';
import { RouteComparisonItem } from '../tools/agent-tools.interface';
import { RouteScoringStrategy } from '../strategies/route-scoring.strategy';
import {
  ITuitionCalculator,
  RouteCostBreakdown,
  DeadlineEvaluation,
  InstallmentPlan,
  InstallmentMilestone,
} from './tuition-calculation.interface';

@Injectable()
export class TuitionCalculationService implements ITuitionCalculator {
  calculateRouteCost(
    amountUsd: number,
    route: RateRecord,
    benchmarkRateBdt = parseFloat(process.env.BENCHMARK_RATE_BDT || '') || 119.0,
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

  calculateInstallmentPlan(
    totalAmountUsd: number,
    numInstallments: number,
    route: RateRecord,
    tuitionDeadline?: string,
    benchmarkRateBdt = parseFloat(process.env.BENCHMARK_RATE_BDT || '') || 119.0,
  ): InstallmentPlan {
    const validCount = numInstallments === 3 ? 3 : 2;
    const percentages = validCount === 3 ? [0.4, 0.3, 0.3] : [0.5, 0.5];
    const now = new Date();
    const finalDeadline = tuitionDeadline ? new Date(tuitionDeadline) : new Date(now.getTime() + 30 * 86400 * 1000);
    const totalTimeSpanMs = Math.max(86400 * 1000, finalDeadline.getTime() - now.getTime());

    let totalBdtWithFees = 0;
    const perTransferCapBdt =
      parseFloat(process.env.MAX_TRANSFER_LIMIT_BDT || process.env.PER_TRANSFER_LIMIT || '') || 400000;
    let allWithinTransferCap = true;

    const milestones: InstallmentMilestone[] = percentages.map((pct, idx) => {
      const amountUsd = +(totalAmountUsd * pct).toFixed(2);
      const cost = this.calculateRouteCost(amountUsd, route, benchmarkRateBdt);
      const totalCostBdt = +(cost.sourceAmountBdt + cost.totalFeeBdt).toFixed(2);
      totalBdtWithFees = +(totalBdtWithFees + totalCostBdt).toFixed(2);

      const milestoneOffsetMs = (totalTimeSpanMs / validCount) * idx;
      const scheduledDateObj = new Date(now.getTime() + milestoneOffsetMs);
      const targetDeadlineForMilestone = new Date(
        now.getTime() + (totalTimeSpanMs / validCount) * (idx + 1),
      );

      const deadlineEval = this.evaluateDeadline(
        route.speed_hours,
        targetDeadlineForMilestone.toISOString(),
        scheduledDateObj,
      );

      const transferLimitExceeded = cost.sourceAmountBdt > perTransferCapBdt;
      if (transferLimitExceeded) allWithinTransferCap = false;

      return {
        installmentNumber: idx + 1,
        portionPercentage: Math.round(pct * 100),
        amountUsd,
        sourceAmountBdt: cost.sourceAmountBdt,
        totalFeeBdt: cost.totalFeeBdt,
        totalCostBdt,
        scheduledDate: scheduledDateObj.toISOString(),
        isDeadlineSafe: !deadlineEval.deadlineWarning,
        deadlineNotice: deadlineEval.deadlineNotice,
        transferLimitExceeded,
      };
    });

    return {
      totalAmountUsd,
      numInstallments: validCount,
      providerName: route.provider_name,
      routeId: route.id,
      totalBdtWithFees,
      perTransferCapBdt,
      allWithinTransferCap,
      milestones,
    };
  }
}
