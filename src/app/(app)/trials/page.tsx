import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { listTrials } from "@/server/queries";
import { canCreateTrial } from "@/lib/authz";
import { Button, Card, EmptyState, Input, PageHeader } from "@/components/ui";
import { StateBadge } from "@/components/StateBadge";
import { fmtNum } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function TrialsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();
  const { q } = await searchParams;
  const trials = await listTrials(user, q);

  return (
    <div>
      <PageHeader
        title={t("nav.trials")}
        action={
          canCreateTrial(user.role) ? (
            <Link href="/trials/new">
              <Button>+ {t("actions.new")}</Button>
            </Link>
          ) : null
        }
      />
      <form className="mb-4 max-w-sm" action="/trials">
        <Input name="q" defaultValue={q ?? ""} placeholder={t("common.search")} />
      </form>

      {trials.length === 0 ? (
        <EmptyState message={t("empty.trials")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg text-start text-muted">
              <tr>
                <th className="p-3 text-start font-mono">{t("trial.reference")}</th>
                <th className="p-3 text-start">{t("trial.seedName")}</th>
                <th className="p-3 text-start">{t("trial.season")}</th>
                <th className="p-3 text-start">{t("trial.supplier")}</th>
                <th className="p-3 text-end">{t("trial.avgGermination")}</th>
                <th className="p-3 text-start">{t("trial.decision")}</th>
              </tr>
            </thead>
            <tbody>
              {trials.map((tr) => (
                <tr key={tr.id} className="border-t border-border hover:bg-bg">
                  <td className="p-3 font-mono">
                    <Link href={`/trials/${tr.id}`} className="text-brand-link hover:underline">
                      {tr.code}
                    </Link>
                  </td>
                  <td className="p-3">{tr.seedName}</td>
                  <td className="p-3">{tr.season?.name ?? "—"}</td>
                  <td className="p-3">{tr.supplier?.name ?? "—"}</td>
                  <td className="p-3 text-end font-mono">{fmtNum(tr.avgGermination)}</td>
                  <td className="p-3">
                    <StateBadge state={tr.state} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
