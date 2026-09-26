import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import { productsRepo, type Product } from "@/infrastructure/database/repositories/products.repo";

export function useProducts(search?: string) {
  const db = useSQLiteContext();

  const query = useQuery<Product[]>({
    queryKey: ["products", search ?? "all"],
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

export function useProduct(id?: number) {
  const db = useSQLiteContext();

  return useQuery<Product | null>({
    queryKey: ["product", id],
    queryFn: () => (id ? productsRepo.getById(db, id) : null),
    enabled: !!id,
  });
}

export function useProductByBarcode(barcode?: string) {
  const db = useSQLiteContext();

  return useQuery<Product | null>({
    queryKey: ["product", "barcode", barcode],
    queryFn: () => (barcode ? productsRepo.getByBarcode(db, barcode) : null),
    enabled: !!barcode,
  });
}

export function useAdjustStock() {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      productId,
      adjustment,
    }: {
      productId: number;
      adjustment: number;
    }) => productsRepo.adjustStock(db, productId, adjustment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
