"use server";

import { revalidatePath } from "next/cache";
import { Prisma, TrialState, Recommendation, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import {
  assert,
  hasAtLeast,
  canCreateTrial,
  canDeleteTrial,
  canAcceptTrial,
  canRejectTrial,
  canResetTrial,
  canAnalyze,
  scopeTrialsWhere,
  AuthzError,
} from "@/lib/authz";
import { trialSchema } from "@/lib/validation";
import { nextTrialCode } from "@/lib/sequence";
import { prepareProductVals } from "@/lib/product";
import {
  canTransition,
  nextState,
  isValidRejectionReason,
  type WorkflowAction,
} from "@/lib/workflow";
import { logTrialCreate, logTrialChanges } from "@/server/audit";

const TRIAL_REFS = { supplier: true, season: true, country: true } as const;

function toDecimalOrNull(v: number | null | undefined) {
  return v == null ? null : new Prisma.Decimal(v);
}

export async function createTrial(input: unknown) {
  const user = await requireSessionUser();
  assert(canCreateTrial(user.role));
  const data = trialSchema.parse(input);
  const year = data.dateStart
    ? new Date(data.dateStart).getFullYear()
    : new Date().getFullYear();

  const trial = await prisma.$transaction(async (tx) => {
    const code = await nextTrialCode(tx, year);
    const created = await tx.trial.create({
      data: {
        code,
        seedName: data.seedName,
        categoryId: data.categoryId ?? null,
        seasonId: data.seasonId ?? null,
        countryId: data.countryId ?? null,
        supplierId: data.supplierId ?? null,
        germinationRate: toDecimalOrNull(data.germinationRate),
        purity: toDecimalOrNull(data.purity),
        npkN: toDecimalOrNull(data.npkN),
        npkP: toDecimalOrNull(data.npkP),
        npkK: toDecimalOrNull(data.npkK),
        shelfLife: data.shelfLife ?? null,
        supplierBatchNumber: data.supplierBatchNumber ?? null,
        dateStart: data.dateStart ?? null,
        dateEnd: data.dateEnd ?? null,
        managerId: data.managerId ?? null,
        createdById: user.id,
      },
      include: TRIAL_REFS,
    });
    await logTrialCreate(tx, created, user.id);
    return created;
  });

  revalidatePath("/trials");
  return { id: trial.id, code: trial.code };
}

export async function updateTrial(id: string, input: unknown) {
  const user = await requireSessionUser();
  const data = trialSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    // Technicians may only edit trials in their scope (own-nursery or self-created).
    if (!hasAtLeast(user.role, Role.MANAGER)) {
      const scoped = await tx.trial.findFirst({
        where: { id, ...scopeTrialsWhere(user) },
        select: { id: true },
      });
      assert(!!scoped);
    }
    const before = await tx.trial.findUniqueOrThrow({
      where: { id },
      include: TRIAL_REFS,
    });
    const after = await tx.trial.update({
      where: { id },
      data: {
        seedName: data.seedName,
        categoryId: data.categoryId ?? null,
        seasonId: data.seasonId ?? null,
        countryId: data.countryId ?? null,
        supplierId: data.supplierId ?? null,
        germinationRate: toDecimalOrNull(data.germinationRate),
        purity: toDecimalOrNull(data.purity),
        npkN: toDecimalOrNull(data.npkN),
        npkP: toDecimalOrNull(data.npkP),
        npkK: toDecimalOrNull(data.npkK),
        shelfLife: data.shelfLife ?? null,
        supplierBatchNumber: data.supplierBatchNumber ?? null,
        dateStart: data.dateStart ?? null,
        dateEnd: data.dateEnd ?? null,
        managerId: data.managerId ?? null,
      },
      include: TRIAL_REFS,
    });
    await logTrialChanges(tx, before, after, user.id);
  });

  revalidatePath(`/trials/${id}`);
  revalidatePath("/trials");
}

export async function deleteTrial(id: string) {
  const user = await requireSessionUser();
  assert(canDeleteTrial(user.role)); // owner only
  await prisma.trial.delete({ where: { id } });
  revalidatePath("/trials");
}

