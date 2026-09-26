import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSale } from "@/features/sales/hooks/useSales";
import { Button } from "@/shared/components/ui/Button";
import { formatCurrency, formatDateTime } from "@/shared/utils/currency";

export default function ReceiptScreen() {
  const { saleId } = useLocalSearchParams<{ saleId: string }>();
  const router = useRouter();
  const { data: sale, isLoading } = useSale(Number(saleId));

  if (isLoading || !sale) {
    return (
      <SafeAreaView className="flex-1 bg-kamaq-background items-center justify-center" edges={["top"]}>
        <Text className="text-kamaq-text-muted">Procesando...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-kamaq-background" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-6">
          <Text className="text-4xl">✓</Text>
        </View>
        <Text className="text-3xl font-bold text-kamaq-success mb-2">
          Venta Exitosa
        </Text>
        <Text className="text-kamaq-text-muted mb-8">
          Ticket #{sale.ticket_number}
        </Text>

        <View className="w-full bg-white rounded-2xl border border-kamaq-border p-5 mb-8">
          <View className="items-center mb-4">
            <Text className="text-2xl font-bold text-kamaq-primary">Kamaq</Text>
            <Text className="text-xs text-kamaq-text-muted mt-1">
              {formatDateTime(sale.created_at)}
            </Text>
          </View>
          <View className="border-t border-dashed border-kamaq-border my-3" />
          {sale.items.map((item) => (
            <View key={item.id} className="flex-row justify-between py-1">
              <Text className="flex-1 text-sm text-kamaq-text-primary">
                {item.quantity} x {item.product_name}
              </Text>
              <Text className="text-sm text-kamaq-text-primary">
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
          <View className="border-t border-dashed border-kamaq-border my-3" />
          <View className="flex-row justify-between py-0.5">
            <Text className="text-sm text-kamaq-text-muted">Subtotal</Text>
            <Text className="text-sm text-kamaq-text-primary">{formatCurrency(sale.subtotal)}</Text>
          </View>
          <View className="flex-row justify-between py-0.5">
            <Text className="text-sm text-kamaq-text-muted">IGV</Text>
            <Text className="text-sm text-kamaq-text-primary">{formatCurrency(sale.igv)}</Text>
          </View>
          <View className="flex-row justify-between py-1.5">
            <Text className="text-base font-bold text-kamaq-text-primary">Total</Text>
            <Text className="text-lg font-bold text-kamaq-primary">{formatCurrency(sale.total)}</Text>
          </View>
          <View className="flex-row justify-between py-1 border-t border-kamaq-border">
            <Text className="text-sm text-kamaq-text-muted capitalize">Pago</Text>
            <Text className="text-sm text-kamaq-text-primary capitalize">{sale.payment_method}</Text>
          </View>
        </View>

        <View className="w-full gap-3 mb-6">
          <Button label="Compartir" variant="outline" size="lg" onPress={() => {}} />
          <Button label="Imprimir" variant="secondary" size="lg" onPress={() => {}} />
        </View>

        <Button
          label="Nueva Venta"
          size="xl"
          onPress={() => router.replace("/(tabs)/sales")}
        />
      </View>
    </SafeAreaView>
  );
}
