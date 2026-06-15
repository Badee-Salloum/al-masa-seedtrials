import { describe, it, expect } from "vitest";
import { mean, computeAggregates } from "./aggregates";

describe("mean", () => {
  it("empty → 0", () => expect(mean([])).toBe(0));
  it("[80,90] → 85", () => expect(mean([80, 90])).toBe(85));
});

describe("computeAggregates (test_aggregates parity)", () => {
  it("no followups → zeros", () =>
    expect(computeAggregates([])).toEqual({
      avgGermination: 0,
      avgGrowth: 0,
      avgProduction: 0,
    }));

  it("means across followups", () =>
    expect(
      computeAggregates([
        { germinationRate: 80, growthCm: 10, productionQty: 100 },
        { germinationRate: 90, growthCm: 20, productionQty: 200 },
      ]),
    ).toEqual({ avgGermination: 85, avgGrowth: 15, avgProduction: 150 }));

  it("treats missing measures as 0", () =>
    expect(
      computeAggregates([{ germinationRate: 80 }, { germinationRate: 100 }])
        .avgGermination,
    ).toBe(90));
});
