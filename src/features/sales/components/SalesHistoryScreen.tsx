import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import type { SaleWithItems } from "@/infrastructure/database/repositories/sales.repo";
import { useSalesHistory, type SaleFilter } from "@/features/sales/hooks/useSalesHistory";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";
import { useOffline } from "@/shared/hooks/useOffline";

const C = {
  bg: "#0B0E14",
  card: "#161B22",
  cardExpanded: "#12161F",
  input: "#1C212B",
  textPrimary: "#FFFFFF",
  textSecondary: "#8B949E",
  green: "#00E676",
  greenBg: "rgba(0,230,118,0.1)",
  red: "#FF5252",
  redBg: "rgba(255,82,82,0.1)",
  blue: "#3A86FF",
  blueBg: "rgba(58,134,255,0.1)",
  border: "#21262D",
};

const MONO = Platform.select({ ios: "Menlo", android: "monospace" }) ?? "monospace";

const FILTERS: { id: SaleFilter; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "completed", label: "Pagadas" },
  { id: "cancelled", label: "Anuladas" },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  completed: { label: "Pagada", color: C.green, bg: C.greenBg, icon: "check_circle" },
  cancelled: { label: "Anulada", color: C.red, bg: C.redBg, icon: "cancel" },
  pending: { label: "Pendiente", color: C.blue, bg: C.blueBg, icon: "schedule" },
};

const PAY_METHODS: Record<string, { label: string; icon: string }> = {
  cash: { label: "Efectivo", icon: "payments" },
  card: { label: "Tarjeta", icon: "credit_card" },
  yape: { label: "Yape/Plin", icon: "qr_code_2" },
};

const QUICK_ACTIONS: { icon: string; label: string }[] = [
  { icon: "print", label: "Imprimir" },
  { icon: "chat", label: "WhatsApp" },
  { icon: "mail", label: "Correo" },
  { icon: "picture_as_pdf", label: "PDF SUNAT" },
];

function formatTime(value: string): { time: string; date: string } {
  const d = new Date(value.replace(" ", "T") + "Z");
  const time = d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
  return { time, date };
}

function ticketShort(number: string): string {
  const parts = number.split("-");
  return parts.length > 1 ? parts[parts.length - 1] : number;
}

