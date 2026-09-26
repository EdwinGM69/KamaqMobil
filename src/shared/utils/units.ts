export const UNIT_OPTIONS = [
  { value: "und", label: "Unidad", decimals: 0, variable: false },
  { value: "kg", label: "Kilogramo", decimals: 3, variable: true },
  { value: "g", label: "Gramo", decimals: 0, variable: true },
  { value: "lt", label: "Litro", decimals: 3, variable: true },
  { value: "ml", label: "Mililitro", decimals: 0, variable: true },
  { value: "m", label: "Metro", decimals: 2, variable: true },
  { value: "caja", label: "Caja", decimals: 0, variable: false },
  { value: "paq", label: "Paquete", decimals: 0, variable: false },
] as const;

export type UnitValue = (typeof UNIT_OPTIONS)[number]["value"];

export function isVariableUnit(unit: string | null | undefined): boolean {
  if (!unit) return false;
  const opt = UNIT_OPTIONS.find((o) => o.value === unit);
  return opt?.variable ?? true;
}

export function getUnitLabel(unit: string | null | undefined): string {
  if (!unit) return "und";
  return UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? unit;
}

export function getDefaultDecimals(unit: string | null | undefined): number {
  if (!unit) return 0;
  return UNIT_OPTIONS.find((o) => o.value === unit)?.decimals ?? 0;
}

export function getUnitSymbol(unit: string | null | undefined): string {
  if (!unit) return "und";
  return UNIT_OPTIONS.find((o) => o.value === unit)?.value ?? unit;
}

export function formatQuantity(
  quantity: number,
  unit: string | null | undefined,
  decimals?: number
): string {
  const d = decimals ?? getDefaultDecimals(unit);
  return `${quantity.toFixed(d)} ${getUnitSymbol(unit)}`;
}

export function getPriceSuffix(unit: string | null | undefined): string {
  if (!unit) return "";
  if (isVariableUnit(unit)) return ` / ${getUnitSymbol(unit)}`;
  return "";
}

export function parseFrequentQuantities(
  csv: string | null | undefined
): number[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => parseFloat(s.trim()))
    .filter((n) => !isNaN(n) && n > 0);
}

export function clampToStep(value: number, step: number): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}