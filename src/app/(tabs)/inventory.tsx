import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  LayoutAnimation,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInventory } from "@/features/inventory/hooks/useInventory";
import {
  getStatus,
  STATUS_META,
  type StockStatus,
} from "@/features/inventory/components/LocationBreakdown";
import { splitLocations } from "@/features/inventory/utils/locations";
import { type Product } from "@/infrastructure/database/repositories/products.repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";
import { ProductThumb } from "@/shared/components/ui/ProductThumb";

const C = {
  bg: "#0B0E14",
  card: "#161B22",
  input: "#1C212B",
  field: "#1C212B",
  border: "#21262D",
  textPrimary: "#FFFFFF",
  textSecondary: "#8B949E",
  textMuted: "#6E7681",
  blue: "#3A86FF",
  blueBg: "rgba(58,134,255,0.15)",
  success: "#00E676",
  successBg: "rgba(0,230,118,0.12)",
  warning: "#FF8800",
  warningBg: "rgba(255,136,0,0.12)",
  danger: "#FF5252",
  dangerBg: "rgba(255,82,82,0.12)",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

type StockFilter = "all" | StockStatus | "exp";

const FILTERS: { id: StockFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "low", label: "Bajo stock" },
  { id: "out", label: "Agotados" },
  { id: "exp", label: "Por vencer" },
];

const EXPIRING_DAYS = 30;

