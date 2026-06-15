import { AuditAction, TrialState } from "@prisma/client";

// Audit diffing — ports AUDIT_FIELDS from Odoo agri_seed_trial.py. M2O fields are represented
// by their display NAME in the snapshot (so the diff naturally records names, not ids).
export const AUDIT_SNAPSHOT_FIELDS = [
  "state",
  "germinationRate",
  "purity",
  "npkN",
  "npkP",
  "npkK",
  "shelfLife",
  "supplier",
  "season",
  "country",
  "supplierBatchNumber",
] as const;

export type AuditField = (typeof AUDIT_SNAPSHOT_FIELDS)[number];
export type AuditSnapshot = Partial<Record<AuditField, unknown>>;

export interface AuditRowInput {
  action: AuditAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string | null;
}

function norm(v: unknown): string {
  if (v === null || v === undefined) return "";
  return String(v);
}

// One row per changed audited field (state → STATE_CHANGE, else FIELD_EDIT). Unchanged → skipped.
// Only fields present in `after` are considered (an update touches a subset).
export function diffAuditFields(
  before: AuditSnapshot,
  after: AuditSnapshot,
): AuditRowInput[] {
  const rows: AuditRowInput[] = [];
  for (const field of AUDIT_SNAPSHOT_FIELDS) {
    if (!(field in after)) continue;
    const oldValue = norm(before[field]);
    const newValue = norm(after[field]);
    if (oldValue === newValue) continue;
    rows.push({
      action: field === "state" ? AuditAction.STATE_CHANGE : AuditAction.FIELD_EDIT,
      fieldName: field,
      oldValue,
      newValue,
      description: field,
    });
  }
  return rows;
}

// Exactly one CREATE row on trial creation (newValue = initial state).
export function createAuditRow(initialState: TrialState): AuditRowInput {
  return {
    action: AuditAction.CREATE,
    fieldName: null,
    oldValue: null,
    newValue: initialState,
    description: "create",
  };
}
