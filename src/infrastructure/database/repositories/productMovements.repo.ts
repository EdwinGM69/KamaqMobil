import { type SQLiteDatabase } from "expo-sqlite";

export type MovementType =
  | "VENTA_POS"
  | "AJUSTE_MERMA"
  | "INGRESO_MERCADERIA"
  | "AUDITORIA"
  | "AJUSTE_MANUAL";

export interface ProductMovement {
  id: number;
  product_id: number;
  type: MovementType;
  referencia: string | null;
  fecha: string;
  usuario: string | null;
  delta_unidades: number;
  saldo_resultante: number;
  motivo: string | null;
  ubicacion: string | null;
  comentario: string | null;
}

export interface NewProductMovement {
  product_id: number;
  type: MovementType;
  referencia?: string | null;
  usuario?: string | null;
  delta_unidades: number;
  saldo_resultante: number;
  motivo?: string | null;
  ubicacion?: string | null;
  comentario?: string | null;
}

export const productMovementsRepo = {
  getByProduct: async (
    db: SQLiteDatabase,
    productId: number,
    limit = 7
  ): Promise<ProductMovement[]> => {
    return await db.getAllAsync<ProductMovement>(
      "SELECT * FROM product_movements WHERE product_id = ? ORDER BY fecha DESC, id DESC LIMIT ?",
      [productId, limit]
    );
  },

  countByProduct: async (
    db: SQLiteDatabase,
    productId: number
  ): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM product_movements WHERE product_id = ?",
      [productId]
    );
    return result?.count ?? 0;
  },

  add: async (
    db: SQLiteDatabase,
    movement: NewProductMovement
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO product_movements
        (product_id, type, referencia, usuario, delta_unidades, saldo_resultante, motivo, ubicacion, comentario)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.product_id,
        movement.type,
        movement.referencia ?? null,
        movement.usuario ?? null,
        movement.delta_unidades,
        movement.saldo_resultante,
        movement.motivo ?? null,
        movement.ubicacion ?? null,
        movement.comentario ?? null,
      ]
    );
    return result.lastInsertRowId;
  },
};