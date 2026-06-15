// Aggregate math — ports the stored avg_* compute from Odoo (mean over all followups; empty → 0).

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export interface FollowupMeasures {
  germinationRate?: number | string | null;
  growthCm?: number | string | null;
  productionQty?: number | string | null;
}

export interface Aggregates {
  avgGermination: number;
  avgGrowth: number;
  avgProduction: number;
}

const num = (v: number | string | null | undefined) => Number(v ?? 0);

export function computeAggregates(followups: FollowupMeasures[]): Aggregates {
  return {
    avgGermination: mean(followups.map((f) => num(f.germinationRate))),
    avgGrowth: mean(followups.map((f) => num(f.growthCm))),
    avgProduction: mean(followups.map((f) => num(f.productionQty))),
  };
}
