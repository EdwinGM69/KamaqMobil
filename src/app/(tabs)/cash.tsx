import { View, Text, Pressable, ScrollView, RefreshControl, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useCash } from "@/features/cash/hooks/useCash";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatCurrency, formatDateTime } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";
import { PosHeader } from "@/shared/components/ui/PosHeader";

const C = {
  bg: "#101014",
  card: "#1A1A1E",
  field: "#232329",
  border: "#2A2A2E",
  textPrimary: "#FFFFFF",
  textSecondary: "#A0A0A0",
  textMuted: "#6B6B72",
  blue: "#2F69EB",
  blueBg: "rgba(47,105,235,0.15)",
  success: "#00C851",
  successBg: "rgba(0,200,81,0.12)",
  warning: "#FF8800",
  warningBg: "rgba(255,136,0,0.12)",
  danger: "#FF3547",
  dangerBg: "rgba(255,53,71,0.12)",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

const MOVEMENT_META: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  opening: { label: "Apertura", icon: "account_balance_wallet", color: C.blue, bg: C.blueBg },
  sale: { label: "Venta", icon: "payments", color: C.success, bg: C.successBg },
  expense: { label: "Egreso", icon: "logout", color: C.danger, bg: C.dangerBg },
  adjustment: { label: "Ajuste", icon: "tune", color: C.warning, bg: C.warningBg },
};

export default function CashScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userName = useAuthStore((state) => state.user?.name ?? "");
  const {
    isOpen,
    session,
    movements,
    openingAmount,
    salesTotal,
    expensesTotal,
    paymentTotals,
    isLoading,
  } = useCash();

  const balance = openingAmount + salesTotal - expensesTotal;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => queryClient.invalidateQueries({ queryKey: ["cash"] })}
            tintColor={C.textSecondary}
          />
        }
      >
        <PosHeader avatarName={userName}>
          {isOpen ? (
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Caja</Text>
              <Text style={{ fontSize: 10, color: C.textSecondary }}> - Turno activo</Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "baseline" }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#FFFFFF" }}>Caja</Text>
              <Text style={{ fontSize: 10, color: C.textSecondary }}> - Sin turno</Text>
            </View>
          )}
        </PosHeader>

        {!isOpen ? (
          <View style={{ alignItems: "center", paddingTop: 72, paddingHorizontal: 24 }}>
            <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: C.field, alignItems: "center", justifyContent: "center" }}>
              <Icon name="point_of_sale" size={36} color={C.blue} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.textPrimary, marginTop: 18, textAlign: "center" }}>
              No hay caja abierta
            </Text>
            <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 18 }}>
              Para comenzar a operar, abre una caja con el fondo inicial.
            </Text>
            <Pressable
              onPress={() => router.push("/cash/open")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.blue,
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 13,
                marginTop: 22,
              }}
            >
              <Icon name="add" size={18} color="#FFFFFF" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF", marginLeft: 6 }}>
                Abrir Caja
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ─── Title + Cerrar ─── */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
              <View>
                <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  Abierta {session ? formatDateTime(session.opened_at) : ""}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push("/cash/close")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: C.dangerBg,
                  borderRadius: 10,
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                }}
              >
                <Icon name="logout" size={15} color={C.danger} />
                <Text style={{ fontSize: 12, fontWeight: "700", color: C.danger, marginLeft: 6 }}>
                  Cerrar Caja
                </Text>
              </Pressable>
            </View>

            {/* ─── Balance ─── */}
            <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 18, marginTop: 14 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: C.textSecondary, letterSpacing: 0.4 }}>
                Saldo actual
              </Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.success, fontFamily: MONO }}>S/ </Text>
                <Text style={{ fontSize: 30, fontWeight: "700", color: C.success, fontFamily: MONO }}>
                  {balance.toFixed(2)}
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
                <MiniStat label="Apertura" value={openingAmount} color={C.blue} />
                <MiniStat label="Ventas" value={salesTotal} color={C.success} />
                <MiniStat label="Egresos" value={expensesTotal} color={C.danger} />
              </View>
            </View>

            {/* ─── Medios de pago ─── */}
            <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
              <PayMethodCard icon="payments" label="Efectivo" value={paymentTotals.cash} color={C.success} bg={C.successBg} />
              <PayMethodCard icon="credit_card" label="Tarjeta" value={paymentTotals.card} color={C.blue} bg={C.blueBg} />
              <PayMethodCard icon="qr_code_2" label="QR / Yape" value={paymentTotals.yape} color={C.warning} bg={C.warningBg} />
            </View>

            {/* ─── Movimientos ─── */}
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>Movimientos</Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginLeft: 8 }}>{movements.length}</Text>
            </View>

            <View style={{ marginTop: 10 }}>
              {movements.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Icon name="receipt_long" size={40} color={C.border} />
                  <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 10 }}>
                    Sin movimientos todavía
                  </Text>
                </View>
              ) : (
                movements.map((m) => {
                  const meta = MOVEMENT_META[m.type] ?? {
                    label: m.type,
                    icon: "receipt_long",
                    color: C.textSecondary,
                    bg: C.field,
                  };
                  const positive = m.amount >= 0;
                  return (
                    <View key={m.id} style={{ backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: meta.bg, alignItems: "center", justifyContent: "center" }}>
                        <Icon name={meta.icon} size={18} color={meta.color} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary, textTransform: "capitalize" }}>
                          {meta.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>
                          {formatDateTime(m.created_at)}
                        </Text>
                        {m.description ? (
                          <Text style={{ fontSize: 10, color: C.textSecondary, marginTop: 1 }}>
                            {m.description}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: positive ? meta.color : C.danger, fontFamily: MONO }}>
                        {positive ? "+" : "−"}
                        {formatCurrency(Math.abs(m.amount))}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.field, borderRadius: 10, padding: 10 }}>
      <Text style={{ fontSize: 9, fontWeight: "700", color: C.textSecondary, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: "700", color, fontFamily: MONO, marginTop: 4 }}>{value.toFixed(2)}</Text>
    </View>
  );
}

function PayMethodCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderRadius: 12, borderWidth: 1, borderColor: C.border, padding: 12, alignItems: "center" }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", backgroundColor: bg, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5 }}>
        <Icon style={{ marginTop: 1 }} name={icon} size={13} color={color} />
        <Text style={{ fontSize: 9, fontWeight: "600", color, marginLeft: 5, lineHeight: 13 }}>{label}</Text>
      </View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 15, fontWeight: "700", color, fontFamily: MONO, marginTop: 10 }}>
        {value.toFixed(2)}
      </Text>
    </View>
  );
}