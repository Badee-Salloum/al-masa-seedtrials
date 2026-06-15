import type { Prisma } from "@prisma/client";

// Trial code ST/<year>/#### — ports Odoo ir.sequence prefix "ST/%(year)s/" padding 4.
export function formatTrialCode(year: number, n: number): string {
  return `ST/${year}/${String(n).padStart(4, "0")}`;
}

// Race-safe allocation: atomic upsert (INSERT … ON CONFLICT DO UPDATE … RETURNING) per year.
// Must be called inside a transaction (tx) alongside the trial create.
export async function nextTrialCode(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const counter = await tx.trialCounter.upsert({
    where: { year },
    create: { year, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
  });
  return formatTrialCode(year, counter.lastValue);
}
