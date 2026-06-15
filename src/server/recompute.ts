import { Prisma } from "@prisma/client";
import { computeAggregates } from "@/lib/aggregates";

const dec = (n: number) => new Prisma.Decimal(n);
const toMeasures = (
  rows: { germinationRate: Prisma.Decimal | null; growthCm: Prisma.Decimal | null; productionQty: Prisma.Decimal | null }[],
) =>
  rows.map((f) => ({
    germinationRate: f.germinationRate?.toString(),
    growthCm: f.growthCm?.toString(),
    productionQty: f.productionQty?.toString(),
  }));

// Recompute stored avg_* on the distribution and its trial after any followup change.
export async function recomputeAggregates(
  tx: Prisma.TransactionClient,
  distributionId: string,
  trialId: string,
): Promise<void> {
  const distRows = await tx.followup.findMany({
    where: { distributionId },
    select: { germinationRate: true, growthCm: true, productionQty: true },
  });
  const d = computeAggregates(toMeasures(distRows));
  await tx.distribution.update({
    where: { id: distributionId },
    data: {
      avgGermination: dec(d.avgGermination),
      avgGrowth: dec(d.avgGrowth),
      avgProduction: dec(d.avgProduction),
    },
  });

  const trialRows = await tx.followup.findMany({
    where: { trialId },
    select: { germinationRate: true, growthCm: true, productionQty: true },
  });
  const t = computeAggregates(toMeasures(trialRows));
  await tx.trial.update({
    where: { id: trialId },
    data: {
      avgGermination: dec(t.avgGermination),
      avgGrowth: dec(t.avgGrowth),
      avgProduction: dec(t.avgProduction),
    },
  });
}
