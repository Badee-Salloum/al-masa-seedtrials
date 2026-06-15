import { describe, it, expect } from "vitest";
import { prepareProductVals } from "./product";

describe("prepareProductVals (Odoo _prepare_product_vals parity)", () => {
  it("maps agronomy fields", () => {
    const v = prepareProductVals({
      code: "ST/2026/0001",
      seedName: "Roma Tomato",
      supplierBatchNumber: "TOM-2026-001",
      germinationRate: 92,
      purity: 98.5,
      npkN: 12,
      npkP: 8,
      npkK: 10,
      shelfLife: 24,
      countryName: "Jordan",
      seasonName: "Spring 2026",
    });
    expect(v.name).toBe("Roma Tomato");
    expect(v.defaultCode).toBe("TOM-2026-001");
    expect(v.saleOk).toBe(true);
    expect(v.purchaseOk).toBe(false);
    expect(v.productType).toBe("consu");
    expect(v.salePrice).toBe(0);
    expect(v.descriptionSale).toContain("NPK: 12-8-10");
    expect(v.descriptionSale).toContain("Country of Origin: Jordan");
    expect(v.descriptionSale).toContain("Germination Rate: 92.00%");
  });

  it("falls back to code when seedName/batch missing", () => {
    const v = prepareProductVals({ code: "ST/2026/0002" });
    expect(v.name).toBe("ST/2026/0002");
    expect(v.defaultCode).toBe("ST/2026/0002");
  });
});
