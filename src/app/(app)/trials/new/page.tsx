import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { canCreateTrial } from "@/lib/authz";
import {
  listCategories,
  listSeasons,
  listCountries,
  listSuppliers,
  listTechnicians,
} from "@/server/queries";
import { PageHeader } from "@/components/ui";
import { TrialForm } from "@/components/trials/TrialForm";

export const dynamic = "force-dynamic";

export default async function NewTrialPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canCreateTrial(user.role)) redirect("/trials");
  const t = await getTranslations();

  const [categories, seasons, countries, suppliers, managers] = await Promise.all([
    listCategories(),
    listSeasons(),
    listCountries(),
    listSuppliers(),
    listTechnicians(),
  ]);

  return (
    <div>
      <PageHeader title={`${t("actions.new")} · ${t("nav.trials")}`} />
      <TrialForm
        categories={categories}
        seasons={seasons}
        countries={countries}
        suppliers={suppliers}
        managers={managers}
      />
    </div>
  );
}
