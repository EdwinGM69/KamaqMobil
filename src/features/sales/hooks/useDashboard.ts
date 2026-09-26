import { useQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { salesRepo } from "@/infrastructure/database/repositories/sales.repo";
import { productsRepo } from "@/infrastructure/database/repositories/products.repo";
import { customersRepo } from "@/infrastructure/database/repositories/customers.repo";
import { cashRepo } from "@/infrastructure/database/repositories/cash.repo";
import { useAuthStore } from "@/stores/useAuthStore";
import { useCashStore } from "@/stores/useCashStore";

export function useDashboard() {
  const db = useSQLiteContext();
  const user = useAuthStore((state) => state.user);
  const currentSessionId = useCashStore((state) => state.currentSessionId);

  const todaySales = useQuery({
    queryKey: ["dashboard", "todaySales"],
    queryFn: () => salesRepo.getTodaySales(db),
  });

  const todayCount = useQuery({
    queryKey: ["dashboard", "todayCount"],
    queryFn: () => salesRepo.getTodayCount(db),
  });

  const productCount = useQuery({
    queryKey: ["dashboard", "productCount"],
    queryFn: () => productsRepo.count(db),
  });

  const lowStockCount = useQuery({
    queryKey: ["dashboard", "lowStockCount"],
    queryFn: async () => {
      const low = await productsRepo.getLowStock(db);
      return low.length;
    },
  });

  const customerCount = useQuery({
    queryKey: ["dashboard", "customerCount"],
    queryFn: () => customersRepo.count(db),
  });

  const totalDebt = useQuery({
    queryKey: ["dashboard", "totalDebt"],
    queryFn: async () => {
      const withDebt = await customersRepo.getWithDebt(db);
      return withDebt.reduce((sum, c) => sum + c.debt, 0);
    },
  });

  const sessionBalance = useQuery({
    queryKey: ["dashboard", "sessionBalance", currentSessionId],
    queryFn: async () => {
      if (!currentSessionId) return null;
      const session = await cashRepo.getSessionById(db, currentSessionId);
      const sales = await cashRepo.getSalesTotal(db, currentSessionId);
      const expenses = await cashRepo.getExpensesTotal(db, currentSessionId);
      if (!session) return null;
      return {
        opening: session.opening_amount,
        sales,
        expenses,
        balance: session.opening_amount + sales - expenses,
      };
    },
    enabled: !!currentSessionId,
  });

  return {
    user,
    todaySales: todaySales.data ?? 0,
    todayCount: todayCount.data ?? 0,
    productCount: productCount.data ?? 0,
    lowStockCount: lowStockCount.data ?? 0,
    customerCount: customerCount.data ?? 0,
    totalDebt: totalDebt.data ?? 0,
    sessionBalance,
    isLoading:
      todaySales.isLoading ||
      productCount.isLoading ||
      customerCount.isLoading,
    isCashOpen: !!currentSessionId,
  };
}
