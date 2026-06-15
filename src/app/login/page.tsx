import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");
  const t = await getTranslations();

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo size={64} />
          <h1 className="text-xl font-bold text-ink-strong">{t("app.name")}</h1>
          <p className="text-sm text-muted">{t("app.org")}</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
