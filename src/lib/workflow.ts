import { TrialState } from "@prisma/client";

// Workflow state machine — ports the guards from Odoo agri_seed_trial.py.
export type WorkflowAction =
  | "start"
  | "toReview"
  | "accept"
  | "reject"
  | "resetToDraft";

export const TRANSITIONS: Record<
  WorkflowAction,
  { from: TrialState[]; to: TrialState }
> = {
  start: { from: [TrialState.DRAFT], to: TrialState.IN_TRIAL },
  toReview: { from: [TrialState.IN_TRIAL], to: TrialState.REVIEW },
  accept: { from: [TrialState.REVIEW], to: TrialState.ACCEPTED },
  reject: {
    from: [TrialState.IN_TRIAL, TrialState.REVIEW],
    to: TrialState.REJECTED,
  },
  resetToDraft: {
    from: [TrialState.REVIEW, TrialState.ACCEPTED, TrialState.REJECTED],
    to: TrialState.DRAFT,
  },
};

export function canTransition(action: WorkflowAction, state: TrialState): boolean {
  return TRANSITIONS[action].from.includes(state);
}

export function nextState(action: WorkflowAction): TrialState {
  return TRANSITIONS[action].to;
}

export const canStart = (s: TrialState) => canTransition("start", s);
export const canToReview = (s: TrialState) => canTransition("toReview", s);
export const canAccept = (s: TrialState) => canTransition("accept", s);
export const canReject = (s: TrialState) => canTransition("reject", s);
export const canReset = (s: TrialState) => canTransition("resetToDraft", s);

// Reject requires a non-empty (trimmed) reason — ports test_reject_requires_reason.
export function isValidRejectionReason(reason: string | null | undefined): boolean {
  return !!reason && reason.trim().length > 0;
}
