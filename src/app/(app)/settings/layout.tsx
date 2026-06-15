import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { canManageConfig } from "@/lib/authz";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManageConfig(user.role)) redirect("/dashboard");
  const t = await getTranslations();

  return (
    <div>
      <PageHeader title={t("nav.config")} />
      <div className="mb-6 flex gap-4 border-b border-border pb-2 text-sm">
        <Link href="/settings/seasons" className="text-brand-link hover:underline">
          {t("nav.seasons")}
        </Link>
        <Link href="/settings/nurseries" className="text-brand-link hover:underline">
          {t("nav.nurseries")}
        </Link>
      </div>
      {children}
    </div>
  );
}
