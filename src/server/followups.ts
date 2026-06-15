"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { assert, hasAtLeast, canDeleteFollowup } from "@/lib/authz";
import { followupSchema } from "@/lib/validation";
import { recomputeAggregates } from "@/server/recompute";

function dec(v: number | null | undefined) {
  return v == null ? null : new Prisma.Decimal(v);
}

// A technician may only act on distributions whose nursery they're assigned to.
async function assertCanUseDistribution(
  tx: Prisma.TransactionClient,
  userId: string,
  role: Role,
  distributionId: string,
) {
  const where =
    hasAtLeast(role, Role.MANAGER)
      ? { id: distributionId }
      : { id: distributionId, nursery: { technicians: { some: { id: userId } } } };
  const dist = await tx.distribution.findFirst({
    where,
    select: { id: true, trialId: true, nurseryId: true, trial: { select: { seasonId: true } } },
  });
  assert(!!dist);
  return dist!;
}

export async function createFollowup(input: unknown) {
  const user = await requireSessionUser();
  const data = followupSchema.parse(input);

  const result = await prisma.$transaction(async (tx) => {
    const dist = await assertCanUseDistribution(
      tx,
      user.id,
      user.role,
      data.distributionId,
    );
    const created = await tx.followup.create({
      data: {
        distributionId: dist.id,
        trialId: dist.trialId,
        nurseryId: dist.nurseryId,
        seasonId: dist.trial.seasonId ?? null,
        measurementDate: data.measurementDate,
        germinationRate: dec(data.germinationRate),
        growthCm: dec(data.growthCm),
        productionQty: dec(data.productionQty),
        notes: data.notes ?? null,
        recordedById: user.id,
      },
    });
    await recomputeAggregates(tx, dist.id, dist.trialId);
    return created;
  });

  revalidatePath(`/trials/${result.trialId}`);
  revalidatePath("/followups");
  return { id: result.id };
}

export async function updateFollowup(id: string, input: unknown) {
  const user = await requireSessionUser();
  const data = followupSchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.followup.findUniqueOrThrow({
      where: { id },
      select: { distributionId: true, trialId: true },
    });
    await assertCanUseDistribution(tx, user.id, user.role, existing.distributionId);
    await tx.followup.update({
      where: { id },
      data: {
        measurementDate: data.measurementDate,
        germinationRate: dec(data.germinationRate),
        growthCm: dec(data.growthCm),
        productionQty: dec(data.productionQty),
        notes: data.notes ?? null,
      },
    });
    await recomputeAggregates(tx, existing.distributionId, existing.trialId);
  });

  revalidatePath("/followups");
}

export async function deleteFollowup(id: string) {
  const user = await requireSessionUser();
  assert(canDeleteFollowup(user.role)); // manager+

  await prisma.$transaction(async (tx) => {
    const existing = await tx.followup.findUniqueOrThrow({
      where: { id },
      select: { distributionId: true, trialId: true },
    });
    await tx.followup.delete({ where: { id } });
    await recomputeAggregates(tx, existing.distributionId, existing.trialId);
  });

  revalidatePath("/followups");
}
