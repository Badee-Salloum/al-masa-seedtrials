import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { listNurseries } from "@/server/queries";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { fmtNum } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function NurseriesPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();
  const nurseries = await listNurseries();

  return (
    <div>
      <PageHeader title={t("nav.nurseries")} />
      {nurseries.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="p-3 text-start">{t("nursery.name")}</th>
                <th className="p-3 text-start">{t("nursery.code")}</th>
                <th className="p-3 text-start">{t("nursery.location")}</th>
                <th className="p-3 text-start">{t("nursery.technicians")}</th>
                <th className="p-3 text-end">{t("nursery.area")}</th>
              </tr>
            </thead>
            <tbody>
              {nurseries.map((n) => (
                <tr key={n.id} className="border-t border-border">
                  <td className="p-3 font-medium">{n.name}</td>
                  <td className="p-3 font-mono">{n.code ?? "—"}</td>
                  <td className="p-3">{n.location ?? "—"}</td>
                  <td className="p-3 text-muted">
                    {n.technicians.map((u) => u.name).join("، ") || "—"}
                  </td>
                  <td className="p-3 text-end font-mono">{fmtNum(n.areaHectare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
