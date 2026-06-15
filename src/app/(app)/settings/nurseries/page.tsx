import { getTranslations } from "next-intl/server";
import { listNurseries, listTechnicians } from "@/server/queries";
import { Card } from "@/components/ui";
import { NurseryForm } from "@/components/settings/NurseryForm";

export const dynamic = "force-dynamic";

export default async function NurseriesSettingsPage() {
  const t = await getTranslations();
  const [nurseries, technicians] = await Promise.all([listNurseries(), listTechnicians()]);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold text-ink-strong">{t("nav.nurseries")}</h2>
        <NurseryForm technicians={technicians.map((u) => ({ id: u.id, name: u.name }))} />
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-bg text-muted">
            <tr>
              <th className="p-3 text-start">{t("nursery.name")}</th>
              <th className="p-3 text-start">{t("nursery.code")}</th>
              <th className="p-3 text-start">{t("nursery.technicians")}</th>
            </tr>
          </thead>
          <tbody>
            {nurseries.map((n) => (
              <tr key={n.id} className="border-t border-border">
                <td className="p-3 font-medium">{n.name}</td>
                <td className="p-3 font-mono">{n.code ?? "—"}</td>
                <td className="p-3 text-muted">
                  {n.technicians.map((u) => u.name).join("، ") || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
