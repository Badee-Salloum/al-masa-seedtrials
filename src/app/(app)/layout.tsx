import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { auth } from "@/auth";
import { hasAtLeast } from "@/lib/authz";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, totpEnabled } = session.user;
  // Mandatory 2FA for managers/owners — secure default ON; set REQUIRE_2FA="false" to relax (e.g. testing).
  const require2fa = process.env.REQUIRE_2FA !== "false";
  if (require2fa && hasAtLeast(role, Role.MANAGER) && !totpEnabled) redirect("/setup-2fa");

  return (
    <AppShell role={role} userName={session.user.name ?? ""}>
      {children}
    </AppShell>
  );
}
