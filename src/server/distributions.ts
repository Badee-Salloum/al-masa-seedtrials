"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { assert, canManageDistributions, AuthzError } from "@/lib/authz";
import { distributionSchema } from "@/lib/validation";

function dec(v: number | null | undefined) {
  return v == null ? null : new Prisma.Decimal(v);
}

export async function createDistribution(input: unknown) {
  const user = await requireSessionUser();
  assert(canManageDistributions(user.role));
  const data = distributionSchema.parse(input);
  const trial = await prisma.trial.findUniqueOrThrow({
    where: { id: data.trialId },
    select: { seasonId: true },
  });
  try {
    const created = await prisma.distribution.create({
      data: {
        trialId: data.trialId,
        nurseryId: data.nurseryId,
        seasonId: trial.seasonId ?? null,
        distributedQty: dec(data.distributedQty),
        distributionDate: data.distributionDate ?? null,
        technicianId: data.technicianId ?? null,
      },
    });
    revalidatePath(`/trials/${data.trialId}`);
    revalidatePath("/distributions");
    return { id: created.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new AuthzError("errors.distUnique");
    }
    throw e;
  }
}

export async function updateDistribution(id: string, input: unknown) {
  const user = await requireSessionUser();
  assert(canManageDistributions(user.role));
  const data = distributionSchema.parse(input);
  await prisma.distribution.update({
    where: { id },
    data: {
      nurseryId: data.nurseryId,
      distributedQty: dec(data.distributedQty),
      distributionDate: data.distributionDate ?? null,
      technicianId: data.technicianId ?? null,
    },
  });
  revalidatePath(`/trials/${data.trialId}`);
  revalidatePath("/distributions");
}

export async function deleteDistribution(id: string) {
  const user = await requireSessionUser();
  assert(canManageDistributions(user.role));
  const d = await prisma.distribution.delete({ where: { id }, select: { trialId: true } });
  revalidatePath(`/trials/${d.trialId}`);
  revalidatePath("/distributions");
}
