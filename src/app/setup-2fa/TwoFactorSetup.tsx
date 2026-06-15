"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { beginTwoFactorSetup, confirmTwoFactorSetup } from "@/server/account";
import { Button, Field, Input } from "@/components/ui";

export function TwoFactorSetup() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    beginTwoFactorSetup().then(async ({ secret, otpauth }) => {
      setSecret(secret);
      setQr(await QRCode.toDataURL(otpauth));
    });
  }, []);

  async function confirm() {
    setBusy(true);
    setError("");
    const { ok } = await confirmTwoFactorSetup(token);
    setBusy(false);
    if (ok) router.push("/dashboard");
    else setError("الرمز غير صحيح / Invalid code");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        1) امسح الرمز بتطبيق مصادقة / Scan with an authenticator app:
      </p>
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="2FA QR" className="mx-auto h-44 w-44" />
      ) : (
        <div className="mx-auto h-44 w-44 animate-pulse rounded bg-bg" />
      )}
      {secret && (
        <p className="break-all text-center font-mono text-xs text-muted">{secret}</p>
      )}
      <p className="text-sm text-muted">2) أدخل الرمز / Enter the 6-digit code:</p>
      <Field label="الرمز / Code">
        <Input
          inputMode="numeric"
          maxLength={6}
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button className="w-full" disabled={busy || token.length < 6} onClick={confirm}>
        تفعيل / Enable
      </Button>
    </div>
  );
}
