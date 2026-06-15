import { describe, it, expect } from "vitest";
import { formatTrialCode } from "./sequence";

describe("formatTrialCode (ST/YYYY/####)", () => {
  it("pads to 4 digits", () => {
    expect(formatTrialCode(2026, 1)).toBe("ST/2026/0001");
    expect(formatTrialCode(2026, 42)).toBe("ST/2026/0042");
  });
  it("does not truncate beyond 4 digits", () =>
    expect(formatTrialCode(2026, 10000)).toBe("ST/2026/10000"));
  it("year resets the counter", () => {
    expect(formatTrialCode(2025, 9999)).toBe("ST/2025/9999");
    expect(formatTrialCode(2026, 1)).toBe("ST/2026/0001");
  });
});
