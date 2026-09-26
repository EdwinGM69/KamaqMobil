import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/infrastructure/storage/mmkv";

export interface CashMovement {
  id: number;
  cash_session_id: number;
  type: "opening" | "sale" | "expense" | "adjustment";
  amount: number;
  description: string;
  created_at: string;
}

interface CashState {
  currentSessionId: number | null;
  isOpen: boolean;
  openingAmount: number;
  movements: CashMovement[];
  setSession: (sessionId: number, openingAmount: number) => void;
  addMovement: (movement: CashMovement) => void;
  closeSession: () => void;
  getTotalSales: () => number;
  getTotalExpenses: () => number;
  getCurrentBalance: () => number;
}

export const useCashStore = create<CashState>()(
  persist(
    (set, get) => ({
      currentSessionId: null,
      isOpen: false,
      openingAmount: 0,
      movements: [],
      setSession: (sessionId, openingAmount) =>
        set({
          currentSessionId: sessionId,
          isOpen: true,
          openingAmount,
          movements: [],
        }),
      addMovement: (movement) =>
        set((state) => ({
          movements: [...state.movements, movement],
        })),
      closeSession: () =>
        set({
          currentSessionId: null,
          isOpen: false,
          openingAmount: 0,
          movements: [],
        }),
      getTotalSales: () => {
        const state = get();
        return state.movements
          .filter((m) => m.type === "sale")
          .reduce((sum, m) => sum + m.amount, 0);
      },
      getTotalExpenses: () => {
        const state = get();
        return state.movements
          .filter((m) => m.type === "expense")
          .reduce((sum, m) => sum + Math.abs(m.amount), 0);
      },
      getCurrentBalance: () => {
        const state = get();
        const sales = state.movements
          .filter((m) => m.type === "sale")
          .reduce((sum, m) => sum + m.amount, 0);
        const expenses = state.movements
          .filter((m) => m.type === "expense")
          .reduce((sum, m) => sum + Math.abs(m.amount), 0);
        return state.openingAmount + sales - expenses;
      },
    }),
    {
      name: "kamaq-cash",
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
