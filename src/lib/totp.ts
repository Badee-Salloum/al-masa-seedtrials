import { authenticator } from "otplib";

const ISSUER = "Al-Masa Seed Trials";

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function totpKeyUri(accountEmail: string, secret: string): string {
  return authenticator.keyuri(accountEmail, ISSUER, secret);
}

export function verifyTotp(token: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: token.replace(/\s/g, ""), secret });
  } catch {
    return false;
  }
}

// For seeds/tests: deterministically derive the current 6-digit code from a secret.
export function currentTotp(secret: string): string {
  return authenticator.generate(secret);
}
