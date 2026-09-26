import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { productsRepo, type Product } from "@/infrastructure/database/repositories/products.repo";

export function useInventory(search?: string) {
  const db = useSQLiteContext();

  const query = useQuery<Product[]>({
    queryKey: ["inventory", search ?? "all"],
    queryFn: () =>
      search && search.length > 0
        ? productsRepo.search(db, search)
        : productsRepo.getAll(db),
  });

  return {
    products: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useStockStatus(stock: number, minStock: number) {
  if (stock === 0) return "out";
  if (stock <= minStock) return "low";
  return "ok";
}

export function useAdjustStockProduct() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newStock }: { id: number; newStock: number }) =>
      productsRepo.updateStock(db, id, newStock),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
