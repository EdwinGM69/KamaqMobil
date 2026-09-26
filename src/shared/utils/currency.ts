export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatStock(stock: number): string {
  return new Intl.NumberFormat("es-PE").format(stock);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatPriceWithUnit(
  price: number,
  unit: string | null | undefined,
  suffix?: string
): string {
  return `${formatCurrency(price)}${suffix ?? (unit ? ` / ${unit}` : "")}`;
}