export function SalesHistoryScreen() {
  const queryClient = useQueryClient();
  const userName = useAuthStore((state) => state.user?.name ?? "");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<SaleFilter>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data, isLoading } = useSalesHistory(search, filter);

  const sales = data?.sales ?? [];

  const metrics = useMemo(() => {
    const all = data?.all ?? [];
    const completed = all.filter((s) => s.status === "completed");
    const cancelled = all.filter((s) => s.status === "cancelled");
    return {
      collected: completed.reduce((sum, s) => sum + s.total, 0),
      completed: completed.length,
      cancelled: cancelled.length,
      cancelledAmount: cancelled.reduce((sum, s) => sum + s.total, 0),
    };
  }, [data?.all]);

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const selectFilter = (id: SaleFilter) => {
    setFilter(id);
    setDropdownOpen(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["sales-history"] })}
            tintColor={C.textSecondary}
          />
        }
      >
        {/* ─── Header ─── */}
        <PosHeader avatarName={userName}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Ventas</Text>
            <Text style={{ fontSize: 10, color: C.textSecondary }}> - Historial</Text>
          </View>
        </PosHeader>

        {/* ─── Summary card ─── */}
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 12,
            padding: 16,
            marginTop: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: C.textSecondary, letterSpacing: 0.6 }}>
              Total recaudado
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: C.blue, fontFamily: MONO }}>{metrics.completed}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 22, fontWeight: "700", color: C.green, fontFamily: MONO }}>
              S/ {metrics.collected.toFixed(2)}
            </Text>
            <Text style={{ fontSize: 9, fontWeight: "600", color: C.textSecondary }}>
              Operaciones
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
            <View style={{ flex: 1, backgroundColor: C.greenBg, borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="check_circle" size={22} color={C.green} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 18, color: C.green, fontFamily: MONO }}>{metrics.completed}</Text>
                    <Text style={{ fontSize: 8, color: C.green, marginLeft: 6, textTransform: "uppercase" }}>Completadas</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.green, fontFamily: MONO, marginTop: 2 }}>
                    S/ {metrics.collected.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ flex: 1, backgroundColor: C.redBg, borderRadius: 10, padding: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Icon name="cancel" size={22} color={C.red} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 18, color: C.red, fontFamily: MONO }}>{metrics.cancelled}</Text>
                    <Text style={{ fontSize: 8, color: C.red, marginLeft: 6, textTransform: "uppercase" }}>Anuladas</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: C.red, fontFamily: MONO, marginTop: 2 }}>
                    S/ {metrics.cancelledAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Search bar ─── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.input,
            borderRadius: 20,
            paddingLeft: 14,
            paddingRight: 8,
            height: 44,
            marginTop: 14,
          }}
        >
          <Icon name="search" size={18} color={C.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar ticket, producto o forma de pago..."
            placeholderTextColor={C.textSecondary}
            style={{ flex: 1, marginLeft: 10, fontSize: 13, color: "#FFFFFF", height: 44 }}
          />
          <Pressable
            onPress={() => setDropdownOpen((v) => !v)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: dropdownOpen ? C.blue : C.input,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="tune" size={17} color={dropdownOpen ? "#FFFFFF" : C.textSecondary} />
          </Pressable>
        </View>

        {dropdownOpen && (
          <View style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginTop: 8, overflow: "hidden" }}>
            {FILTERS.map((f, idx) => {
              const active = f.id === filter;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => selectFilter(f.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    borderBottomWidth: idx < FILTERS.length - 1 ? 1 : 0,
                    borderBottomColor: C.border,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: active ? "#FFFFFF" : C.textSecondary }}>
                    {f.label}
                  </Text>
                  {active && <Icon name="check" size={16} weight={700} color={C.blue} />}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* ─── Filter pills ─── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => {
            const active = f.id === filter;
            const count =
              f.id === "all"
                ? (data?.all.length ?? 0)
                : f.id === "completed"
                  ? metrics.completed
                  : metrics.cancelled;
            return (
              <Pressable
                key={f.id}
                onPress={() => selectFilter(f.id)}
                style={{
                  backgroundColor: active ? C.blue : C.input,
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                }}
              >
                <Text style={{ fontSize: 12, color: active ? "#FFFFFF" : C.textSecondary }}>
                  {f.label}
                  <Text style={{ fontSize: 12, color: active ? "#FFFFFF" : C.textSecondary, opacity: 0.6 }}>
                    {" (" + count + ")"}
                  </Text>
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ─── List ─── */}
        <View style={{ marginTop: 14 }}>
          {isLoading && sales.length === 0 ? (
            <ActivityIndicator size="large" color={C.blue} style={{ marginTop: 40 }} />
          ) : sales.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 48 }}>
              <Icon name="receipt_long" size={44} color={C.border} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.textSecondary, marginTop: 10 }}>
                {search.trim() || filter !== "all" ? "Sin resultados" : "Aún no hay ventas"}
              </Text>
              <Text style={{ fontSize: 12, color: C.textSecondary, opacity: 0.7, marginTop: 6, textAlign: "center", paddingHorizontal: 24 }}>
                {search.trim() || filter !== "all"
                  ? "Ajusta la búsqueda o el filtro para encontrar documentos."
                  : "Las ventas que registres aparecerán aquí."}
              </Text>
            </View>
          ) : (
            sales.map((sale) => (
              <SaleTicket
                key={sale.id}
                sale={sale}
                expanded={expandedId === sale.id}
                onToggle={() => toggleExpand(sale.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SaleTicket({
  sale,
  expanded,
  onToggle,
}: {
  sale: SaleWithItems;
  expanded: boolean;
  onToggle: () => void;
}) {
  const status = STATUS_META[sale.status] ?? STATUS_META.pending;
  const pay = PAY_METHODS[sale.payment_method] ?? { label: sale.payment_method, icon: "payments" };
  const { time, date } = formatTime(sale.created_at);
  const unitCount = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  const { isOffline } = useOffline();

  return (
    <View
      style={{
        backgroundColor: expanded ? C.cardExpanded : C.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: C.border,
        marginBottom: 8,
        overflow: "hidden",
      }}
    >
      {/* Collapsed header */}
      <Pressable onPress={onToggle} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: C.input, alignItems: "center", justifyContent: "center" }}>
            <Icon name="receipt_long" size={18} color={status.color} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", fontFamily: MONO }}>
                #{ticketShort(sale.ticket_number)}
              </Text>
              <View style={{ marginLeft: 8, backgroundColor: status.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ fontSize: 10, fontWeight: "600", color: status.color, textTransform: "uppercase" }}>
                  {status.label}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
              <Icon name="schedule" size={11} color={C.textSecondary} />
              <Text style={{ fontSize: 11, color: C.textSecondary, marginLeft: 3 }}>{time}</Text>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: C.textSecondary, marginHorizontal: 6 }} />
              <Icon name={pay.icon} size={11} color={C.textSecondary} />
              <Text style={{ fontSize: 11, color: C.textSecondary, marginLeft: 3 }}>
                {pay.label} · {unitCount} ítems
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: sale.status === "cancelled" ? C.red : "#FFFFFF", fontFamily: MONO }}>
              {formatCurrency(sale.total)}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3 }}>
              <Text style={{ fontSize: 10, color: C.textSecondary }}>{date}</Text>
              <Icon name={expanded ? "expand_less" : "expand_more"} size={15} color={C.textSecondary} style={{ marginLeft: 4 }} />
            </View>
          </View>
        </View>
      </Pressable>

      {/* Expanded detail */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: C.border }}>
          <View style={{ padding: 14 }}>
            {/* SUNAT badge */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.greenBg, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 }}>
                <Icon name="cloud_done" size={13} color={C.green} />
                <Text style={{ fontSize: 10, fontWeight: "600", color: C.green, marginLeft: 5, textTransform: "uppercase" }}>
                  Comp. SUNAT · {sale.ticket_number}
                </Text>
              </View>
            </View>

            {/* Item breakdown */}
            {sale.items.map((item, idx) => (
              <View key={item.id} style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>
                    {item.product_name}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 1, fontFamily: MONO }}>
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF", fontFamily: MONO }}>
                  {formatCurrency(item.total)}
                </Text>
              </View>
            ))}

            {/* Totals */}
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, color: C.textSecondary }}>Subtotal</Text>
                <Text style={{ fontSize: 12, color: "#FFFFFF", fontFamily: MONO }}>{formatCurrency(sale.subtotal)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 }}>
                <Text style={{ fontSize: 12, color: C.textSecondary }}>IGV (18%)</Text>
                <Text style={{ fontSize: 12, color: "#FFFFFF", fontFamily: MONO }}>{formatCurrency(sale.igv)}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary }}>Total cancelado</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: C.green, fontFamily: MONO }}>
                  {formatCurrency(sale.total)}
                </Text>
              </View>
            </View>

            {/* Quick actions */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              {QUICK_ACTIONS.map((a) => (
                <Pressable
                  key={a.label}
                  onPress={() =>
                    Alert.alert(
                      a.label,
                      isOffline
                        ? "Requiere conexión a internet. La información está disponible al volver en línea."
                        : `${a.label} estará disponible próximamente.`
                    )
                  }
                  style={{ flex: 1, backgroundColor: C.input, borderRadius: 8, paddingVertical: 10, alignItems: "center", opacity: isOffline ? 0.6 : 1 }}
                >
                  <Icon name={a.icon} size={17} color={C.textSecondary} />
                  <Text style={{ fontSize: 9, fontWeight: "600", color: C.textSecondary, marginTop: 4 }}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* ─── Zona crítica ─── */}
            <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 12 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: C.red, letterSpacing: 0.8, textTransform: "uppercase" }}>
                Zona crítica
              </Text>
              <Pressable
                onPress={() =>
                  Alert.alert(
                    "Anular venta",
                    "Se generará una nota de crédito y se revertirá el stock. Esta acción es irreversible.\n\n¿Continuar?",
                    [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Anular venta",
                        style: "destructive",
                        onPress: () =>
                          Alert.alert("En preparación", "La anulación de ventas se habilitará en una próxima versión."),
                      },
                    ]
                  )
                }
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: C.red,
                  borderRadius: 10,
                  paddingVertical: 11,
                  marginTop: 8,
                }}
              >
                <Icon name="warning_amber" size={16} color={C.red} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.red, marginLeft: 7, textTransform: "uppercase" }}>
                  Anular venta / Nota de crédito
                </Text>
              </Pressable>
              <Text style={{ fontSize: 10, color: C.textSecondary, textAlign: "center", marginTop: 6 }}>
                Acción irreversible · generará crédito fiscal
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}