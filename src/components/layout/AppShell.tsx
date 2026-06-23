import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Role } from "@prisma/client";
import { hasAtLeast, canSeeAnalytics } from "@/lib/authz";
import { Logo } from "@/components/brand/Logo";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { SignOutButton } from "./SignOutButton";

export function AppShell({
  role,
  userName,
  children,
}: {
  role: Role;
  userName: string;
  children: ReactNode;
}) {
  const t = useTranslations();
  const isMgr = hasAtLeast(role, Role.MANAGER);

  const nav = [
    { href: "/dashboard", label: t("nav.dashboard") },
    { href: "/trials", label: t("nav.trials") },
    { href: "/nurseries", label: t("nav.nurseries") },
    { href: "/followups", label: t("nav.followups") },
    // Engineers see analytics + all trials, but not management screens.
    ...(canSeeAnalytics(role) ? [{ href: "/analytics", label: t("nav.analytics") }] : []),
    ...(isMgr
      ? [
          { href: "/distributions", label: t("nav.distributions") },
          { href: "/audit", label: t("nav.audit") },
          { href: "/settings/seasons", label: t("nav.config") },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 border-e border-border bg-surface p-4 md:block">
        <div className="mb-6 flex items-center gap-2">
          <Logo size={36} />
          <div className="text-sm font-bold leading-tight text-ink-strong">
            {t("app.name")}
          </div>
        </div>
        <nav className="space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-bg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b-2 border-brand-lime bg-brand-blue px-6 py-3 text-white">
          <div className="font-semibold">{t("app.org")}</div>
          <div className="flex items-center gap-4">
            <div className="rounded bg-white/15 px-2 py-0.5 text-xs">
              <LocaleSwitcher />
            </div>
            <span className="hidden text-sm sm:inline">
              {userName} · {t(`role.${role}`)}
            </span>
            <SignOutButton label={t("actions.signOut")} />
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
