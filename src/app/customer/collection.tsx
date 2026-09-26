import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomer } from "@/features/customer/hooks/useCustomers";
import { useRegisterPayment } from "@/features/customer/hooks/useDebtPayments";
import { formatCurrency } from "@/shared/utils/currency";
import { Icon } from "@/shared/components/ui/Icon";

const C = {
  bg: "#0B0E14",
  card: "#161B22",
  field: "#1C212B",
  border: "#21262D",
  textPrimary: "#FFFFFF",
  textSecondary: "#8B949E",
  textMuted: "#6E7681",
  blue: "#3A86FF",
  blueBg: "rgba(58,134,255,0.15)",
  success: "#00E676",
  danger: "#FF5252",
};

const METHOD_ICONS: Record<string, string> = {
  cash: "payments",
  yape: "phone_iphone",
  plin: "phone_iphone",
  transfer: "account_balance",
  card: "credit_card",
};

const METHODS = [
  { id: "cash", label: "Efectivo" },
  { id: "yape", label: "Yape" },
  { id: "plin", label: "Plin" },
  { id: "transfer", label: "Transferencia" },
  { id: "card", label: "Tarjeta" },
] as const;

export default function CollectionScreen() {
  const { id, amount } = useLocalSearchParams<{ id: string; amount?: string }>();
  const router = useRouter();
  const customerId = Number(id);
  const { data: customer, isLoading } = useCustomer(customerId);
  const { mutateAsync: registerPayment, isPending } = useRegisterPayment();

  const defaultAmount = amount ? amount : customer?.debt.toString() ?? "";
  const [paymentAmount, setPaymentAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<string>("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  if (isLoading || !customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={C.blue} />
      </SafeAreaView>
    );
  }

  const parsedAmount = parseFloat(paymentAmount) || 0;
  const remaining = customer.debt - parsedAmount;
  const validAmount = parsedAmount > 0 && parsedAmount <= customer.debt;

  const handleRegister = async () => {
    if (parsedAmount <= 0) {
      setError("Ingrese un monto válido");
      return;
    }
    if (parsedAmount > customer.debt) {
      setError("El monto no puede exceder la deuda");
      return;
    }
    setError("");

    try {
      await registerPayment({
        customerId: customer.id,
        amount: parsedAmount,
        method,
        notes: notes || undefined,
      });
      Alert.alert(
        "Pago registrado",
        `Se registró el pago de ${formatCurrency(parsedAmount)} de ${customer.name}.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch {
      setError("Error al registrar el pago");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 4 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Volver al detalle"
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="arrow_back" size={22} color={C.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.textPrimary, textAlign: "center" }}>
          Cobranza
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 96 }}
        >
          {/* ─── Resumen cliente ─── */}
          <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: C.blueBg, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 20 }}>{customer.document_type === "RUC" ? "🏢" : "👤"}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>
                  {customer.name}
                </Text>
                <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                  {customer.document_type} {customer.document_number}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
              <Text style={{ fontSize: 11, color: C.textSecondary }}>Deuda actual</Text>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.danger, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
                {formatCurrency(customer.debt)}
              </Text>
            </View>
          </View>

          {/* ─── Monto ─── */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.textSecondary, marginTop: 16, marginBottom: 8 }}>
            MONTO DEL PAGO
          </Text>
          <View style={{ backgroundColor: C.field, borderRadius: 14, borderWidth: 1, borderColor: C.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 14 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: C.blue, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>S/</Text>
            <TextInput
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={C.textMuted}
              style={{ flex: 1, marginLeft: 8, height: 52, fontSize: 20, fontWeight: "700", color: C.textPrimary, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}
            />
          </View>

          {/* ─── Chips rápidos ─── */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
            {[0.25, 0.5, 0.75].map((pct) => (
              <Pressable
                key={pct}
                onPress={() => setPaymentAmount(String(Math.round(customer.debt * pct * 100) / 100))}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.field }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: C.blue }}>{pct * 100}%</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setPaymentAmount(String(customer.debt))}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.blue, backgroundColor: C.blueBg }}
            >
              <Text style={{ fontSize: 12, fontWeight: "600", color: C.blue }}>Total</Text>
            </Pressable>
          </View>

          <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 10 }}>
            Saldo restante después del pago:{" "}
            <Text style={{ color: validAmount ? (remaining <= 0 ? C.success : C.textSecondary) : C.textSecondary, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" }}>
              {formatCurrency(Math.max(0, remaining))}
            </Text>
          </Text>

          {/* ─── Método ─── */}
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary, marginTop: 20, marginBottom: 8 }}>
            Método de pago
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {METHODS.map((m) => {
              const active = method === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setMethod(m.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? C.blue : C.border,
                    backgroundColor: active ? C.blueBg : C.field,
                  }}
                >
                  <Icon name={METHOD_ICONS[m.id]} size={16} color={active ? C.blue : C.textSecondary} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: active ? C.textPrimary : C.textSecondary }}>{m.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* ─── Nota ─── */}
          <Text style={{ fontSize: 11, fontWeight: "600", color: C.textSecondary, marginTop: 20, marginBottom: 8 }}>
            NOTA (OPCIONAL)
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Observación"
            placeholderTextColor={C.textMuted}
            style={{ backgroundColor: C.field, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 13, color: C.textPrimary }}
          />

          {error ? (
            <Text style={{ color: C.danger, fontSize: 12, textAlign: "center", marginTop: 14 }}>{error}</Text>
          ) : null}

          <Pressable
            onPress={handleRegister}
            disabled={!validAmount || isPending}
            style={{
              height: 52,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              backgroundColor: validAmount && !isPending ? C.success : C.field,
              borderWidth: 1,
              borderColor: validAmount && !isPending ? C.success : C.border,
              marginTop: 16,
            }}
            accessibilityRole="button"
          >
            {isPending ? (
              <ActivityIndicator color={validAmount ? "#0B0E14" : C.textMuted} />
            ) : (
              <>
                <Icon name="check_circle" size={18} color={validAmount ? "#0B0E14" : C.textMuted} weight={600} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: "700", color: validAmount ? "#0B0E14" : C.textMuted }}>Registrar cobranza</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}