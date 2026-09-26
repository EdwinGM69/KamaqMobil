import { useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCustomer } from "@/features/customer/hooks/useCustomers";
import { useCustomerPayments } from "@/features/customer/hooks/useDebtPayments";
import { useCustomerSales } from "@/features/sales/hooks/useSales";
import type { DebtPayment } from "@/infrastructure/database/repositories/debtPayments.repo";
import type { SaleWithItems } from "@/infrastructure/database/repositories/sales.repo";
import { formatCurrency, formatDate } from "@/shared/utils/currency";
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
  success: "#00E676",
  successBg: "rgba(0,230,118,0.12)",
  warning: "#FF8800",
  warningBg: "rgba(255,136,0,0.12)",
  danger: "#FF5252",
  dangerBg: "rgba(255,82,82,0.12)",
};

const MONO = Platform.OS === "ios" ? "Menlo" : "monospace";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const customerId = Number(id);
  const { data: customer, isLoading } = useCustomer(customerId);
  const { payments } = useCustomerPayments(customerId);
  const { data: compras } = useCustomerSales(customerId);
  const purchases = compras ?? [];

  if (isLoading || !customer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }} edges={["top"]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={C.blue} />
      </SafeAreaView>
    );
  }

  const hasDebt = customer.debt > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top"]}>
      <StatusBar style="light" />

      <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingHorizontal: 4 }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityLabel="Volver al listado"
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" }}
        >
          <Icon name="arrow_back" size={22} color={C.textPrimary} />
        </Pressable>
        <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, fontWeight: "600", color: C.textPrimary, textAlign: "center" }}>
          Detalle de cliente
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 6, paddingBottom: 96 }}>
        {/* ─── Hero ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                backgroundColor: hasDebt ? C.dangerBg : C.successBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 30 }}>{customer.document_type === "RUC" ? "🏢" : "👤"}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: "800", color: C.textPrimary }}>
                {customer.name}
              </Text>
              <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>
                {customer.document_type} <Text style={{ fontFamily: MONO }}>{customer.document_number}</Text>
              </Text>
            </View>
            <View style={{ backgroundColor: hasDebt ? C.dangerBg : C.successBg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: hasDebt ? C.danger : C.success, textTransform: "uppercase", letterSpacing: 0.4 }}>
                {hasDebt ? "Con deuda" : "Al día"}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Deuda ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>
            Deuda actual
          </Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={{ fontSize: 30, fontWeight: "800", color: hasDebt ? C.danger : C.success, fontFamily: MONO, marginTop: 6 }}
          >
            {formatCurrency(customer.debt)}
          </Text>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 6 }}>
            {hasDebt ? "Tiene saldo pendiente por cobrar" : "Cliente al día"}
          </Text>
        </View>

        {/* ─── Datos del cliente ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, marginTop: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary, paddingTop: 14 }}>
            Datos del cliente
          </Text>
          <InfoRow label="Documento" value={`${customer.document_type} ${customer.document_number}`} />
          {customer.address ? <InfoRow label="Dirección" value={customer.address} /> : null}
          {customer.phone ? <InfoRow label="Teléfono" value={customer.phone} /> : null}
          {customer.email ? <InfoRow label="Email" value={customer.email} /> : null}
          {customer.notes ? <InfoRow label="Notas" value={customer.notes} last /> : null}
        </View>

        {/* ─── Historial de compras ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary }}>Historial de compras</Text>
            <Text style={{ fontSize: 11, color: C.textMuted }}>{purchases.length}</Text>
          </View>
          <Text style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>Boletas y comprobantes vinculados</Text>

          {purchases.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Icon name="shopping_bag" size={30} color={C.border} />
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>Sin compras registradas</Text>
            </View>
          ) : (
            <View style={{ marginTop: 6 }}>
              {purchases.map((sale) => (
                <SaleRow key={sale.id} sale={sale} last={sale === purchases[purchases.length - 1]} />
              ))}
            </View>
          )}
        </View>

        {/* ─── Historial de pagos ─── */}
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary }}>Historial de pagos</Text>
            <Text style={{ fontSize: 11, color: C.textMuted }}>{payments.length}</Text>
          </View>

          {payments.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 24 }}>
              <Icon name="receipt_long" size={30} color={C.border} />
              <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 8 }}>Sin pagos registrados</Text>
            </View>
          ) : (
            <View style={{ marginTop: 6 }}>
              {payments.map((payment) => (
                <PaymentRow key={payment.id} payment={payment} last={payment === payments[payments.length - 1]} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Acción sticky ─── */}
      <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
        <Pressable
          onPress={() => hasDebt ? router.push(`/customer/collection?id=${customer.id}&amount=${customer.debt}` as never) : undefined}
          disabled={!hasDebt}
          style={{
            height: 52,
            borderRadius: 14,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            backgroundColor: hasDebt ? C.blue : C.field,
            borderWidth: 1,
            borderColor: hasDebt ? C.blue : C.border,
          }}
          accessibilityRole="button"
          accessibilityLabel={hasDebt ? "Registrar cobranza" : "Cliente al día"}
        >
          <Icon name={hasDebt ? "payments" : "check_circle"} size={18} color={hasDebt ? "#FFFFFF" : C.textMuted} weight={600} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: hasDebt ? "#FFFFFF" : C.textMuted }}>
            {hasDebt ? "Registrar cobranza" : "Cliente al día"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <Text style={{ fontSize: 11, color: C.textMuted, width: 88 }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 13, color: C.textPrimary, textAlign: "right" }} numberOfLines={3}>
        {value}
      </Text>
    </View>
  );
}

