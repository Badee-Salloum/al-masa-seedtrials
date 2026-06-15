import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { hasAtLeast } from "@/lib/authz";
import { Role } from "@prisma/client";
import { listDistributions } from "@/server/queries";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { fmtNum, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function DistributionsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!hasAtLeast(user.role, Role.MANAGER)) redirect("/dashboard");
  const t = await getTranslations();
  const rows = await listDistributions(user);

  return (
    <div>
      <PageHeader title={t("nav.distributions")} />
      {rows.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="p-3 text-start">{t("nav.trials")}</th>
                <th className="p-3 text-start">{t("nav.nurseries")}</th>
                <th className="p-3 text-start">{t("trial.season")}</th>
                <th className="p-3 text-end">Qty</th>
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-end">{t("trial.avgGermination")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="p-3 font-mono">
                    <Link href={`/trials/${d.trialId}`} className="text-brand-link hover:underline">
                      {d.trial.code}
                    </Link>
                  </td>
                  <td className="p-3">{d.nursery.name}</td>
                  <td className="p-3">{d.season?.name ?? "—"}</td>
                  <td className="p-3 text-end font-mono">{fmtNum(d.distributedQty)}</td>
                  <td className="p-3">{fmtDate(d.distributionDate)}</td>
                  <td className="p-3 text-end font-mono">{fmtNum(d.avgGermination)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
