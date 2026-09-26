import { Text, View } from "react-native";

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <View className="px-3 py-1 rounded-full bg-red-100">
        <Text className="text-xs font-semibold text-red-700">● Agotado</Text>
      </View>
    );
  }
  if (stock <= 5) {
    return (
      <View className="px-3 py-1 rounded-full bg-amber-100">
        <Text className="text-xs font-semibold text-amber-700">⚠ Bajo stock</Text>
      </View>
    );
  }
  return (
    <View className="px-3 py-1 rounded-full bg-green-100">
      <Text className="text-xs font-semibold text-green-700">● Disponible</Text>
    </View>
  );
}
