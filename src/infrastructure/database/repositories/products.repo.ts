import { type SQLiteDatabase } from "expo-sqlite";

export interface Product {
  id: number;
  barcode: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  image_url: string | null;
  category: string;
  unit: string;
  decimals: number;
  min_quantity: number;
  step: number;
  frequent_quantities: string | null;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
}

const SELECT_LOT = `
  SELECT p.*,
    (SELECT MIN(pl.expiration_date) FROM product_lots pl
       WHERE pl.product_id = p.id AND pl.quantity > 0) AS expiration_date
  FROM products p
`;

export const productsRepo = {
  getAll: async (db: SQLiteDatabase): Promise<Product[]> => {
    return await db.getAllAsync<Product>(
      `${SELECT_LOT} ORDER BY p.name ASC`
    );
  },

  getById: async (db: SQLiteDatabase, id: number): Promise<Product | null> => {
    return await db.getFirstAsync<Product>(
      `${SELECT_LOT} WHERE p.id = ?`,
      [id]
    );
  },

  getByBarcode: async (
    db: SQLiteDatabase,
    barcode: string
  ): Promise<Product | null> => {
    return await db.getFirstAsync<Product>(
      `${SELECT_LOT} WHERE p.barcode = ?`,
      [barcode]
    );
  },

  search: async (
    db: SQLiteDatabase,
    query: string
  ): Promise<Product[]> => {
    const searchTerm = `%${query}%`;
    return await db.getAllAsync<Product>(
      `${SELECT_LOT} WHERE p.name LIKE ? OR p.barcode LIKE ? ORDER BY p.name ASC LIMIT 50`,
      [searchTerm, searchTerm]
    );
  },

  updateStock: async (
    db: SQLiteDatabase,
    id: number,
    newStock: number
  ): Promise<void> => {
    await db.runAsync(
      "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
      [newStock, id]
    );
  },

  adjustStock: async (
    db: SQLiteDatabase,
    id: number,
    adjustment: number
  ): Promise<void> => {
    await db.runAsync(
      "UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?",
      [adjustment, id]
    );
  },

  create: async (
    db: SQLiteDatabase,
    product: Omit<Product, "id" | "expiration_date" | "created_at" | "updated_at">
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO products (barcode, name, price, cost_price, stock, min_stock, image_url, category, unit, decimals, min_quantity, step, frequent_quantities)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.barcode,
        product.name,
        product.price,
        product.cost_price,
        product.stock,
        product.min_stock,
        product.image_url ?? null,
        product.category,
        product.unit,
        product.decimals ?? 0,
        product.min_quantity ?? 1,
        product.step ?? 1,
        product.frequent_quantities ?? null,
      ]
    );
    return result.lastInsertRowId;
  },

  getLowStock: async (db: SQLiteDatabase): Promise<Product[]> => {
    return await db.getAllAsync<Product>(
      `${SELECT_LOT} WHERE p.stock <= p.min_stock ORDER BY p.stock ASC`
    );
  },

  getOutOfStock: async (db: SQLiteDatabase): Promise<Product[]> => {
    return await db.getAllAsync<Product>(
      `${SELECT_LOT} WHERE p.stock = 0 ORDER BY p.name ASC`
    );
  },

  count: async (db: SQLiteDatabase): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM products"
    );
    return result?.count ?? 0;
  },
};
