import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { Alert } from "react-native";
import { salesRepo } from "@/infrastructure/database/repositories/sales.repo";
import { cashRepo } from "@/infrastructure/database/repositories/cash.repo";
import { useCartStore } from "@/stores/useCartStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCashStore } from "@/stores/useCashStore";

export function useSaleProcessing() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const customerId = useCartStore((state) => state.customerId);
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const currentSessionId = useCashStore((state) => state.currentSessionId);

  const mutation = useMutation({
    mutationFn: async ({
      paymentMethod,
      amountPaid,
      changeAmount,
    }: {
      paymentMethod: string;
      amountPaid: number;
      changeAmount: number;
    }) => {
      const subtotal = items.reduce((sum, i) => sum + i.total, 0);
      const igv = Math.round(subtotal * 0.18 * 100) / 100;
      const total = Math.round((subtotal + igv) * 100) / 100;

      if (!currentSessionId) {
        throw new Error("Debe abrir una caja primero");
      }

      const ticketNumber = await salesRepo.generateTicketNumber(db);

      const saleId = await salesRepo.create(
        db,
        {
          ticket_number: ticketNumber,
          customer_id: customerId,
          user_id: user?.id ?? 0,
          cash_session_id: currentSessionId,
          subtotal,
          igv,
          total,
          discount: 0,
          payment_method: paymentMethod,
          amount_paid: amountPaid,
          change_amount: changeAmount,
        },
        items.map((item) => ({
          product_id: item.productId,
          product_name: item.name,
          product_barcode: item.barcode,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.price,
          cost_price: item.costPrice,
          discount: 0,
          total: item.total,
        }))
      );

      await cashRepo.addMovement(
        db,
        currentSessionId,
        "sale",
        total,
        `Venta ${ticketNumber}`,
        saleId,
        "sale"
      );

      clearCart();
      return saleId;
    },
    onError: (error: Error) => {
      Alert.alert("Error", error.message || "No se pudo procesar la venta");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["cash"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return {
    processSale: mutation.mutateAsync,
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
