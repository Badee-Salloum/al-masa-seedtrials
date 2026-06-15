import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { listDistributions } from "@/server/queries";
import { PageHeader, EmptyState } from "@/components/ui";
import { FollowupForm } from "@/components/followups/FollowupForm";

export const dynamic = "force-dynamic";

export default async function NewFollowupPage({
  searchParams,
}: {
  searchParams: Promise<{ distributionId?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  const t = await getTranslations();
  const { distributionId } = await searchParams;

  const distributions = (await listDistributions(user)).map((d) => ({
    id: d.id,
    label: `${d.trial.code} / ${d.nursery.name}`,
  }));

  return (
    <div>
      <PageHeader title={`${t("actions.new")} · ${t("nav.followups")}`} />
      {distributions.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <FollowupForm distributions={distributions} preselect={distributionId} />
      )}
    </div>
  );
}