function isExpiringSoon(p: Product, days = EXPIRING_DAYS): boolean {
  if (!p.expiration_date || p.stock <= 0) return false;
  const exp = new Date(`${p.expiration_date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (exp.getTime() - today.getTime()) / 86400000;
  return diff >= 0 && diff <= days;
}

export default function InventoryScreen() {
  const router = useRouter();
  const userName = useAuthStore((state) => state.user?.name ?? "");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("all");
  const [compact, setCompact] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleView = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCompact((v) => !v);
    setExpandedId(null);
  };

  const toggleExpanded = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((v) => (v === id ? null : id));
  };

  const { products, isLoading, refetch } = useInventory();

  const metrics = useMemo(() => {
    const low = products.filter((p) => getStatus(p) === "low").length;
    const out = products.filter((p) => getStatus(p) === "out").length;
    const exp = products.filter((p) => isExpiringSoon(p)).length;
    const valorized = products.reduce((sum, p) => sum + p.stock * p.price, 0);
    return { skus: products.length, valorized, low, out, exp, alerts: low + out };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const okFilter =
        filter === "all" ||
        (filter === "low" && getStatus(p) === "low") ||
        (filter === "out" && getStatus(p) === "out") ||
        (filter === "exp" && isExpiringSoon(p));
      const okSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return okFilter && okSearch;
    });
  }, [products, search, filter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={C.textSecondary} />
        }
      >
        {/* ─── Header ─── */}
        <PosHeader avatarName={userName}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Inventario</Text>
            <Text style={{ fontSize: 10, color: C.textSecondary }}> - Control</Text>
          </View>
        </PosHeader>

        {/* ─── Title ─── */}
        {/*}
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: C.textPrimary }}>Control de Stock</Text>
        </View>
        */}

        {/* ─── Summary cards ─── */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <SummaryCard
            label="Total SKUs"
            value={String(metrics.skus)}
            color={C.blue}
          />
          <SummaryCard
            label="Valorizado"
            value={formatCurrency(metrics.valorized)}
            color={C.success}
          />
          <SummaryCard
            label="Alertas"
            value={String(metrics.alerts)}
            color={C.warning}
          />
        </View>

        {/* ─── Search ─── */}
        <View style={{ backgroundColor: C.field, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginTop: 14, height: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
          <Icon name="search" size={18} color={C.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre, SKU o categoría..."
            placeholderTextColor={C.textMuted}
            style={{ flex: 1, marginLeft: 10, fontSize: 13, color: C.textPrimary, height: 44 }}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <Icon name="close" size={17} color={C.textSecondary} />
            </Pressable>
          )}
        </View>

        {/* ─── Filters ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => {
            const active = f.id === filter;
            const count = f.id === "all" ? metrics.skus : f.id === "low" ? metrics.low : f.id === "out" ? metrics.out : metrics.exp;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFilter(f.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: active ? C.blue : C.field,
                  borderWidth: 1,
                  borderColor: active ? C.blue : C.border,
                  borderRadius: 18,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ fontSize: 12, color: active ? "#FFFFFF" : C.textSecondary }}>
                  {f.label}
                </Text>
                <View
                  style={{
                    marginLeft: 8,
                    minWidth: 20,
                    height: 18,
                    borderRadius: 9,
                    paddingHorizontal: 5,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: active ? "rgba(255,255,255,0.25)" : C.border,
                  }}
                >
                  <Text style={{ fontSize: 10, color: active ? "#FFFFFF" : C.textSecondary }}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
          <View style={{ width: 1, alignSelf: "stretch", backgroundColor: C.border, marginVertical: 4 }} />
          <Pressable
            onPress={toggleView}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.field,
              borderWidth: 1,
              borderColor: C.border,
              borderRadius: 18,
              paddingHorizontal: 12,
              paddingVertical: 7,
            }}
          >
            <Icon name={compact ? "menu" : "grid_view"} size={14} color={C.textSecondary} />
            <Text style={{ fontSize: 12, color: C.textSecondary, marginLeft: 6 }}>
              {compact ? "Compacto" : "Detallado"}
            </Text>
          </Pressable>
        </ScrollView>

        {/* ─── Product list ─── */}
        <View style={{ marginTop: 14 }}>
          {isLoading && products.length === 0 ? (
            <ActivityIndicator size="large" color={C.blue} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Icon name="inventory_2" size={44} color={C.border} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.textSecondary, marginTop: 10 }}>
                {search.trim() || filter !== "all" ? "Sin resultados" : "Aún no hay productos"}
              </Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, opacity: 0.7, marginTop: 6, textAlign: "center", paddingHorizontal: 24 }}>
                {search.trim() || filter !== "all"
                  ? "Ajusta la búsqueda o el filtro para encontrar productos."
                  : "Registra tus primeros productos para empezar a vender."}
              </Text>
            </View>
          ) : (
            filtered.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                compact={compact}
                expanded={expandedId === p.id}
                onToggle={() => toggleExpanded(p.id)}
                onPress={() => router.push(`/inventory/${p.id}` as never)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12 }}>
      <Text style={{ fontSize: 8, color, textTransform: "uppercase", letterSpacing: 0.3, textAlign: "center" }}>
        {label}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{ fontSize: 18, fontWeight: "700", color, fontFamily: MONO, textAlign: "center", marginTop: 10 }}
      >
        {value}
      </Text>
    </View>
  );
}

function ProductCard({
  product,
  compact,
  expanded,
  onToggle,
  onPress,
}: {
  product: Product;
  compact: boolean;
  expanded: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const status = STATUS_META[getStatus(product)];
  const marginPct = product.cost_price > 0 ? ((product.price - product.cost_price) / product.cost_price) * 100 : 0;
  const split = splitLocations(product.stock, product.decimals);
  const fmtQty = (v: number) =>
    v.toFixed(v % 1 === 0 ? 0 : Math.min(Math.max(product.decimals ?? 0, 0), 3));
  const locationsLine = `Exhibición ${fmtQty(split.exhibition)} · Depósito ${fmtQty(product.stock - split.exhibition)}`;
  const showDetails = !compact || expanded;

  return (
    <Pressable
      onPress={() => (showDetails ? onPress() : onToggle())}
      style={({ pressed }) => [
        {
          backgroundColor: C.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          padding: 12,
          marginBottom: 8,
          overflow: "hidden",
        },
        pressed && { opacity: 0.9 },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ProductThumb category={product.category} size={44} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>
            {product.name}
          </Text>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
            {product.category} · Mín. {fmtQty(product.min_stock)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: status.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: status.color, marginRight: 5 }} />
            <Text style={{ fontSize: 10, fontWeight: "600", color: status.color, textTransform: "uppercase" }}>
              {status.label}
            </Text>
          </View>
          {compact && (
            <Pressable onPress={onToggle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginTop: 2 }}>
              <Icon name={expanded ? "expand_less" : "expand_more"} size={16} color={C.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {showDetails && (
        <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View>
              <Text style={{ fontSize: 10, color: C.textMuted }}>Disponible</Text>
              <Text style={{ fontSize: 16, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
                {fmtQty(product.stock)} <Text style={{ fontSize: 11, color: C.textSecondary }}>{product.unit}</Text>
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontSize: 10, color: C.textMuted }}>Precio venta</Text>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
                {formatCurrency(product.price)}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 10, color: C.textSecondary, marginTop: 8 }}>{locationsLine}</Text>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 10, color: C.textMuted }}>
              Mín./Reorden <Text style={{ color: C.textPrimary, fontFamily: MONO }}>{fmtQty(product.min_stock)}</Text>
            </Text>
            <Text style={{ fontSize: 10, color: C.textMuted }}>
              Margen <Text style={{ color: marginPct > 0 ? C.success : C.danger, fontFamily: MONO }}>{marginPct > 0 ? "+" : ""}{marginPct.toFixed(0)}%</Text>
            </Text>
            <Text numberOfLines={1} style={{ fontSize: 10, color: C.textMuted, flexShrink: 1 }}>
              SKU <Text style={{ color: C.textPrimary, fontFamily: MONO }}>{product.barcode}</Text>
            </Text>
          </View>

          <Pressable
            onPress={onPress}
            style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.blueBg, borderRadius: 10, paddingVertical: 9, marginTop: 10 }}
          >
            <Icon name="chevron_right" size={16} color={C.blue} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: C.blue }}>Ver ficha completa</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}