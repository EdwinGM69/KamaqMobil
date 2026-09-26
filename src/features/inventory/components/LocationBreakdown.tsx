import { Platform, View, Text } from "react-native";
import { type Product } from "@/infrastructure/database/repositories/products.repo";
import { splitLocations } from "@/features/inventory/utils/locations";

export type StockStatus = "ok" | "low" | "out";

const C = {
  field: "#232329",
  border: "#2A2A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  success: "#00C851",
  blue: "#2F69EB",
  warning: "#FF8800",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

export function getStatus(p: Product | { stock: number; min_stock: number }): StockStatus {
  if (p.stock === 0) return "out";
  if (p.stock <= p.min_stock) return "low";
  return "ok";
}

export const STATUS_META: Record<StockStatus, { label: string; color: string; bg: string }> = {
  ok: { label: "Óptimo", color: "#00C851", bg: "rgba(0,200,81,0.12)" },
  low: { label: "Bajo stock", color: "#FF8800", bg: "rgba(255,136,0,0.12)" },
  out: { label: "Agotado", color: "#FF3547", bg: "rgba(255,53,71,0.12)" },
};

export function LocationBreakdown({
  stock,
  compact = false,
  decimals = 0,
}: {
  stock: number;
  compact?: boolean;
  decimals?: number;
}) {
  const split = splitLocations(stock, decimals);
  const fmt = (v: number) =>
    v.toFixed(v % 1 === 0 ? 0 : Math.min(decimals, 3));
  const items = [
    { label: "Exhibición", value: split.exhibition, color: C.success },
    { label: "Depósito", value: split.warehouse, color: C.blue },
    { label: "Bloqueado", value: split.blocked, color: C.warning },
  ];

  if (compact) {
    return (
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        {items.map((it) => (
          <View key={it.label} style={{ flex: 1, backgroundColor: C.field, borderRadius: 8, borderWidth: 1, borderColor: C.border, paddingVertical: 6, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: it.color, marginRight: 4 }} />
              <Text style={{ fontSize: 9, color: C.textSecondary, textTransform: "uppercase" }}>{it.label}</Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: C.textPrimary, fontFamily: MONO, marginTop: 2 }}>
              {fmt(it.value)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  const total = Math.max(stock, 1);
  return (
    <View>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 5 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: it.color, marginRight: 10 }} />
          <Text style={{ flex: 1, fontSize: 13, color: C.textSecondary }}>{it.label}</Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>{fmt(it.value)}</Text>
          <View style={{ width: 70, marginLeft: 12, height: 5, borderRadius: 3, backgroundColor: C.field, overflow: "hidden" }}>
            <View style={{ width: `${(it.value / total) * 100}%`, height: "100%", backgroundColor: it.color }} />
          </View>
        </View>
      ))}
    </View>
  );
}