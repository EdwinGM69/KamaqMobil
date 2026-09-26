import { useCallback } from "react";
import { useSQLiteContext } from "expo-sqlite";
import { router } from "expo-router";
import { Alert } from "react-native";
import * as Haptics from "expo-haptics";
import { productsRepo } from "@/infrastructure/database/repositories/products.repo";
import { useCartStore } from "@/stores/useCartStore";

export function useBarcodeHandler() {
  const db = useSQLiteContext();
  const addItem = useCartStore((state) => state.addItem);

  const handleBarcode = useCallback(
    async (barcode: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );

      const product = await productsRepo.getByBarcode(db, barcode);

      if (!product) {
        router.back();
        Alert.alert(
          "Producto no encontrado",
          `No existe un producto con el código ${barcode}.`,
          [{ text: "OK" }]
        );
        return;
      }

      if (product.stock <= 0) {
        router.back();
        Alert.alert(
          "Sin stock",
          `${product.name} no tiene stock disponible.`,
          [{ text: "OK" }]
        );
        return;
      }

      addItem({
        productId: product.id,
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        price: product.price,
        costPrice: product.cost_price,
        quantity: 1,
        unit: product.unit,
        decimals: product.decimals,
        frequentQuantities: product.frequent_quantities,
        step: product.step,
        minQuantity: product.min_quantity,
      });

      router.back();

      setTimeout(() => {
        Alert.alert(
          "Producto agregado",
          `${product.name} se agregó al carrito.`,
          [{ text: "OK" }]
        );
      }, 300);
    },
    [db, addItem]
  );

  return { handleBarcode };
}