async function transition(
  trialId: string,
  action: WorkflowAction,
  opts?: { rejectionReason?: string },
) {
  const user = await requireSessionUser();

  // Role gates for decision actions; start/toReview allowed for scoped technicians.
  if (action === "accept") assert(canAcceptTrial(user.role));
  else if (action === "reject") assert(canRejectTrial(user.role));
  else if (action === "resetToDraft") assert(canResetTrial(user.role));

  await prisma.$transaction(async (tx) => {
    if (!hasAtLeast(user.role, Role.MANAGER)) {
      const scoped = await tx.trial.findFirst({
        where: { id: trialId, ...scopeTrialsWhere(user) },
        select: { id: true },
      });
      assert(!!scoped);
    }

    const before = await tx.trial.findUniqueOrThrow({
      where: { id: trialId },
      include: TRIAL_REFS,
    });
    if (!canTransition(action, before.state)) {
      throw new AuthzError("errors.illegalTransition");
    }

    const data: Prisma.TrialUpdateInput = { state: nextState(action) };

    if (action === "accept") {
      data.decisionDate = new Date();
      data.decisionUser = { connect: { id: user.id } };
      if (!before.productId) {
        const vals = prepareProductVals({
          code: before.code,
          seedName: before.seedName,
          supplierBatchNumber: before.supplierBatchNumber,
          germinationRate: before.germinationRate?.toString(),
          purity: before.purity?.toString(),
          npkN: before.npkN?.toString(),
          npkP: before.npkP?.toString(),
          npkK: before.npkK?.toString(),
          shelfLife: before.shelfLife,
          countryName: before.country?.nameEn,
          seasonName: before.season?.name,
        });
        const product = await tx.product.create({
          data: {
            name: vals.name,
            defaultCode: vals.defaultCode,
            saleOk: vals.saleOk,
            purchaseOk: vals.purchaseOk,
            productType: vals.productType,
            salePrice: new Prisma.Decimal(vals.salePrice),
            descriptionSale: vals.descriptionSale,
          },
        });
        data.product = { connect: { id: product.id } };
      }
    }

    if (action === "reject") {
      const reason = opts?.rejectionReason ?? "";
      if (!isValidRejectionReason(reason)) throw new AuthzError("errors.rejectReason");
      data.decisionDate = new Date();
      data.decisionUser = { connect: { id: user.id } };
      data.rejectionReason = reason;
    }

    const after = await tx.trial.update({
      where: { id: trialId },
      data,
      include: TRIAL_REFS,
    });
    await logTrialChanges(tx, before, after, user.id);
  });

  revalidatePath(`/trials/${trialId}`);
  revalidatePath("/trials");
}

export async function startTrial(id: string) {
  return transition(id, "start");
}
export async function sendToReview(id: string) {
  return transition(id, "toReview");
}
export async function acceptTrial(id: string) {
  return transition(id, "accept");
}
export async function rejectTrial(id: string, rejectionReason: string) {
  return transition(id, "reject", { rejectionReason });
}
export async function resetToDraft(id: string) {
  return transition(id, "resetToDraft");
}

// Engineer/agronomist analysis at the review stage — recommendation only (manager decides).
export async function submitAnalysis(
  id: string,
  input: { analysisNote?: string | null; recommendation?: "ACCEPT" | "REJECT" | "" },
) {
  const user = await requireSessionUser();
  assert(canAnalyze(user.role));
  const trial = await prisma.trial.findUniqueOrThrow({ where: { id }, select: { state: true } });
  if (trial.state !== TrialState.IN_TRIAL && trial.state !== TrialState.REVIEW) {
    throw new AuthzError("errors.denied");
  }
  const rec =
    input.recommendation === "ACCEPT"
      ? Recommendation.ACCEPT
      : input.recommendation === "REJECT"
        ? Recommendation.REJECT
        : null;
  await prisma.trial.update({
    where: { id },
    data: {
      analysisNote: input.analysisNote?.trim() || null,
      recommendation: rec,
      analyzedById: user.id,
      analyzedAt: new Date(),
    },
  });
  revalidatePath(`/trials/${id}`);
}
