import { useCartStore } from "@/stores/useCartStore";

export function useCart() {
  const items = useCartStore((state) => state.items);
  const customerId = useCartStore((state) => state.customerId);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const incrementQuantity = useCartStore((state) => state.incrementQuantity);
  const decrementQuantity = useCartStore((state) => state.decrementQuantity);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const clearCart = useCartStore((state) => state.clearCart);
  const getSubtotal = useCartStore((state) => state.getSubtotal);
  const getIGV = useCartStore((state) => state.getIGV);
  const getTotal = useCartStore((state) => state.getTotal);
  const getItemCount = useCartStore((state) => state.getItemCount);

  const subtotal = getSubtotal();
  const igv = getIGV();
  const total = getTotal();
  const itemCount = getItemCount();

  return {
    items,
    customerId,
    subtotal,
    igv,
    total,
    itemCount,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    setCustomer,
    clearCart,
  };
}