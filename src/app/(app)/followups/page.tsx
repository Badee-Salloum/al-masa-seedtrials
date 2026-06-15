import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { listFollowups } from "@/server/queries";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { fmtNum, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function FollowupsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();
  const followups = await listFollowups(user);

  return (
    <div>
      <PageHeader
        title={t("nav.followups")}
        action={
          <Link href="/followups/new">
            <Button>+ {t("actions.new")}</Button>
          </Link>
        }
      />
      {followups.length === 0 ? (
        <EmptyState message={t("empty.followups")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="p-3 text-start">{t("followup.measurementDate")}</th>
                <th className="p-3 text-start">{t("nav.trials")}</th>
                <th className="p-3 text-start">{t("nav.nurseries")}</th>
                <th className="p-3 text-end">{t("trial.germinationRate")}</th>
                <th className="p-3 text-end">{t("followup.growthCm")}</th>
                <th className="p-3 text-end">{t("followup.productionQty")}</th>
              </tr>
            </thead>
            <tbody>
              {followups.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="p-3">{fmtDate(f.measurementDate)}</td>
                  <td className="p-3 font-mono">
                    <Link href={`/trials/${f.trialId}`} className="text-brand-link hover:underline">
                      {f.trial.code}
                    </Link>
                  </td>
                  <td className="p-3">{f.distribution.nursery.name}</td>
                  <td className="p-3 text-end font-mono">{fmtNum(f.germinationRate)}%</td>
                  <td className="p-3 text-end font-mono">{fmtNum(f.growthCm)}</td>
                  <td className="p-3 text-end font-mono">{fmtNum(f.productionQty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
