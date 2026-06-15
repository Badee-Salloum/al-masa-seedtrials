import { prisma } from "@/lib/prisma";
import { scopeTrialsWhere, type SessionUser } from "@/lib/authz";
import type { TrialState } from "@prisma/client";

export interface SeasonComparison {
  seasons: { id: string; name: string }[];
  // per season: avg germination + avg production (graph)
  bySeason: { seasonId: string | null; avgGermination: number; avgProduction: number }[];
  // per season × state: avg germination (pivot)
  pivot: { seasonId: string | null; state: TrialState; avgGermination: number; count: number }[];
}

const n = (d: { toString(): string } | null) => (d == null ? 0 : Number(d.toString()));

export async function seasonComparison(user: SessionUser): Promise<SeasonComparison> {
  const where = scopeTrialsWhere(user);

  const [bySeasonRaw, pivotRaw, seasons] = await Promise.all([
    prisma.trial.groupBy({
      by: ["seasonId"],
      where,
      _avg: { avgGermination: true, avgProduction: true },
    }),
    prisma.trial.groupBy({
      by: ["seasonId", "state"],
      where,
      _avg: { avgGermination: true },
      _count: { _all: true },
    }),
    prisma.season.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  return {
    seasons,
    bySeason: bySeasonRaw.map((r) => ({
      seasonId: r.seasonId,
      avgGermination: n(r._avg.avgGermination),
      avgProduction: n(r._avg.avgProduction),
    })),
    pivot: pivotRaw.map((r) => ({
      seasonId: r.seasonId,
      state: r.state,
      avgGermination: n(r._avg.avgGermination),
      count: r._count._all,
    })),
  };
}
