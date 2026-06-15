import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { TrialState } from "@prisma/client";
import { getSessionUser } from "@/lib/session";
import { dashboardStats } from "@/server/queries";
import { Card, PageHeader } from "@/components/ui";
import { STATE_PILL } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();
  const { byState, total } = await dashboardStats(user);
  const counts = new Map(byState.map((s) => [s.state, s._count._all]));

  const accepted = counts.get(TrialState.ACCEPTED) ?? 0;
  const rejected = counts.get(TrialState.REJECTED) ?? 0;
  const decided = accepted + rejected;
  const acceptanceRate = decided ? Math.round((accepted / decided) * 100) : 0;

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
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>
    </div>
  );
}
