import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCash, useCloseCash } from "@/features/cash/hooks/useCash";
import { useOffline } from "@/shared/hooks/useOffline";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";

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

function nowLabel(): string {
  return new Date().toLocaleString("es-PE", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(v: number): string {
  return `S/ ${v.toFixed(2)}`;
}

export default function CashCloseScreen() {
  const router = useRouter();
  const {
    session,
    openingAmount,
    expensesTotal,
    paymentTotals,
    currentSessionId,
  } = useCash();
  const { mutateAsync: closeCash, isPending } = useCloseCash();
  const { isOffline } = useOffline();

  const [physicalAmount, setPhysicalAmount] = useState("");
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);

  const totals = paymentTotals;

  const expectedCash = useMemo(
    () => openingAmount + totals.cash - expensesTotal,
    [openingAmount, totals.cash, expensesTotal]
  );

  const physical = parseFloat(physicalAmount) || 0;
  const difference = physical - expectedCash;
  const diffState: "ok" | "surplus" | "shortage" =
    difference === 0 ? "ok" : difference > 0 ? "surplus" : "shortage";

  const diffColor =
    diffState === "ok" ? C.success : diffState === "surplus" ? C.blue : C.danger;
  const diffBg =
    diffState === "ok" ? C.successBg : diffState === "surplus" ? C.blueBg : C.dangerBg;
  const diffText =
    diffState === "ok"
      ? "Sin diferencia"
      : diffState === "surplus"
        ? "Sobrante en caja"
        : "Faltante en caja";

  const doClose = async () => {
    if (!currentSessionId) return;
    setError("");
    try {
      await closeCash({
        sessionId: currentSessionId,
        closingAmount: physical,
        expectedAmount: expectedCash,
      });
      setClosed(true);
      Alert.alert(
        "Cierre de Caja",
        diffState === "ok"
          ? "Cierre completado sin diferencias."
          : diffState === "surplus"
            ? `Cierre completado con sobrante de ${formatCurrency(difference)}.`
            : `Cierre completado con faltante de ${formatCurrency(Math.abs(difference))}.`,
        [{ text: "OK", onPress: () => router.replace("/(tabs)/cash") }]
      );
    } catch {
      setError(
        currentSessionId === null
          ? "No hay una caja abierta para cerrar."
          : "Error al cerrar la caja."
      );
    }
  };

  const handleClose = () => {
    if (!currentSessionId) return;
    setError("");
    if (diffState !== "ok") {
      Alert.alert(
        diffState === "surplus" ? "Sobrante en caja" : "Faltante en caja",
        `El conteo físico no coincide con el esperado. Se registrará un ${
          diffState === "surplus" ? "sobrante" : "faltante"
        } de ${formatCurrency(Math.abs(difference))} y quedará descuadrado el cierre.\n\n¿Confirmar el cierre?`,
        [
          { text: "Revisar", style: "cancel" },
          { text: "Cerrar caja", style: diffState === "shortage" ? "destructive" : "default", onPress: doClose },
        ]
      );
      return;
    }
    doClose();
  };

  const onlineAction = (title: string, placeholder: string) => {
    Alert.alert(
      title,
      isOffline
        ? "Requiere conexión a internet. Podrás enviar el reporte al volver en línea."
        : placeholder
    );
  };

  if (!currentSessionId || !session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
        <StatusBar style="light" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Icon name="point_of_sale" size={44} color={C.border} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: C.textPrimary, marginTop: 14, textAlign: "center" }}>
            No hay una caja abierta
          </Text>
          <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: "center" }}>
            Necesitas tener una caja abierta para generar el cierre.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={{ marginTop: 18, backgroundColor: C.blue, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF" }}>Volver</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      {/* ─── Header ─── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10 }}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Icon name="arrow_back" size={22} color={C.textPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.textPrimary, textAlign: "center" }}>
          Cierre de Caja
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      >
        {/* ─── Encabezado (negocio / caja / fecha) ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: C.blueBg, alignItems: "center", justifyContent: "center" }}>
                <Icon name="storefront" size={18} color={C.blue} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: C.textPrimary }}>Kamaq Store</Text>
                <Text style={{ fontSize: 11, color: C.textSecondary }}>
                  Caja {String(session.id).padStart(2, "0")} · Kiosco B2
                </Text>
                <Text style={{ fontSize: 11, fontWeight: "600", color: C.textSecondary, marginTop: 2 }}>{nowLabel()}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ─── Resumen del turno ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.textPrimary, letterSpacing: 0.2 }}>
            Resumen del turno
          </Text>

          <View style={{ marginTop: 14, backgroundColor: C.field, borderRadius: 12, padding: 12 }}>
            <Text style={{ fontSize: 10, color: C.textMuted }}>
              Total de ventas · {totals.count} ops
            </Text>
            <Text style={{ fontSize: 26, fontWeight: "700", color: C.success, fontFamily: MONO, marginTop: 4 }}>
              {money(totals.total)}
            </Text>
          </View>

          <View style={{ marginTop: 12 }}>
            <PayRow icon="payments" label="Efectivo" value={totals.cash} />
            <PayRow icon="credit_card" label="Tarjeta" value={totals.card} />
            <PayRow icon="qr_code_2" label="QR / Yape" value={totals.yape} last />
          </View>

          <View style={{ borderTopWidth: 1, borderTopColor: C.border, marginTop: 12, paddingTop: 12 }}>
            <PayRow icon="account_balance_wallet" label="Fondo de apertura" value={openingAmount} />
            <PayRow icon="logout" label="Egresos del turno" value={-expensesTotal} danger last />
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginTop: 10 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSecondary }}>
                Efectivo esperado
              </Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
                {money(expectedCash)}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Conteo físico ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 12, fontWeight: "700", color: C.textPrimary, letterSpacing: 0.2 }}>
            Conteo físico
          </Text>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
            Ingresa el efectivo contado en caja.
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.field, borderRadius: 12, borderWidth: 1, borderColor: C.border, marginTop: 12, paddingLeft: 14, paddingRight: 10, height: 56 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: C.textSecondary, fontFamily: MONO }}>S/</Text>
            <TextInput
              value={physicalAmount}
              onChangeText={setPhysicalAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={C.textMuted}
              style={{ flex: 1, marginLeft: 8, fontSize: 22, fontWeight: "700", color: C.textPrimary, fontFamily: MONO, height: 56 }}
            />
            {physicalAmount.length > 0 ? (
              <Pressable onPress={() => setPhysicalAmount("")} hitSlop={8}>
                <Icon name="close" size={17} color={C.textSecondary} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setPhysicalAmount(expectedCash.toFixed(2))}
                hitSlop={8}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: C.blue }}>Sugerir</Text>
                <Text style={{ fontSize: 10, fontWeight: "600", color: C.blue, marginLeft: 4, fontFamily: MONO }}>
                  {money(expectedCash)}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ─── Diferencia ─── */}
        <View style={{ backgroundColor: diffBg, borderRadius: 14, borderWidth: 1, borderColor: diffColor, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: diffColor, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Diferencia de caja
            </Text>
            <Icon name={diffState === "ok" ? "check_circle" : diffState === "surplus" ? "trending_up" : "error"} size={20} color={diffColor} />
          </View>
          <Text style={{ fontSize: 30, fontWeight: "700", color: diffColor, fontFamily: MONO, marginTop: 8 }}>
            {difference === 0 ? money(0) : difference > 0 ? `+ ${money(difference)}` : `- ${money(Math.abs(difference))}`}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
            <Text style={{ fontSize: 11, color: C.textSecondary }}>Físico {money(physical)}</Text>
            <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: C.textSecondary, marginHorizontal: 6 }} />
            <Text style={{ fontSize: 11, color: C.textSecondary }}>Esperado {money(expectedCash)}</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: "600", color: diffColor, marginTop: 8 }}>
            {diffText}
          </Text>
        </View>

        {error ? (
          <Text style={{ fontSize: 12, color: C.danger, textAlign: "center", marginTop: 12 }}>{error}</Text>
        ) : null}

        {/* ─── Acciones ─── */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
          <ActionButton icon="print" label="Imprimir" onPress={() => onlineAction("Imprimir", "El envío a impresora estará disponible próximamente.")} />
          <ActionButton icon="mail" label="Correo" onPress={() => onlineAction("Correo", "El envío del cierre por correo estará disponible próximamente.")} />
        </View>

        <Pressable
          onPress={() => {
            setPhysicalAmount("");
            setError("");
          }}
          style={{ alignItems: "center", paddingVertical: 12, marginTop: 6 }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: C.textSecondary }}>
            Realizar un nuevo conteo
          </Text>
        </Pressable>

        <Pressable
          onPress={handleClose}
          disabled={isPending || closed}
          style={{
            backgroundColor:
              isPending || closed
                ? C.field
                : diffState === "shortage"
                  ? C.danger
                  : diffState === "surplus"
                    ? C.blue
                    : C.success,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: isPending || closed ? C.textMuted : "#FFFFFF", textTransform: "uppercase" }}>
            {isPending ? "Cerrando..." : "Confirmar cierre de caja"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function PayRow({
  icon,
  label,
  value,
  last = false,
  danger = false,
}: {
  icon: string;
  label: string;
  value: number;
  last?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 9, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <Icon name={icon} size={16} color={danger ? C.danger : C.blue} />
      <Text style={{ flex: 1, fontSize: 13, color: C.textSecondary, marginLeft: 10 }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: "700", color: danger ? C.danger : C.textPrimary, fontFamily: MONO }}>
        {value >= 0 ? money(value) : `- ${money(Math.abs(value))}`}
      </Text>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, backgroundColor: C.field, borderRadius: 12, borderWidth: 1, borderColor: C.border, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center" }}
    >
      <Icon name={icon} size={17} color={C.textSecondary} />
      <Text style={{ fontSize: 12, fontWeight: "600", color: C.textSecondary, marginLeft: 7 }}>{label}</Text>
    </Pressable>
  );
}