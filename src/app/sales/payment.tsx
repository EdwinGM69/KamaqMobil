import { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCart } from "@/features/sales/hooks/useCart";
import { useSaleProcessing } from "@/features/sales/hooks/useSaleProcessing";
import { useSale } from "@/features/sales/hooks/useSales";
import { useAuthStore } from "@/stores/useAuthStore";
import { useOffline } from "@/shared/hooks/useOffline";
import { formatCurrency, formatDateTime } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";

const D = {
  bg: "#0f141c",
  card: "#181f2a",
  hover: "#222b3a",
  primary: "#2563eb",
  success: "#10b981",
  successBg: "#064e3b",
  textPrimary: "#ffffff",
  textSecondary: "#94a3b8",
  textDisabled: "#64748b",
  textAccent: "#38bdf8",
  textGreen: "#34d399",
  border: "#263346",
  input: "#1e293b",
  keypadText: "#a5b4fc",
};

const MONO = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "00"],
];

type PaymentMethod = "cash" | "card" | "qr";
type ScreenStatus = "checkout" | "success";

function getDenominations(amount: number): string {
  const denominations = [100, 50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05];
  let remaining = Math.round(amount * 100);
  const parts: string[] = [];
  for (const denom of denominations) {
    const denomCent = Math.round(denom * 100);
    const count = Math.floor(remaining / denomCent);
    if (count > 0) {
      parts.push(`${count}x S/${denom >= 1 ? denom.toFixed(0) : denom.toFixed(2)}`);
      remaining -= count * denomCent;
    }
  }
  return parts.length > 0 ? parts.join(" · ") : "Vuelto exacto";
}

