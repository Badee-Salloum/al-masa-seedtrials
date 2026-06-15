import { Role } from "@prisma/client";

// RBAC + record-scoping — single enforcement point replacing Odoo ACL + ir.rule record rules.
export interface SessionUser {
  id: string;
  role: Role;
  nurseryIds?: string[];
}

const RANK: Record<Role, number> = {
  [Role.TECHNICIAN]: 1,
  [Role.MANAGER]: 2,
  [Role.OWNER]: 3,
};

export function hasAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

// Model-level capabilities (port of ir.model.access.csv + record-rule perms).
export const canCreateTrial = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canDeleteTrial = (r: Role) => r === Role.OWNER; // managers cannot hard-delete
export const canAcceptTrial = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canRejectTrial = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canResetTrial = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canManageDistributions = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canDeleteFollowup = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canReadAudit = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canManageConfig = (r: Role) => hasAtLeast(r, Role.MANAGER);
export const canManageUsers = (r: Role) => r === Role.OWNER;

// Record-scoping where-clauses (managers/owners unrestricted).
export function scopeTrialsWhere(u: SessionUser) {
  if (hasAtLeast(u.role, Role.MANAGER)) return {};
  return {
    OR: [
      { distributions: { some: { nursery: { technicians: { some: { id: u.id } } } } } },
      { createdById: u.id },
    ],
  };
}

export function scopeDistributionsWhere(u: SessionUser) {
  if (hasAtLeast(u.role, Role.MANAGER)) return {};
  return { nursery: { technicians: { some: { id: u.id } } } };
}

export function scopeFollowupsWhere(u: SessionUser) {
  if (hasAtLeast(u.role, Role.MANAGER)) return {};
  return { distribution: { nursery: { technicians: { some: { id: u.id } } } } };
}

export class AuthzError extends Error {
  constructor(message = "errors.denied") {
    super(message);
    this.name = "AuthzError";
  }
}

export function assert(condition: boolean): asserts condition {
  if (!condition) throw new AuthzError();
}
