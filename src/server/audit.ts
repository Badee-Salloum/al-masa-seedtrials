import type { Prisma } from "@prisma/client";
import {
  diffAuditFields,
  createAuditRow,
  type AuditSnapshot,
} from "@/lib/audit";

type TrialWithRefs = {
  id: string;
  code: string;
  state: AuditSnapshot["state"];
  germinationRate: Prisma.Decimal | null;
  purity: Prisma.Decimal | null;
  npkN: Prisma.Decimal | null;
  npkP: Prisma.Decimal | null;
  npkK: Prisma.Decimal | null;
  shelfLife: number | null;
  supplierBatchNumber: string | null;
  supplier: { name: string } | null;
  season: { name: string } | null;
  country: { nameEn: string } | null;
};

export function trialAuditSnapshot(t: TrialWithRefs): AuditSnapshot {
  return {
    state: t.state,
    germinationRate: t.germinationRate?.toString() ?? null,
    purity: t.purity?.toString() ?? null,
    npkN: t.npkN?.toString() ?? null,
    npkP: t.npkP?.toString() ?? null,
    npkK: t.npkK?.toString() ?? null,
    shelfLife: t.shelfLife,
    supplier: t.supplier?.name ?? null,
    season: t.season?.name ?? null,
    country: t.country?.nameEn ?? null,
    supplierBatchNumber: t.supplierBatchNumber,
  };
}

export async function logTrialCreate(
  tx: Prisma.TransactionClient,
  trial: TrialWithRefs,
  userId: string,
): Promise<void> {
  const row = createAuditRow(trial.state as never);
  await tx.auditLog.create({
    data: {
      ...row,
      userId,
      resModel: "Trial",
      resId: trial.id,
      resName: trial.code,
      trialId: trial.id,
    },
  });
}

// Single owner of state/field auditing — one row per changed AUDIT field (Odoo write() parity).
export async function logTrialChanges(
  tx: Prisma.TransactionClient,
  before: TrialWithRefs,
  after: TrialWithRefs,
  userId: string,
): Promise<void> {
  const rows = diffAuditFields(
    trialAuditSnapshot(before),
    trialAuditSnapshot(after),
  );
  if (rows.length === 0) return;
  await tx.auditLog.createMany({
    data: rows.map((r) => ({
      ...r,
      userId,
      resModel: "Trial",
      resId: after.id,
      resName: after.code,
      trialId: after.id,
    })),
  });
}
