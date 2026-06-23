import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { canManageUsers } from "@/lib/authz";
import { listUsers } from "@/server/queries";
import { Badge, Card } from "@/components/ui";
import { UserForm } from "@/components/settings/UserForm";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManageUsers(user.role)) redirect("/dashboard"); // Owner only
  const t = await getTranslations();
  const users = await listUsers();

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 font-semibold text-ink-strong">{t("user.addTechnician")}</h2>
        <UserForm />
      </Card>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-bg text-muted">
            <tr>
              <th className="p-3 text-start">{t("user.name")}</th>
              <th className="p-3 text-start">{t("user.email")}</th>
              <th className="p-3 text-start">{t("user.role")}</th>
              <th className="p-3 text-start">{t("user.twoFactor")}</th>
              <th className="p-3 text-start">{t("user.status")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 font-mono">{u.email}</td>
                <td className="p-3">{t(`role.${u.role}`)}</td>
                <td className="p-3">
                  <Badge className={u.totpEnabled ? "bg-success-tint text-success" : "bg-draft-tint text-draft"}>
                    {u.totpEnabled ? "on" : "off"}
                  </Badge>
                </td>
                <td className="p-3">{u.active ? t("user.active") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
