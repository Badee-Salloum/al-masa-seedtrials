import { describe, it, expect } from "vitest";
import { TrialState } from "@prisma/client";
import {
  canTransition,
  nextState,
  isValidRejectionReason,
  type WorkflowAction,
} from "./workflow";

const STATES = Object.values(TrialState);
const ACTIONS: WorkflowAction[] = [
  "start",
  "toReview",
  "accept",
  "reject",
  "resetToDraft",
];

// Expected allowed from-states per action — ports the Odoo guards (agri_seed_trial.py).
const ALLOWED: Record<WorkflowAction, TrialState[]> = {
  start: [TrialState.DRAFT],
  toReview: [TrialState.IN_TRIAL],
  accept: [TrialState.REVIEW],
  reject: [TrialState.IN_TRIAL, TrialState.REVIEW],
  resetToDraft: [TrialState.REVIEW, TrialState.ACCEPTED, TrialState.REJECTED],
};

describe("workflow 5×5 transition matrix", () => {
  for (const action of ACTIONS) {
    for (const state of STATES) {
      const allowed = ALLOWED[action].includes(state);
      it(`${state} + ${action} → ${allowed ? "ALLOW" : "BLOCK"}`, () => {
        expect(canTransition(action, state)).toBe(allowed);
      });
    }
  }
});

describe("nextState", () => {
  it("start → IN_TRIAL", () => expect(nextState("start")).toBe(TrialState.IN_TRIAL));
  it("accept → ACCEPTED", () => expect(nextState("accept")).toBe(TrialState.ACCEPTED));
  it("reject → REJECTED", () => expect(nextState("reject")).toBe(TrialState.REJECTED));
  it("resetToDraft → DRAFT", () =>
    expect(nextState("resetToDraft")).toBe(TrialState.DRAFT));
});

describe("rejection reason (test_reject_requires_reason)", () => {
  it("empty / whitespace / null are invalid", () => {
    expect(isValidRejectionReason("")).toBe(false);
    expect(isValidRejectionReason("   ")).toBe(false);
    expect(isValidRejectionReason(null)).toBe(false);
    expect(isValidRejectionReason(undefined)).toBe(false);
  });
  it("non-empty is valid", () => {
    expect(isValidRejectionReason("low germination")).toBe(true);
  });
});
