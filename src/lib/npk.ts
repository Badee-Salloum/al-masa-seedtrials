// NPK display — mirrors Odoo `"%g-%g-%g" % (n, p, k)` (strips trailing zeros).
function g(value: number | string | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return "0";
  // %g semantics: up to 6 significant digits, no trailing zeros.
  return parseFloat(num.toPrecision(6)).toString();
}

export function formatNpk(
  n: number | string | null | undefined,
  p: number | string | null | undefined,
  k: number | string | null | undefined,
): string {
  return `${g(n)}-${g(p)}-${g(k)}`;
}
