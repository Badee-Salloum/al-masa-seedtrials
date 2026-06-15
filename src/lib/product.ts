import { formatNpk } from "./npk";

// Ports Odoo _prepare_product_vals / _build_agronomy_description (agri_seed_trial.py).
export interface TrialForProduct {
  code: string;
  seedName?: string | null;
  supplierBatchNumber?: string | null;
  germinationRate?: number | string | null;
  purity?: number | string | null;
  npkN?: number | string | null;
  npkP?: number | string | null;
  npkK?: number | string | null;
  shelfLife?: number | null;
  countryName?: string | null;
  seasonName?: string | null;
}

export interface ProductVals {
  name: string;
  defaultCode: string;
  saleOk: boolean;
  purchaseOk: boolean;
  productType: string;
  salePrice: number;
  descriptionSale: string;
}

const pct = (v: number | string | null | undefined) =>
  v == null || v === "" ? null : Number(v).toFixed(2);

export function buildAgronomyDescription(t: TrialForProduct): string {
  const lines: string[] = [];
  if (t.germinationRate != null && t.germinationRate !== "")
    lines.push(`Germination Rate: ${pct(t.germinationRate)}%`);
  if (t.purity != null && t.purity !== "")
    lines.push(`Purity: ${pct(t.purity)}%`);
  if (t.npkN != null || t.npkP != null || t.npkK != null)
    lines.push(`NPK: ${formatNpk(t.npkN, t.npkP, t.npkK)}`);
  if (t.countryName) lines.push(`Country of Origin: ${t.countryName}`);
  if (t.seasonName) lines.push(`Season: ${t.seasonName}`);
  if (t.shelfLife != null) lines.push(`Shelf Life: ${t.shelfLife} months`);
  if (t.supplierBatchNumber)
    lines.push(`Supplier Batch: ${t.supplierBatchNumber}`);
  return lines.join("\n");
}

export function prepareProductVals(t: TrialForProduct): ProductVals {
  return {
    name: t.seedName || t.code,
    defaultCode: t.supplierBatchNumber || t.code,
    saleOk: true,
    purchaseOk: false,
    productType: "consu",
    salePrice: 0,
    descriptionSale: buildAgronomyDescription(t),
  };
}
