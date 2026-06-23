import { Role } from "@prisma/client";

// RBAC + record-scoping — single enforcement point replacing Odoo ACL + ir.rule record rules.
export interface SessionUser {
  id: string;
  role: Role;
  nurseryIds?: string[];
}

const RANK: Record<Role, number> = {
  [Role.TECHNICIAN]: 1,
  [Role.ENGINEER]: 2,
  [Role.MANAGER]: 3,
  [Role.OWNER]: 4,
};

export function hasAtLeast(role: Role, min: Role): boolean {
  return RANK[role] >= RANK[min];
}

// Engineer is an analyst: org-wide READ of trials/analytics, writes a recommendation, but
// no management/decision rights. So it's not purely linear — handle it explicitly.
export const canSeeAllTrials = (r: Role) =>
  r === Role.ENGINEER || hasAtLeast(r, Role.MANAGER);
export const canAnalyze = (r: Role) =>
  r === Role.ENGINEER || hasAtLeast(r, Role.MANAGER);
export const canSeeAnalytics = (r: Role) =>
  r === Role.ENGINEER || hasAtLeast(r, Role.MANAGER);

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

// Record-scoping where-clauses (managers/owners/engineers see all; technicians scoped to nursery).
export function scopeTrialsWhere(u: SessionUser) {
  if (canSeeAllTrials(u.role)) return {};
  return {
    OR: [
      { distributions: { some: { nursery: { technicians: { some: { id: u.id } } } } } },
      { createdById: u.id },
    ],
  };
}

export function scopeDistributionsWhere(u: SessionUser) {
  if (canSeeAllTrials(u.role)) return {};
  return { nursery: { technicians: { some: { id: u.id } } } };
}

export function scopeFollowupsWhere(u: SessionUser) {
  if (canSeeAllTrials(u.role)) return {};
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