const METHOD_LABEL: Record<string, string> = {
  cash: "Efectivo",
  yape: "Yape",
  qr: "Yape / QR",
  card: "Tarjeta",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
};

function SaleRow({ sale, last = false }: { sale: SaleWithItems; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const completed = sale.status === "completed";
  const count = sale.items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <View style={{ borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${sale.ticket_number}, ver detalle${open ? " contraer" : ""}`}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
            {sale.ticket_number}
          </Text>
          <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
            {formatDate(sale.created_at)} · {METHOD_LABEL[sale.payment_method] ?? sale.payment_method} · {count} ítem(s)
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginLeft: 10 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
            {formatCurrency(sale.total)}
          </Text>
          <View style={{ backgroundColor: completed ? C.successBg : C.dangerBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: "600", color: completed ? C.success : C.danger, textTransform: "uppercase" }}>
              {completed ? "Completada" : "Anulada"}
            </Text>
          </View>
        </View>
        <Icon name={open ? "expand_less" : "expand_more"} size={18} color={C.textMuted} style={{ marginLeft: 8 }} />
      </Pressable>

      {open && (
        <View style={{ paddingBottom: 12, marginTop: 2 }}>
          <View style={{ backgroundColor: C.field, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 10 }}>
            {sale.items.length === 0 ? (
              <Text style={{ fontSize: 12, color: C.textSecondary }}>Sin ítems registrados</Text>
            ) : (
              sale.items.map((it) => (
                <View key={it.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 }}>
                  <Text numberOfLines={1} style={{ flex: 1, fontSize: 12, color: C.textSecondary }}>
                    {it.quantity} × {it.product_name}
                  </Text>
                  <Text style={{ fontSize: 12, color: C.textPrimary, fontFamily: MONO, marginLeft: 8 }}>
                    {formatCurrency(it.total)}
                  </Text>
                </View>
              ))
            )}
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, marginTop: 6, paddingTop: 8 }}>
              <Text style={{ fontSize: 11, color: C.textMuted }}>Total</Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
                {formatCurrency(sale.total)}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

function PaymentRow({ payment, last = false }: { payment: DebtPayment; last?: boolean }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: C.border }}>
      <View>
        <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary, fontFamily: MONO }}>
          {formatCurrency(payment.amount)}
        </Text>
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
          {formatDate(payment.created_at)} · {payment.payment_method}
        </Text>
      </View>
      <View style={{ backgroundColor: C.successBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Text style={{ fontSize: 10, fontWeight: "600", color: C.success, textTransform: "uppercase" }}>Pago</Text>
      </View>
    </View>
  );
}