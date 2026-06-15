import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { hasAtLeast } from "@/lib/authz";
import { Role } from "@prisma/client";
import { seasonComparison } from "@/server/analytics";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { SeasonCharts } from "@/components/analytics/SeasonCharts";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasAtLeast(user.role, Role.MANAGER)) redirect("/dashboard");
  const t = await getTranslations();
  const { seasons, bySeason } = await seasonComparison(user);
  const nameOf = new Map(seasons.map((s) => [s.id, s.name]));

  const data = bySeason.map((r) => ({
    season: r.seasonId ? (nameOf.get(r.seasonId) ?? "—") : "—",
    germination: Math.round(r.avgGermination * 100) / 100,
    production: Math.round(r.avgProduction * 100) / 100,
  }));

  return (
    <div>
      <PageHeader title={t("nav.analytics")} />
      {data.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <Card>
          <SeasonCharts data={data} />
        </Card>
      )}
    </div>
  );
}
