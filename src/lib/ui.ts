import { TrialState, AuditAction } from "@prisma/client";

// State → pill classes (must match Odoo list decorations: blue/amber/green/red/grey).
export const STATE_PILL: Record<TrialState, string> = {
  [TrialState.DRAFT]: "bg-draft-tint text-draft",
  [TrialState.IN_TRIAL]: "bg-info-tint text-[#1b6f8c]",
  [TrialState.REVIEW]: "bg-warning-tint text-[#8a6a00]",
  [TrialState.ACCEPTED]: "bg-success-tint text-success",
  [TrialState.REJECTED]: "bg-danger-tint text-[#9b2c2c]",
};

export const STATE_ORDER: TrialState[] = [
  TrialState.DRAFT,
  TrialState.IN_TRIAL,
  TrialState.REVIEW,
  TrialState.ACCEPTED,
];

export const AUDIT_DOT: Record<AuditAction, string> = {
  [AuditAction.CREATE]: "bg-draft",
  [AuditAction.STATE_CHANGE]: "bg-brand-sky",
  [AuditAction.FIELD_EDIT]: "bg-warning",
  [AuditAction.ACCEPT]: "bg-success",
};

export function fmtNum(v: { toString(): string } | number | null | undefined): string {
  if (v == null) return "—";
  const n = Number(v.toString());
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}
