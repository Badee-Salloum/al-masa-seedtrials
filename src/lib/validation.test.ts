import { describe, it, expect } from "vitest";
import {
  percentSchema,
  nonNegativeSchema,
  trialSchema,
  rejectSchema,
} from "./validation";

describe("percentSchema boundaries", () => {
  it.each([
    [-1, false],
    [0, true],
    [100, true],
    [101, false],
  ])("%i → %s", (value, ok) => {
    expect(percentSchema.safeParse(value).success).toBe(ok);
  });
});

describe("nonNegativeSchema boundaries", () => {
  it.each([
    [-1, false],
    [0, true],
    [5, true],
  ])("%i → %s", (value, ok) => {
    expect(nonNegativeSchema.safeParse(value).success).toBe(ok);
  });
});

describe("trialSchema", () => {
  it("rejects dateEnd < dateStart", () => {
    expect(
      trialSchema.safeParse({
        seedName: "x",
        dateStart: "2026-05-01",
        dateEnd: "2026-04-01",
      }).success,
    ).toBe(false);
  });
  it("accepts dateEnd >= dateStart", () => {
    expect(
      trialSchema.safeParse({
        seedName: "x",
        dateStart: "2026-04-01",
        dateEnd: "2026-05-01",
      }).success,
    ).toBe(true);
  });
  it("requires seedName", () =>
    expect(trialSchema.safeParse({ seedName: "" }).success).toBe(false));
  it("rejects germinationRate out of range", () =>
    expect(
      trialSchema.safeParse({ seedName: "x", germinationRate: 150 }).success,
    ).toBe(false));
});

describe("rejectSchema", () => {
  it("rejects empty/whitespace reason", () =>
    expect(rejectSchema.safeParse({ rejectionReason: "   " }).success).toBe(false));
  it("accepts a real reason", () =>
    expect(rejectSchema.safeParse({ rejectionReason: "low germination" }).success).toBe(
      true,
    ));
});
