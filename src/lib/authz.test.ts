import { describe, it, expect } from "vitest";
import { Role } from "@prisma/client";
import {
  hasAtLeast,
  canCreateTrial,
  canDeleteTrial,
  canAcceptTrial,
  canReadAudit,
  canAnalyze,
  canSeeAllTrials,
  canSeeAnalytics,
  scopeTrialsWhere,
  scopeFollowupsWhere,
} from "./authz";

describe("hasAtLeast", () => {
  it("owner >= manager", () => expect(hasAtLeast(Role.OWNER, Role.MANAGER)).toBe(true));
  it("manager >= manager", () => expect(hasAtLeast(Role.MANAGER, Role.MANAGER)).toBe(true));
  it("technician < manager", () =>
    expect(hasAtLeast(Role.TECHNICIAN, Role.MANAGER)).toBe(false));
});

describe("capabilities (ir.model.access.csv parity)", () => {
  it("only manager+ create trials", () => {
    expect(canCreateTrial(Role.TECHNICIAN)).toBe(false);
    expect(canCreateTrial(Role.MANAGER)).toBe(true);
  });
  it("only owner hard-deletes trials", () => {
    expect(canDeleteTrial(Role.MANAGER)).toBe(false);
    expect(canDeleteTrial(Role.OWNER)).toBe(true);
  });
  it("manager+ accept; technician no audit", () => {
    expect(canAcceptTrial(Role.MANAGER)).toBe(true);
    expect(canReadAudit(Role.TECHNICIAN)).toBe(false);
    expect(canReadAudit(Role.OWNER)).toBe(true);
  });
});

describe("scopeTrialsWhere (record-rule parity)", () => {
  it("manager unrestricted", () =>
    expect(scopeTrialsWhere({ id: "u1", role: Role.MANAGER })).toEqual({}));
  it("technician = own-nursery OR self-created", () =>
    expect(scopeTrialsWhere({ id: "u1", role: Role.TECHNICIAN })).toEqual({
      OR: [
        { distributions: { some: { nursery: { technicians: { some: { id: "u1" } } } } } },
        { createdById: "u1" },
      ],
    }));
});

describe("scopeFollowupsWhere", () => {
  it("technician scoped to own-nursery distributions", () =>
    expect(scopeFollowupsWhere({ id: "u2", role: Role.TECHNICIAN })).toEqual({
      distribution: { nursery: { technicians: { some: { id: "u2" } } } },
    }));
  it("owner unrestricted", () =>
    expect(scopeFollowupsWhere({ id: "u2", role: Role.OWNER })).toEqual({}));
});

describe("ENGINEER role (analyst: org-wide read + recommend, no decision)", () => {
  it("ranks above technician, below manager", () => {
    expect(hasAtLeast(Role.ENGINEER, Role.TECHNICIAN)).toBe(true);
    expect(hasAtLeast(Role.ENGINEER, Role.MANAGER)).toBe(false);
  });
  it("can analyze, see all trials and analytics", () => {
    expect(canAnalyze(Role.ENGINEER)).toBe(true);
    expect(canSeeAllTrials(Role.ENGINEER)).toBe(true);
    expect(canSeeAnalytics(Role.ENGINEER)).toBe(true);
  });
  it("sees all trials (no nursery scoping)", () =>
    expect(scopeTrialsWhere({ id: "e1", role: Role.ENGINEER })).toEqual({}));
  it("cannot create/accept/delete trials or read audit", () => {
    expect(canCreateTrial(Role.ENGINEER)).toBe(false);
    expect(canAcceptTrial(Role.ENGINEER)).toBe(false);
    expect(canDeleteTrial(Role.ENGINEER)).toBe(false);
    expect(canReadAudit(Role.ENGINEER)).toBe(false);
  });
  it("technician cannot analyze", () => expect(canAnalyze(Role.TECHNICIAN)).toBe(false));
});
