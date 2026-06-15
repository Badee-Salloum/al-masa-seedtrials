"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { authenticate, type LoginState } from "@/server/auth-actions";
import { loginNeedsTotp } from "@/server/account";
import { Button, Field, Input } from "@/components/ui";

export function LoginForm() {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    authenticate,
    undefined,
  );
  const [email, setEmail] = useState("");
  const [needsTotp, setNeedsTotp] = useState(false);

  async function onEmailBlur() {
    if (email.includes("@")) {
      try {
        setNeedsTotp(await loginNeedsTotp(email));
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="البريد الإلكتروني / Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={onEmailBlur}
        />
      </Field>
      <Field label="كلمة المرور / Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {needsTotp && (
        <Field label="رمز المصادقة الثنائية / 2FA code">
          <Input name="token" inputMode="numeric" autoComplete="one-time-code" maxLength={6} />
        </Field>
      )}
      {state?.error && <p className="text-sm text-danger">{t(state.error)}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("common.loading") : t("actions.signIn")}
      </Button>
    </form>
  );
}
