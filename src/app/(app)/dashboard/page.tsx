import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrialState } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { scopeTrialsWhere } from "@/lib/authz";
import { dashboardStats, listFollowups } from "@/server/queries";
import { seasonComparison } from "@/server/analytics";
import { Card, PageHeader } from "@/components/ui";
import { SeasonCharts } from "@/components/analytics/SeasonCharts";
import { STATE_PILL, fmtNum, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();

  const [{ byState, total }, comparison, followups, pendingAnalysis] = await Promise.all([
    dashboardStats(user),
    seasonComparison(user),
    listFollowups(user),
    prisma.trial.count({
      where: { state: TrialState.REVIEW, recommendation: null, ...scopeTrialsWhere(user) },
    }),
  ]);

  const counts = new Map(byState.map((s) => [s.state, s._count._all]));
  const accepted = counts.get(TrialState.ACCEPTED) ?? 0;
  const rejected = counts.get(TrialState.REJECTED) ?? 0;
  const decided = accepted + rejected;
  const acceptanceRate = decided ? Math.round((accepted / decided) * 100) : 0;

  const nameOf = new Map(comparison.seasons.map((s) => [s.id, s.name]));
  const chartData = comparison.bySeason.map((r) => ({
    season: r.seasonId ? (nameOf.get(r.seasonId) ?? "—") : "—",
    germination: Math.round(r.avgGermination * 100) / 100,
    production: Math.round(r.avgProduction * 100) / 100,
  }));

  return (
    <div>
      <PageHeader title={t("nav.dashboard")} />

      <div className="mb-6 flex flex-wrap gap-3">
        {Object.values(TrialState).map((s) => (
          <Link
            key={s}
            href={`/trials?state=${s}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${STATE_PILL[s]}`}
          >
            {t(`state.${s}`)}: {counts.get(s) ?? 0}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="text-sm text-muted">Acceptance rate</div>
          <div className="text-3xl font-bold text-success">{acceptanceRate}%</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">{t("nav.trials")}</div>
          <div className="text-3xl font-bold text-ink-strong">{total}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">{t("state.ACCEPTED")}</div>
          <div className="text-3xl font-bold text-brand-action">{accepted}</div>
        </Card>
        <Card>
          <div className="text-sm text-muted">{t("trial.tabAnalysis")}</div>
          <div className="text-3xl font-bold text-warning">{pendingAnalysis}</div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink-strong">{t("nav.analytics")}</h2>
          {chartData.length > 0 ? (
            <SeasonCharts data={chartData} />
          ) : (
            <p className="text-sm text-muted">{t("empty.generic")}</p>
          )}
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold text-ink-strong">{t("nav.followups")}</h2>
          {followups.length === 0 ? (
            <p className="text-sm text-muted">{t("empty.followups")}</p>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {followups.slice(0, 8).map((f) => (
                <li key={f.id} className="flex items-center justify-between py-2">
                  <Link href={`/trials/${f.trialId}`} className="text-brand-link hover:underline">
                    {f.trial.code}
                  </Link>
                  <span className="text-muted">
                    {f.distribution.nursery.name} · {fmtDate(f.measurementDate)} ·{" "}
                    {fmtNum(f.germinationRate)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
