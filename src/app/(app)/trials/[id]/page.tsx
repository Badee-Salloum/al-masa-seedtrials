import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { getTrial, getTrialAudit } from "@/server/queries";
import { hasAtLeast } from "@/lib/authz";
import { Role } from "@prisma/client";
import { Button, Card } from "@/components/ui";
import { StateBadge } from "@/components/StateBadge";
import { WorkflowButtons } from "@/components/trials/WorkflowButtons";
import { fmtNum, fmtDate, AUDIT_DOT } from "@/lib/ui";
import { formatNpk } from "@/lib/npk";

export const dynamic = "force-dynamic";

function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-1.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value ?? "—"}</span>
    </div>
  );
}

export default async function TrialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const { id } = await params;
  const t = await getTranslations();
  const trial = await getTrial(user, id);
  if (!trial) notFound();
  const audit = await getTrialAudit(user, id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/trials" className="text-sm text-brand-link hover:underline">
            ← {t("nav.trials")}
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold text-ink-strong">
            <span className="font-mono">{trial.code}</span>
            <StateBadge state={trial.state} />
          </h1>
          <p className="text-muted">{trial.seedName}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <WorkflowButtons trialId={trial.id} state={trial.state} role={user.role} />
          <div className="flex gap-2">
            <Link href={`/trials/${trial.id}/report`} target="_blank">
              <Button variant="outline">PDF</Button>
            </Link>
            {trial.product && (
              <span className="rounded-md border border-border px-3 py-2 text-sm text-muted">
                {t("trial.product")}: {trial.product.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Agronomy */}
        <Card>
          <h2 className="mb-3 font-semibold text-ink-strong">{t("trial.tabAgronomy")}</h2>
          <KV label={t("trial.season")} value={trial.season?.name} />
          <KV label={t("trial.category")} value={trial.category?.name} />
          <KV label={t("trial.germinationRate")} value={`${fmtNum(trial.germinationRate)}%`} />
          <KV label={t("trial.purity")} value={`${fmtNum(trial.purity)}%`} />
          <KV label={t("trial.npk")} value={formatNpk(trial.npkN?.toString(), trial.npkP?.toString(), trial.npkK?.toString())} />
          <KV label={t("trial.shelfLife")} value={trial.shelfLife ?? "—"} />
          <KV label={t("trial.country")} value={trial.country?.nameEn} />
          <KV label={t("trial.supplier")} value={trial.supplier?.name} />
          <KV label={t("trial.batch")} value={trial.supplierBatchNumber} />
        </Card>

        {/* Results & decision */}
        <Card>
          <h2 className="mb-3 font-semibold text-ink-strong">{t("trial.tabResults")}</h2>
          <KV label={t("trial.avgGermination")} value={`${fmtNum(trial.avgGermination)}%`} />
          <KV label={t("trial.avgGrowth")} value={`${fmtNum(trial.avgGrowth)} cm`} />
          <KV label={t("trial.avgProduction")} value={fmtNum(trial.avgProduction)} />
          <KV label={t("trial.decidedBy")} value={trial.decisionUser?.name} />
          <KV label={t("trial.decisionDate")} value={fmtDate(trial.decisionDate)} />
          {trial.state === "REJECTED" && (
            <KV label={t("trial.rejectionReason")} value={trial.rejectionReason} />
          )}
        </Card>
      </div>

      {/* Distributions */}
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink-strong">{t("trial.tabDistributions")}</h2>
        </div>
        {trial.distributions.length === 0 ? (
          <p className="text-sm text-muted">{t("empty.generic")}</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-start text-muted">
              <tr>
                <th className="p-2 text-start">{t("nav.nurseries")}</th>
                <th className="p-2 text-end">Qty</th>
                <th className="p-2 text-end">{t("trial.avgGermination")}</th>
                <th className="p-2 text-end">{t("followup.timeline")}</th>
              </tr>
            </thead>
            <tbody>
              {trial.distributions.map((d) => (
                <tr key={d.id} className="border-t border-border">
                  <td className="p-2">{d.nursery.name}</td>
                  <td className="p-2 text-end font-mono">{fmtNum(d.distributedQty)}</td>
                  <td className="p-2 text-end font-mono">{fmtNum(d.avgGermination)}%</td>
                  <td className="p-2 text-end">
                    <Link
                      href={`/followups/new?distributionId=${d.id}`}
                      className="text-brand-link hover:underline"
                    >
                      + {t("nav.followups")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Follow-up timeline */}
      <Card>
        <h2 className="mb-4 font-semibold text-ink-strong">{t("followup.timeline")}</h2>
        {trial.followups.length === 0 ? (
          <p className="text-sm text-muted">{t("empty.followups")}</p>
        ) : (
          <ol className="space-y-4 border-s-2 border-brand-lime ps-5">
            {trial.followups.map((f) => (
              <li key={f.id} className="relative">
                <span className="absolute -start-[27px] top-1 h-3 w-3 rounded-full bg-brand-lime" />
                <div className="text-sm font-medium text-ink-strong">
                  {fmtDate(f.measurementDate)} · {f.distribution.nursery.name}
                </div>
                <div className="text-sm text-muted">
                  {t("trial.germinationRate")} {fmtNum(f.germinationRate)}% ·{" "}
                  {t("followup.growthCm")} {fmtNum(f.growthCm)} ·{" "}
                  {t("followup.productionQty")} {fmtNum(f.productionQty)}
                </div>
                {f.notes && <div className="text-sm text-ink">{f.notes}</div>}
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* Audit feed (manager/owner) */}
      {hasAtLeast(user.role, Role.MANAGER) && audit.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-strong">{t("nav.audit")}</h2>
          <ul className="space-y-2 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${AUDIT_DOT[a.action]}`} />
                <span className="text-muted">{fmtDate(a.logDate)}</span>
                <span className="font-medium">{a.user?.name ?? "—"}</span>
                <span className="text-muted">
                  {a.fieldName ?? a.action}: {a.oldValue} → {a.newValue}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
