import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Logo } from "@/components/brand/Logo";
import { TwoFactorSetup } from "./TwoFactorSetup";

export default async function Setup2FAPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Logo size={56} />
          <h1 className="text-lg font-bold text-ink-strong">
            تفعيل المصادقة الثنائية / Set up two-factor authentication
          </h1>
          <p className="text-sm text-muted">
            المصادقة الثنائية إلزامية لمديري التجارب والمالكين.
          </p>
        </div>
        <TwoFactorSetup />
      </div>
    </div>
  );
}
