import { describe, it, expect } from "vitest";
import { AuditAction, TrialState } from "@prisma/client";
import { diffAuditFields, createAuditRow } from "./audit";

describe("diffAuditFields (test_audit parity)", () => {
  it("no audited change → []", () =>
    expect(diffAuditFields({ germinationRate: 90 }, { germinationRate: 90 })).toEqual([]));

  it("field edit → one FIELD_EDIT row", () => {
    const rows = diffAuditFields({ germinationRate: 90 }, { germinationRate: 77 });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      action: AuditAction.FIELD_EDIT,
      fieldName: "germinationRate",
      oldValue: "90",
      newValue: "77",
    });
  });

  it("state change → one STATE_CHANGE row", () => {
    const rows = diffAuditFields(
      { state: TrialState.REVIEW },
      { state: TrialState.ACCEPTED },
    );
    expect(rows[0]).toMatchObject({
      action: AuditAction.STATE_CHANGE,
      fieldName: "state",
      oldValue: "REVIEW",
      newValue: "ACCEPTED",
    });
  });

  it("state + field together → two rows", () => {
    const rows = diffAuditFields(
      { state: TrialState.REVIEW, purity: 90 },
      { state: TrialState.ACCEPTED, purity: 95 },
    );
    expect(rows).toHaveLength(2);
  });

  it("m2o logged by display name", () => {
    const rows = diffAuditFields({ supplier: "Old Co" }, { supplier: "New Co" });
    expect(rows[0]).toMatchObject({
      fieldName: "supplier",
      oldValue: "Old Co",
      newValue: "New Co",
      action: AuditAction.FIELD_EDIT,
    });
  });

  it("only fields present in `after` are considered", () =>
    expect(
      diffAuditFields({ germinationRate: 90, purity: 80 }, { purity: 85 }),
    ).toHaveLength(1));

  it("unchanged value short-circuits (null vs empty)", () =>
    expect(diffAuditFields({ supplier: null }, { supplier: "" })).toEqual([]));
});

describe("createAuditRow", () => {
  it("one CREATE row carrying the initial state", () =>
    expect(createAuditRow(TrialState.DRAFT)).toMatchObject({
      action: AuditAction.CREATE,
      newValue: "DRAFT",
    }));
});
