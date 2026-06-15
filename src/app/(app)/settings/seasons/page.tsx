import { getTranslations } from "next-intl/server";
import { listSeasons } from "@/server/queries";
import { Card } from "@/components/ui";
import { SeasonForm } from "@/components/settings/SeasonForm";
import { fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function SeasonsSettingsPage() {
  const t = await getTranslations();
  const seasons = await listSeasons();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold text-ink-strong">{t("nav.seasons")}</h2>
        <SeasonForm />
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-bg text-muted">
            <tr>
              <th className="p-3 text-start">{t("nursery.name")}</th>
              <th className="p-3 text-start">{t("nursery.code")}</th>
              <th className="p-3 text-start">{t("trial.dateStart")}</th>
              <th className="p-3 text-start">{t("trial.dateEnd")}</th>
            </tr>
          </thead>
          <tbody>
            {seasons.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 font-mono">{s.code ?? "—"}</td>
                <td className="p-3">{fmtDate(s.dateStart)}</td>
                <td className="p-3">{fmtDate(s.dateEnd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
