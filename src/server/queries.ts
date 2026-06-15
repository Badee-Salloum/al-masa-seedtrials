import { prisma } from "@/lib/prisma";
import {
  scopeTrialsWhere,
  scopeFollowupsWhere,
  scopeDistributionsWhere,
  hasAtLeast,
  type SessionUser,
} from "@/lib/authz";
import { Role, type Prisma } from "@prisma/client";

export async function listTrials(user: SessionUser, search?: string) {
  const where: Prisma.TrialWhereInput = { ...scopeTrialsWhere(user) };
  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { seedName: { contains: search, mode: "insensitive" } },
      { supplierBatchNumber: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.trial.findMany({
    where,
    include: { season: true, supplier: true, category: true },
    orderBy: [{ dateStart: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTrial(user: SessionUser, id: string) {
  return prisma.trial.findFirst({
    where: { id, ...scopeTrialsWhere(user) },
    include: {
      category: true,
      season: true,
      country: true,
      supplier: true,
      manager: true,
      decisionUser: true,
      product: true,
      distributions: {
        include: { nursery: true, technician: true },
        orderBy: { nursery: { name: "asc" } },
      },
      followups: {
        include: {
          distribution: { include: { nursery: true } },
          recordedBy: true,
          attachments: true,
        },
        orderBy: { measurementDate: "desc" },
      },
    },
  });
}

export async function getTrialAudit(user: SessionUser, trialId: string) {
  if (!hasAtLeast(user.role, Role.MANAGER)) return [];
  return prisma.auditLog.findMany({
    where: { trialId },
    include: { user: true },
    orderBy: { logDate: "desc" },
    take: 100,
  });
}

export async function listFollowups(user: SessionUser) {
  return prisma.followup.findMany({
    where: scopeFollowupsWhere(user),
    include: {
      trial: true,
      distribution: { include: { nursery: true } },
      recordedBy: true,
    },
    orderBy: { measurementDate: "desc" },
    take: 200,
  });
}

export async function listDistributions(user: SessionUser) {
  return prisma.distribution.findMany({
    where: scopeDistributionsWhere(user),
    include: { trial: true, nursery: true, season: true },
    orderBy: [{ trial: { code: "asc" } }, { nursery: { name: "asc" } }],
  });
}

export async function listAuditLog(user: SessionUser) {
  if (!hasAtLeast(user.role, Role.MANAGER)) return [];
  return prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { logDate: "desc" },
    take: 200,
  });
}

export async function dashboardStats(user: SessionUser) {
  const where = scopeTrialsWhere(user);
  const byState = await prisma.trial.groupBy({
    by: ["state"],
    where,
    _count: { _all: true },
  });
  const total = byState.reduce((a, s) => a + s._count._all, 0);
  return { byState, total };
}

/* config readers */
export const listSeasons = () =>
  prisma.season.findMany({ orderBy: [{ dateStart: "desc" }, { name: "asc" }] });
export const listCategories = () =>
  prisma.seedCategory.findMany({ orderBy: { name: "asc" } });
export const listSuppliers = () =>
  prisma.supplier.findMany({ orderBy: { name: "asc" } });
export const listCountries = () =>
  prisma.country.findMany({ orderBy: { nameEn: "asc" } });
export const listNurseries = () =>
  prisma.nursery.findMany({
    include: { technicians: true, _count: { select: { distributions: true } } },
    orderBy: { name: "asc" },
  });
export const listUsers = () =>
  prisma.user.findMany({ orderBy: { name: "asc" } });
export const listTechnicians = () =>
  prisma.user.findMany({ where: { active: true }, orderBy: { name: "asc" } });
