import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomers } from "@/features/customer/hooks/useCustomers";
import { type Customer } from "@/infrastructure/database/repositories/customers.repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";

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

type DebtFilter = "all" | "debt" | "clean";

const FILTERS: { id: DebtFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "debt", label: "Con deuda" },
  { id: "clean", label: "Al día" },
];

export default function CustomersScreen() {
  const router = useRouter();
  const userName = useAuthStore((state) => state.user?.name ?? "");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<DebtFilter>("all");

  const { customers, isLoading, refetch } = useCustomers(search);

  const metrics = useMemo(() => {
    const withDebt = customers.filter((c) => c.debt > 0).length;
    const totalDebt = customers.reduce((sum, c) => sum + c.debt, 0);
    return { total: customers.length, withDebt, totalDebt };
  }, [customers]);

  const filtered = useMemo(() => {
    return customers.filter((c) =>
      filter === "all" ? true : filter === "debt" ? c.debt > 0 : c.debt <= 0
    );
  }, [customers, filter]);

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
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Clientes</Text>
            <Text style={{ fontSize: 10, color: C.textSecondary }}> - Créditos</Text>
          </View>
        </PosHeader>

        {/* ─── Summary cards ─── */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
          <SummaryCard label="Total clientes" value={String(metrics.total)} color={C.blue} />
          <SummaryCard label="Con deuda" value={String(metrics.withDebt)} color={C.warning} />
          <SummaryCard label="Deuda total" value={formatCurrency(metrics.totalDebt)} color={C.danger} />
        </View>

        {/* ─── Search ─── */}
        <View style={{ backgroundColor: C.field, borderRadius: 14, borderWidth: 1, borderColor: C.border, marginTop: 14, height: 44, flexDirection: "row", alignItems: "center", paddingHorizontal: 12 }}>
          <Icon name="search" size={18} color={C.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por nombre o documento..."
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
            const count =
              f.id === "all" ? metrics.total : f.id === "debt" ? metrics.withDebt : metrics.total - metrics.withDebt;
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
                <Text style={{ fontSize: 12, color: active ? "#FFFFFF" : C.textSecondary }}>{f.label}</Text>
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
        </ScrollView>

        {/* ─── Customer list ─── */}
        <View style={{ marginTop: 14 }}>
          {isLoading && customers.length === 0 ? (
            <ActivityIndicator size="large" color={C.blue} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Icon name="groups" size={44} color={C.border} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.textSecondary, marginTop: 10 }}>
                {search.trim() || filter !== "all" ? "Sin resultados" : "Aún no hay clientes"}
              </Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, opacity: 0.7, marginTop: 6, textAlign: "center", paddingHorizontal: 24 }}>
                {search.trim() || filter !== "all"
                  ? "Ajusta la búsqueda o el filtro para encontrar clientes."
                  : "Registra clientes para llevar sus cuentas por cobrar."}
              </Text>
            </View>
          ) : (
            filtered.map((customer) => (
              <CustomerCard key={customer.id} customer={customer} onPress={() => router.push(`/customer/${customer.id}` as never)} />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
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

function CustomerCard({ customer, onPress }: { customer: Customer; onPress: () => void }) {
  const hasDebt = customer.debt > 0;
  const isBusiness = customer.document_type === "RUC";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: C.card,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: C.border,
          padding: 14,
          marginBottom: 8,
          overflow: "hidden",
        },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 46, height: 46, borderRadius: 10, backgroundColor: C.blueBg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 22 }}>{isBusiness ? "🏢" : "👤"}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>
            {customer.name}
          </Text>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
            {customer.document_type} <Text style={{ fontFamily: MONO }}>{customer.document_number}</Text>
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: hasDebt ? C.dangerBg : C.successBg,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: hasDebt ? C.danger : C.success, marginRight: 5 }} />
          <Text style={{ fontSize: 10, fontWeight: "600", color: hasDebt ? C.danger : C.success, textTransform: "uppercase" }}>
            {hasDebt ? "Con deuda" : "Al día"}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border }}>
        <Text style={{ fontSize: 10, color: C.textMuted }}>Deuda</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: hasDebt ? C.danger : C.success, fontFamily: MONO }}>
            {formatCurrency(customer.debt)}
          </Text>
          <Icon name="chevron_right" size={16} color={C.textSecondary} style={{ marginLeft: 4 }} />
        </View>
      </View>
    </Pressable>
  );
}