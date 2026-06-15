"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { assert, canManageConfig, canManageUsers } from "@/lib/authz";
import { hashPassword } from "@/lib/password";

async function requireConfigManager() {
  const user = await requireSessionUser();
  assert(canManageConfig(user.role));
  return user;
}

/* ---- Seasons ---- */
export async function upsertSeason(input: {
  id?: string;
  name: string;
  code?: string | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  active?: boolean;
}) {
  await requireConfigManager();
  const data = {
    name: input.name.trim(),
    code: input.code ?? null,
    dateStart: input.dateStart ? new Date(input.dateStart) : null,
    dateEnd: input.dateEnd ? new Date(input.dateEnd) : null,
    active: input.active ?? true,
  };
  if (input.id) await prisma.season.update({ where: { id: input.id }, data });
  else await prisma.season.create({ data });
  revalidatePath("/settings/seasons");
}

/* ---- Seed categories ---- */
export async function upsertCategory(input: {
  id?: string;
  name: string;
  code?: string | null;
  active?: boolean;
}) {
  await requireConfigManager();
  const data = { name: input.name.trim(), code: input.code ?? null, active: input.active ?? true };
  if (input.id) await prisma.seedCategory.update({ where: { id: input.id }, data });
  else await prisma.seedCategory.create({ data });
  revalidatePath("/settings/categories");
}

/* ---- Suppliers ---- */
export async function upsertSupplier(input: {
  id?: string;
  name: string;
  ref?: string | null;
  active?: boolean;
}) {
  await requireConfigManager();
  const data = { name: input.name.trim(), ref: input.ref ?? null, active: input.active ?? true };
  if (input.id) await prisma.supplier.update({ where: { id: input.id }, data });
  else await prisma.supplier.create({ data });
  revalidatePath("/settings/suppliers");
}

/* ---- Nurseries (incl. technician assignment → drives record scoping) ---- */
export async function upsertNursery(input: {
  id?: string;
  name: string;
  code?: string | null;
  location?: string | null;
  areaHectare?: number | null;
  technicianIds?: string[];
  active?: boolean;
}) {
  await requireConfigManager();
  const base = {
    name: input.name.trim(),
    code: input.code ?? null,
    location: input.location ?? null,
    areaHectare: input.areaHectare == null ? null : new Prisma.Decimal(input.areaHectare),
    active: input.active ?? true,
  };
  const techConnect = input.technicianIds?.map((id) => ({ id }));
  if (input.id) {
    await prisma.nursery.update({
      where: { id: input.id },
      data: { ...base, ...(techConnect ? { technicians: { set: techConnect } } : {}) },
    });
  } else {
    await prisma.nursery.create({
      data: { ...base, ...(techConnect ? { technicians: { connect: techConnect } } : {}) },
    });
  }
  revalidatePath("/settings/nurseries");
  revalidatePath("/nurseries");
}

/* ---- Users (Owner only) ---- */
export async function upsertUser(input: {
  id?: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  active?: boolean;
}) {
  const user = await requireSessionUser();
  assert(canManageUsers(user.role));
  const base = {
    name: input.name.trim(),
    email: input.email.toLowerCase().trim(),
    role: input.role,
    active: input.active ?? true,
  };
  if (input.id) {
    await prisma.user.update({
      where: { id: input.id },
      data: {
        ...base,
        ...(input.password ? { passwordHash: await hashPassword(input.password) } : {}),
      },
    });
  } else {
    if (!input.password) throw new Error("Password required for new user");
    await prisma.user.create({
      data: { ...base, passwordHash: await hashPassword(input.password) },
    });
  }
  revalidatePath("/settings/users");
}
