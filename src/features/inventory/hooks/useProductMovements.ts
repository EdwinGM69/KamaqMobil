import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSQLiteContext } from "expo-sqlite";
import {
  productMovementsRepo,
  type MovementType,
} from "@/infrastructure/database/repositories/productMovements.repo";
import { productsRepo } from "@/infrastructure/database/repositories/products.repo";

export function useProductMovements(productId?: number) {
  const db = useSQLiteContext();

  return useQuery({
    queryKey: ["product-movements", productId],
    queryFn: async () => {
      if (!productId) return { movements: [], total: 0 };
      const [movements, total] = await Promise.all([
        productMovementsRepo.getByProduct(db, productId, 7),
        productMovementsRepo.countByProduct(db, productId),
      ]);
      return { movements, total };
    },
    enabled: !!productId,
  });
}

export function useApplyProductMovement(productId?: number) {
  const db = useSQLiteContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      delta,
      type,
      referencia,
      motivo,
      ubicacion,
      comentario,
      usuario,
    }: {
      delta: number;
      type: MovementType;
      referencia?: string | null;
      motivo?: string | null;
      ubicacion?: string | null;
      comentario?: string | null;
      usuario?: string | null;
    }) => {
      if (!productId) throw new Error("Producto no identificado");

      const product = await productsRepo.getById(db, productId);
      if (!product) throw new Error("Producto no encontrado");

      const newStock = product.stock + delta;
      if (newStock < 0) {
        throw new Error("El stock resultante no puede ser negativo");
      }

      await productsRepo.updateStock(db, productId, newStock);
      await productMovementsRepo.add(db, {
        product_id: productId,
        type,
        referencia,
        usuario,
        delta_unidades: delta,
        saldo_resultante: newStock,
        motivo,
        ubicacion,
        comentario,
      });

      return newStock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["product-movements", productId] });
    },
  });
}