import { describe, it, expect } from "vitest";
import { formatNpk } from "./npk";

describe("formatNpk (Odoo %g parity)", () => {
  it("0-0-0", () => expect(formatNpk(0, 0, 0)).toBe("0-0-0"));
  it("10-5-7", () => expect(formatNpk(10, 5, 7)).toBe("10-5-7"));
  it("strips trailing zeros (10.0 → 10)", () => expect(formatNpk(10.0, 5, 0)).toBe("10-5-0"));
  it("keeps real decimals", () => expect(formatNpk(12.5, 8, 10)).toBe("12.5-8-10"));
  it("null/undefined → 0", () => expect(formatNpk(null, undefined, null)).toBe("0-0-0"));
});
