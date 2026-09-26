import { useQuery } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { salesRepo, type Sale, type SaleWithItems } from "@/infrastructure/database/repositories/sales.repo";

export function useSales() {
  const db = useSQLiteContext();

  const sales = useQuery<Sale[]>({
    queryKey: ["sales"],
    queryFn: () => salesRepo.getAll(db),
  });

  return {
    sales: sales.data ?? [],
    isLoading: sales.isLoading,
    refetch: sales.refetch,
  };
}

export function useSale(id?: number) {
  const db = useSQLiteContext();

  return useQuery<SaleWithItems | null>({
    queryKey: ["sale", id],
    queryFn: () => (id ? salesRepo.getById(db, id) : null),
    enabled: !!id,
  });
}

export function useCustomerSales(customerId?: number) {
  const db = useSQLiteContext();

  return useQuery<SaleWithItems[]>({
    queryKey: ["customerSales", customerId],
    queryFn: () =>
      customerId ? salesRepo.getByCustomerId(db, customerId) : Promise.resolve([]),
    enabled: !!customerId,
  });
}
