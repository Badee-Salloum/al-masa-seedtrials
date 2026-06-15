import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionUser } from "@/lib/session";
import { canReadAudit } from "@/lib/authz";
import { listAuditLog } from "@/server/queries";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { AUDIT_DOT, fmtDate } from "@/lib/ui";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canReadAudit(user.role)) redirect("/dashboard");
  const t = await getTranslations();
  const logs = await listAuditLog(user);

  return (
    <div>
      <PageHeader title={t("nav.audit")} />
      {logs.length === 0 ? (
        <EmptyState message={t("empty.generic")} />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-bg text-muted">
              <tr>
                <th className="p-3 text-start">Date</th>
                <th className="p-3 text-start">User</th>
                <th className="p-3 text-start">Record</th>
                <th className="p-3 text-start">Action</th>
                <th className="p-3 text-start">Change</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((a) => (
                <tr key={a.id} className="border-t border-border">
                  <td className="p-3 whitespace-nowrap">{fmtDate(a.logDate)}</td>
                  <td className="p-3">{a.user?.name ?? "—"}</td>
                  <td className="p-3 font-mono">{a.resName ?? a.resId}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${AUDIT_DOT[a.action]}`} />
                      {a.action}
                    </span>
                  </td>
                  <td className="p-3 text-muted">
                    {a.fieldName ? `${a.fieldName}: ` : ""}
                    {a.oldValue ? `${a.oldValue} → ` : ""}
                    {a.newValue ?? ""}
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
