import { useQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { salesRepo, type SaleWithItems } from "@/infrastructure/database/repositories/sales.repo";

export type SaleFilter = "all" | "completed" | "cancelled" | "pending";

export interface SalesHistoryResult {
  sales: SaleWithItems[];
  all: SaleWithItems[];
}

export function useSalesHistory(search?: string, filter: SaleFilter = "all") {
  const db = useSQLiteContext();

  return useQuery<SalesHistoryResult>({
    queryKey: ["sales-history", search, filter],
    queryFn: async () => {
      const all = await salesRepo.getAllWithItems(db, 100);
      let sales = all;
      if (search?.trim()) {
        const q = search.trim().toLowerCase();
        sales = sales.filter(
          (s) =>
            s.ticket_number.toLowerCase().includes(q) ||
            s.payment_method.toLowerCase().includes(q) ||
            s.items.some((i) => i.product_name.toLowerCase().includes(q))
        );
      }
      if (filter !== "all") {
        sales = sales.filter((s) => s.status === filter);
      }
      return { sales, all };
    },
  });
}