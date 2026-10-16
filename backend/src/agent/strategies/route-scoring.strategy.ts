import { Injectable } from '@nestjs/common';

export interface RouteScoreInput {
  cost: number;
  minCost: number;
  maxCost: number;
  speedHours: number;
  minSpeed: number;
  maxSpeed: number;
  reliability: number;
}

export interface RouteScoringStrategy {
  readonly name: string;
  calculateScore(input: RouteScoreInput): number;
  getRecommendationReason(): string;
  getWeights(): { costWeight: number; speedWeight: number; reliabilityWeight: number };
}

@Injectable()
export class BalancedScoringStrategy implements RouteScoringStrategy {
  readonly name = 'balanced';

  calculateScore(input: RouteScoreInput): number {
    const costRange = input.maxCost - input.minCost || 1;
    const speedRange = input.maxSpeed - input.minSpeed || 1;

    const costNorm = (input.cost - input.minCost) / costRange;
    const speedNorm = (input.speedHours - input.minSpeed) / speedRange;
    const relNorm = input.reliability / 100;

    const score = 0.45 * (1 - costNorm) + 0.30 * (1 - speedNorm) + 0.25 * relNorm;
    return Math.round(score * 1000) / 1000;
  }

  getRecommendationReason(): string {
    return 'Optimized across tuition exchange rate, processing speed, and institutional reliability.';
  }

  getWeights() {
    return { costWeight: 0.45, speedWeight: 0.30, reliabilityWeight: 0.25 };
  }
}

@Injectable()
export class CheapestScoringStrategy implements RouteScoringStrategy {
  readonly name = 'cheapest';

  calculateScore(input: RouteScoreInput): number {
    const costRange = input.maxCost - input.minCost || 1;
    const speedRange = input.maxSpeed - input.minSpeed || 1;

    const costNorm = (input.cost - input.minCost) / costRange;
    const speedNorm = (input.speedHours - input.minSpeed) / speedRange;
    const relNorm = input.reliability / 100;

    const score = 0.80 * (1 - costNorm) + 0.10 * (1 - speedNorm) + 0.10 * relNorm;
    return Math.round(score * 1000) / 1000;
  }

  getRecommendationReason(): string {
    return 'Ranked strictly for lowest total BDT cost and highest foreign currency yield.';
  }

  getWeights() {
    return { costWeight: 0.80, speedWeight: 0.10, reliabilityWeight: 0.10 };
  }
}

@Injectable()
export class FastestScoringStrategy implements RouteScoringStrategy {
  readonly name = 'fastest';

  calculateScore(input: RouteScoreInput): number {
    const costRange = input.maxCost - input.minCost || 1;
    const speedRange = input.maxSpeed - input.minSpeed || 1;

    const costNorm = (input.cost - input.minCost) / costRange;
    const speedNorm = (input.speedHours - input.minSpeed) / speedRange;
    const relNorm = input.reliability / 100;

    const score = 0.10 * (1 - costNorm) + 0.80 * (1 - speedNorm) + 0.10 * relNorm;
    return Math.round(score * 1000) / 1000;
  }

  getRecommendationReason(): string {
    return 'Prioritizes rapid same-day settlement to guarantee university deadlines are met.';
  }

  getWeights() {
    return { costWeight: 0.10, speedWeight: 0.80, reliabilityWeight: 0.10 };
  }
}

@Injectable()
export class ReliableScoringStrategy implements RouteScoringStrategy {
  readonly name = 'reliable';

  calculateScore(input: RouteScoreInput): number {
    const costRange = input.maxCost - input.minCost || 1;
    const speedRange = input.maxSpeed - input.minSpeed || 1;

    const costNorm = (input.cost - input.minCost) / costRange;
    const speedNorm = (input.speedHours - input.minSpeed) / speedRange;
    const relNorm = input.reliability / 100;

    const score = 0.15 * (1 - costNorm) + 0.15 * (1 - speedNorm) + 0.70 * relNorm;
    return Math.round(score * 1000) / 1000;
  }

  getRecommendationReason(): string {
    return 'Selected for highest institutional trust rating and direct clearing reliability.';
  }

  getWeights() {
    return { costWeight: 0.15, speedWeight: 0.15, reliabilityWeight: 0.70 };
  }
}

@Injectable()
export class RouteScoringStrategyFactory {
  constructor(
    private readonly balanced: BalancedScoringStrategy,
    private readonly cheapest: CheapestScoringStrategy,
    private readonly fastest: FastestScoringStrategy,
    private readonly reliable: ReliableScoringStrategy,
  ) {}

  getStrategy(preference?: string): RouteScoringStrategy {
    const normalized = (preference || '').toLowerCase().trim();
    if (normalized.includes('fast') || normalized.includes('speed') || normalized.includes('urgent')) {
      return this.fastest;
    }
    if (normalized.includes('cheap') || normalized.includes('cost') || normalized.includes('rate') || normalized.includes('low')) {
      return this.cheapest;
    }
    if (normalized.includes('relia') || normalized.includes('trust') || normalized.includes('safe')) {
      return this.reliable;
    }
    return this.balanced;
  }
}
