import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/infrastructure/storage/mmkv";
import { isVariableUnit } from "@/shared/utils/units";

export interface CartItem {
  productId: number;
  barcode: string;
  name: string;
  category: string | null;
  price: number;
  costPrice: number;
  quantity: number;
  unit: string;
  decimals: number;
  frequentQuantities: string | null;
  step: number;
  minQuantity: number;
  total: number;
}

export type AddCartItemInput = Omit<CartItem, "total">;

interface CartState {
  items: CartItem[];
  customerId: number | null;
  addItem: (item: AddCartItemInput) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  incrementQuantity: (productId: number) => void;
  decrementQuantity: (productId: number) => void;
  setCustomer: (customerId: number | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getIGV: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const stepFor = (item: CartItem): number => {
  return item.step > 0 ? item.step : 1;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId
          );
          if (existing) {
            const quantity = isVariableUnit(item.unit)
              ? item.quantity
              : Math.round((existing.quantity + item.quantity) * 1000) / 1000;
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity, total: quantity * i.price }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              { ...item, total: item.quantity * item.price },
            ],
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId)
              : state.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity, total: quantity * i.price }
                    : i
                ),
        })),
      incrementQuantity: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (item) {
          const step = stepFor(item);
          get().updateQuantity(
            productId,
            Math.round((item.quantity + step) * 1000) / 1000
          );
        }
      },
      decrementQuantity: (productId) => {
        const item = get().items.find((i) => i.productId === productId);
        if (!item) return;
        const step = stepFor(item);
        const next = Math.round((item.quantity - step) * 1000) / 1000;
        if (next > 0) {
          get().updateQuantity(productId, next);
        } else {
          get().removeItem(productId);
        }
      },
      setCustomer: (customerId) => set({ customerId }),
      clearCart: () => set({ items: [], customerId: null }),
      getSubtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.total, 0);
      },
      getIGV: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.total, 0);
        return Math.round(subtotal * 0.18 * 100) / 100;
      },
      getTotal: () => {
        const state = get();
        const subtotal = state.items.reduce((sum, item) => sum + item.total, 0);
        const igv = Math.round(subtotal * 0.18 * 100) / 100;
        return Math.round((subtotal + igv) * 100) / 100;
      },
      getItemCount: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "kamaq-cart",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);