export default function PaymentScreen() {
  const router = useRouter();
  const { total, items } = useCart();
  const { processSale, isPending } = useSaleProcessing();
  const userName = useAuthStore((state) => state.user?.name ?? "");

  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [received, setReceived] = useState("0");
  const [showKeypad, setShowKeypad] = useState(false);
  const [status, setStatus] = useState<ScreenStatus>("checkout");
  const [saleId, setSaleId] = useState<number | null>(null);
  const [lastSale, setLastSale] = useState<{
    total: number;
    received: number;
    change: number;
  } | null>(null);

  const { data: sale } = useSale(saleId ?? undefined);

  const shortName = useMemo(() => {
    const parts = userName.split(" ");
    if (parts.length < 2) return userName;
    return `${parts[0]} ${parts[1].charAt(0)}.`;
  }, [userName]);

  const initials = useMemo(() => {
    const parts = userName.split(" ").filter(Boolean);
    const first = parts[0]?.charAt(0) ?? "";
    const last = parts.length > 1 ? parts[1].charAt(0) : "";
    return (first + last).toUpperCase();
  }, [userName]);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  }, []);

  const { isOffline } = useOffline();

  const requireOnline = (title: string, placeholder: string) => {
    Alert.alert(
      title,
      isOffline
        ? "Requiere conexión a internet. La venta ya quedó registrada y se enviará cuando vuelva la conexión."
        : placeholder
    );
  };

  const receivedAmount = parseFloat(received) || 0;
  const change = receivedAmount - total;
  const canConfirm = method !== "cash" || receivedAmount >= total;
  const breakdown = useMemo(() => getDenominations(Math.max(0, change)), [change]);

  const suggestions = useMemo(() => {
    const exact = total;
    const round = Math.ceil((exact + 0.01) / 5) * 5;
    const roundAmount = round > exact ? round : round + 5;
    return [
      { amount: exact, title: "Exacto" },
      { amount: roundAmount, title: `+${formatCurrency(roundAmount - exact)}` },
      { amount: 100, title: "Común" },
      { amount: 200, title: "Billette alto" },
    ];
  }, [total]);

  const handleKey = (key: string) => {
    if (key === ".") {
      setReceived((prev) => (prev.includes(".") ? prev : prev + "."));
      return;
    }
    if (key === "00") {
      setReceived((prev) => (prev === "0" ? "0" : prev + "00"));
      return;
    }
    setReceived((prev) => (prev === "0" ? key : prev + key));
  };

  const handleConfirm = async () => {
    const capturedTotal = total;
    const capturedReceived = receivedAmount;
    const capturedChange = method === "cash" ? Math.max(0, change) : 0;
    const saleIdRes = await processSale({
      paymentMethod: method === "qr" ? "yape" : method,
      amountPaid: method === "cash" ? capturedReceived : capturedTotal,
      changeAmount: capturedChange,
    });
    if (saleIdRes) {
      setSaleId(saleIdRes);
      setLastSale({
        total: capturedTotal,
        received: capturedReceived,
        change: capturedChange,
      });
      setStatus("success");
    }
  };

  const handleNewSale = () => {
    setStatus("checkout");
    setReceived("0");
    setShowKeypad(false);
    setSaleId(null);
    setLastSale(null);
    router.replace("/(tabs)");
  };

  /* ─────────────────────────── SUCCESS VIEW ─────────────────────────── */
  if (status === "success") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }} edges={["top"]}>
        <StatusBar style="light" />
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingVertical: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: "rgba(52,211,153,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: "#34d399",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="check" size={36} weight={700} color="#0f141c" />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(16,185,129,0.12)",
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
                marginTop: 18,
              }}
            >
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#34d399", marginRight: 6 }} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: D.textGreen, textTransform: "uppercase" }}>
                Transacción exitosa
              </Text>
            </View>

            <Text style={{ fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginTop: 10 }}>
              ¡Pago completado!
            </Text>

            {/* Resumen de cobro */}
            <View
              style={{
                width: "100%",
                backgroundColor: D.card,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: D.border,
                padding: 18,
                marginTop: 24,
              }}
            >
              <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: D.textSecondary,
                    letterSpacing: 0.4,
                    textAlign: "center",
                  }}
                >
                  Total cobrado
                </Text>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: "700",
                  color: D.textGreen,
                  fontFamily: MONO,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {formatCurrency(lastSale?.total ?? total)}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 14,
                  marginTop: 12,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: D.border,
                }}
              >
                <Text style={{ fontSize: 12, color: D.textSecondary }}>
                  Recibido:{" "}
                  <Text style={{ color: "#FFFFFF", fontFamily: MONO, fontWeight: "600" }}>
                    {formatCurrency(lastSale?.received ?? 0)}
                  </Text>
                </Text>
                <Text style={{ fontSize: 12, color: D.textSecondary }}>
                  Vuelto:{" "}
                  <Text style={{ color: "#FFFFFF", fontFamily: MONO, fontWeight: "600" }}>
                    {formatCurrency(lastSale?.change ?? 0)}
                  </Text>
                </Text>
              </View>
            </View>

            {/* Metadata */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: D.card,
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginTop: 14,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: D.textSecondary }}>
                {sale?.ticket_number ?? `#${saleId ?? "----"}`} · Caja 02 ·{" "}
                {sale ? formatDateTime(sale.created_at) : currentTime} · {shortName}
              </Text>
            </View>

            {/* Acciones */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
              <Pressable
                onPress={() => requireOnline("Imprimir", "Enviar a impresora térmica")}
                style={{ flex: 1, backgroundColor: D.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6 }}
              >
                <Icon name="print" size={22} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>Imprimir</Text>
              </Pressable>
              <Pressable
                onPress={() => requireOnline("WhatsApp", "Enviar comprobante por WhatsApp")}
                style={{ flex: 1, backgroundColor: D.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6 }}
              >
                <Icon name="chat" size={22} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>WhatsApp</Text>
              </Pressable>
              <Pressable
                onPress={() => requireOnline("Correo", "Enviar comprobante por correo")}
                style={{ flex: 1, backgroundColor: D.card, borderRadius: 14, paddingVertical: 14, alignItems: "center", gap: 6 }}
              >
                <Icon name="mail" size={22} color="#FFFFFF" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#FFFFFF" }}>Correo</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Acción principal final */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 10 }}>
          <Pressable
            onPress={handleNewSale}
            style={{
              backgroundColor: D.primary,
              borderRadius: 16,
              height: 58,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <Icon name="add" size={22} weight={700} color="#FFFFFF" />
            <View style={{ alignItems: "flex-start" }}>
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", textTransform: "uppercase" }}>
                Nueva venta
              </Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>
                Listo para el siguiente cliente
              </Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /* ─────────────────────────── CHECKOUT VIEW ─────────────────────────── */
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: D.bg }} edges={["top"]}>
      <StatusBar style="light" />

      {/* ─── Header ─── */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: 10,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: D.card, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="arrow_back" size={20} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>Cobro y Checkout</Text>
        </View>
        <Icon name="battery_full" size={18} color={D.textSecondary} />
        <View
          style={{
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: D.primary,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: 10,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "800", color: "#FFFFFF" }}>{initials || "SM"}</Text>
        </View>
      </View>

      {isOffline && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(251,191,36,0.12)",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginHorizontal: 16,
            marginBottom: 2,
          }}
        >
          <Icon name="cloud_off" size={15} color="#FBBF24" />
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#FBBF24", marginLeft: 8, flex: 1 }}>
            Sin conexión · la venta se guarda en este equipo y se enviará al sincronizar
          </Text>
        </View>
      )}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {/* ─── Order summary ─── */}
        <View style={{ backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border, padding: 16 }}>
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 11, color: D.textSecondary }}>TOTAL A PAGAR</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
              <Text style={{ fontSize: 21, fontWeight: "700", color: "#FFFFFF", fontFamily: MONO }}>S/ </Text>
              <Text style={{ fontSize: 42, fontWeight: "700", color: "#FFFFFF", fontFamily: MONO }}>
                {total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Payment method grid ─── */}
        <Text style={{ fontSize: 11, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.6, marginTop: 18, marginBottom: 10 }}>
          Medio de pago
        </Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Pressable
            onPress={() => setMethod("cash")}
            style={{
              flex: 1,
              backgroundColor: method === "cash" ? "rgba(37,99,235,0.15)" : D.card,
              borderWidth: 2,
              borderColor: method === "cash" ? D.primary : D.border,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="payments" size={24} color={method === "cash" ? "#FFFFFF" : D.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: method === "cash" ? "#FFFFFF" : D.textSecondary }}>
              Efectivo
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMethod("card")}
            style={{
              flex: 1,
              backgroundColor: method === "card" ? "rgba(37,99,235,0.15)" : D.card,
              borderWidth: 2,
              borderColor: method === "card" ? D.primary : D.border,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="credit_card" size={24} color={method === "card" ? "#FFFFFF" : D.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: method === "card" ? "#FFFFFF" : D.textSecondary }}>
              Tarjeta
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMethod("qr")}
            style={{
              flex: 1,
              backgroundColor: method === "qr" ? "rgba(37,99,235,0.15)" : D.card,
              borderWidth: 2,
              borderColor: method === "qr" ? D.primary : D.border,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="qr_code_2" size={24} color={method === "qr" ? "#FFFFFF" : D.textSecondary} />
            <Text style={{ fontSize: 12, fontWeight: "600", color: method === "qr" ? "#FFFFFF" : D.textSecondary }}>
              Yape / Plin
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => Alert.alert("Pago mixto", "Próximamente: Efectivo + QR/Tarjeta.")}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingVertical: 8 }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: D.textAccent }}>
            Pago Mixto o Dividido (Efectivo + QR/Tarjeta)
          </Text>
          <Icon name="chevron_right" size={16} color={D.textAccent} />
        </Pressable>

        {/* ─── Cash flow ─── */}
        {method === "cash" ? (
          <>
            {/* Monto recibido */}
            <View style={{ backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border, padding: 16, marginTop: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Icon name="payments" size={13} color={D.textSecondary} />
                  <Text style={{ fontSize: 9, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.3, marginLeft: 5 }}>
                    Monto recibido
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowKeypad((v) => !v)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: showKeypad ? D.keypadText : D.input,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 5,
                  }}
                >
                  <Icon name="dialpad" size={12} color={showKeypad ? "#0f172a" : D.keypadText} />
                  <Text style={{ fontSize: 8, fontWeight: "700", color: showKeypad ? "#0f172a" : D.keypadText, letterSpacing: 0.4, marginLeft: 4 }}>
                    Teclado manual
                  </Text>
                </Pressable>
              </View>

              <View style={{ backgroundColor: D.input, borderRadius: 12, marginTop: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: D.textSecondary, letterSpacing: 0.4 }}>
                  Cliente entrega
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                  <View style={{ flex: 1, flexDirection: "row", alignItems: "baseline" }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: "#FFFFFF", fontFamily: MONO }}>S/ </Text>
                    <Text style={{ fontSize: 26, fontWeight: "700", color: "#FFFFFF", fontFamily: MONO }}>
                      {receivedAmount.toFixed(2)}
                    </Text>
                  </View>
                  <Pressable onPress={() => setReceived("0")} style={{ padding: 4 }}>
                    <Icon name="backspace" size={22} color={D.textSecondary} />
                  </Pressable>
                </View>
              </View>

              {/* Quick suggestions */}
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                {suggestions.map((s) => {
                  const active = Math.abs(receivedAmount - s.amount) < 0.005;
                  return (
                    <Pressable
                      key={s.title}
                      onPress={() => setReceived(String(s.amount))}
                      style={{
                        flex: 1,
                        backgroundColor: active ? D.primary : D.input,
                        borderRadius: 10,
                        paddingVertical: 10,
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ fontSize: 9, fontWeight: "700", color: active ? "rgba(255,255,255,0.9)" : D.keypadText }}>
                        S/
                      </Text>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "#FFFFFF",
                          fontFamily: MONO,
                          marginTop: 2,
                        }}
                      >
                        {s.amount.toFixed(2)}
                      </Text>
                      <Text style={{ fontSize: 9, fontWeight: "600", color: active ? "rgba(255,255,255,0.9)" : D.keypadText, marginTop: 2 }}>
                        {s.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Manual keypad */}
              {showKeypad && (
                <View style={{ marginTop: 16 }}>
                  {KEYPAD_ROWS.map((row, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 10, marginTop: i === 0 ? 0 : 10 }}>
                      {row.map((key) => (
                        <Pressable
                          key={key}
                          onPress={() => handleKey(key)}
                          style={{
                            flex: 1,
                            backgroundColor: D.input,
                            borderRadius: 12,
                            paddingVertical: 14,
                            alignItems: "center",
                          }}
                        >
                          <Text style={{ fontSize: 20, fontWeight: "600", color: "#FFFFFF", fontFamily: MONO }}>
                            {key}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Vuelto */}
            <View
              style={{
                backgroundColor: D.successBg,
                borderRadius: 16,
                padding: 16,
                marginTop: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#6ee7b7", letterSpacing: 0.3 }}>
                  Vuelto a entregar
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(16,185,129,0.25)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#34d399", marginRight: 5 }} />
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#6ee7b7" }}>Gaveta lista</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 10 }}>
                <Text style={{ fontSize: 17, fontWeight: "700", color: D.textGreen, fontFamily: MONO }}>S/ </Text>
                <Text style={{ fontSize: 34, fontWeight: "700", color: D.textGreen, fontFamily: MONO }}>
                  {(change >= 0 ? change : 0).toFixed(2)}
                </Text>
              </View>

              {change >= 0 && change > 0 ? (
                <Text style={{ fontSize: 12, color: "#6ee7b7", fontFamily: MONO, marginTop: 8 }}>
                  {breakdown}
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: "#fca5a5", marginTop: 8 }}>
                  {change < 0 ? `Faltan ${formatCurrency(Math.abs(change))}` : "Pago exacto"}
                </Text>
              )}
            </View>
          </>
        ) : (
          <View style={{ backgroundColor: D.card, borderRadius: 16, borderWidth: 1, borderColor: D.border, padding: 20, marginTop: 14, alignItems: "center" }}>
            <Icon name={method === "card" ? "contactless" : "qr_code_2"} size={40} color={D.textSecondary} />
            <Text style={{ fontSize: 13, color: D.textSecondary, textAlign: "center", marginTop: 10 }}>
              {method === "card" ? "Acercar tarjeta al POS (Izipay)" : "Mostrar QR para que el cliente escanee y pague"}
            </Text>
          </View>
        )}

        </ScrollView>

      {/* ─── Confirm CTA ─── */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: D.bg,
          borderTopWidth: 1,
          borderTopColor: D.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        {!canConfirm && items.length > 0 && (
          <Text style={{ fontSize: 12, color: D.textSecondary, textAlign: "center", marginBottom: 8 }}>
            Monto insuficiente · faltan{" "}
            <Text style={{ color: "#fca5a5", fontFamily: MONO, fontWeight: "700" }}>
              {formatCurrency(Math.abs(change))}
            </Text>{" "}
            para completar la venta
          </Text>
        )}
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm || isPending || items.length === 0}
          style={{
            backgroundColor: !canConfirm || isPending || items.length === 0 ? D.input : D.success,
            borderRadius: 14,
            height: 62,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="check" size={22} weight={700} color={!canConfirm || items.length === 0 ? D.textSecondary : "#FFFFFF"} />
              <Text style={{ fontSize: 16, fontWeight: "700", color: !canConfirm || items.length === 0 ? D.textSecondary : "#FFFFFF", textTransform: "uppercase", marginLeft: 10 }}>
                Confirmar pago
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}