"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { generateTotpSecret, totpKeyUri, verifyTotp } from "@/lib/totp";

// Begin 2FA enrollment: generate + persist a secret (not yet enabled), return the otpauth URI for the QR.
export async function beginTwoFactorSetup() {
  const user = await requireSessionUser();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { email: true, totpSecret: true, totpEnabled: true },
  });
  const secret = dbUser.totpEnabled && dbUser.totpSecret ? dbUser.totpSecret : generateTotpSecret();
  if (!dbUser.totpEnabled) {
    await prisma.user.update({ where: { id: user.id }, data: { totpSecret: secret } });
  }
  return { secret, otpauth: totpKeyUri(dbUser.email, secret) };
}

// Confirm 2FA: verify a code against the stored secret, then enable.
export async function confirmTwoFactorSetup(token: string): Promise<{ ok: boolean }> {
  const user = await requireSessionUser();
  const dbUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { totpSecret: true },
  });
  if (!dbUser.totpSecret || !verifyTotp(token, dbUser.totpSecret)) {
    return { ok: false };
  }
  await prisma.user.update({ where: { id: user.id }, data: { totpEnabled: true } });
  revalidatePath("/setup-2fa");
  return { ok: true };
}

// Login preflight: does this account need a TOTP code? (no session is created)
export async function loginNeedsTotp(email: string): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { totpEnabled: true },
  });
  return !!u?.totpEnabled;
}
