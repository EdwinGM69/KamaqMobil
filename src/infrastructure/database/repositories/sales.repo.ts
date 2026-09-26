import { type SQLiteDatabase } from "expo-sqlite";

export interface Sale {
  id: number;
  ticket_number: string;
  customer_id: number | null;
  user_id: number;
  cash_session_id: number;
  subtotal: number;
  igv: number;
  total: number;
  discount: number;
  payment_method: string;
  amount_paid: number;
  change_amount: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_barcode: string | null;
  quantity: number;
  unit: string;
  unit_price: number;
  cost_price: number;
  discount: number;
  total: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer_name?: string;
  user_name?: string;
}

interface SaleItemsJoinRow extends Sale {
  item_id: number | null;
  item_product_id: number | null;
  item_product_barcode: string | null;
  item_product_name: string | null;
  item_quantity: number | null;
  item_unit: string | null;
  item_unit_price: number | null;
  item_discount: number | null;
  item_total: number | null;
}

function buildSaleItems(rows: SaleItemsJoinRow[]): SaleWithItems[] {
  const sales: SaleWithItems[] = [];
  let current: SaleWithItems | null = null;
  for (const row of rows) {
    if (!current || current.id !== row.id) {
      current = { ...row, items: [] };
      sales.push(current);
    }
    if (row.item_id != null) {
      current.items.push({
        id: row.item_id,
        sale_id: row.id,
        product_id: row.item_product_id ?? 0,
        product_name: row.item_product_name ?? "",
        product_barcode: row.item_product_barcode,
        quantity: row.item_quantity ?? 0,
        unit: row.item_unit ?? "und",
        unit_price: row.item_unit_price ?? 0,
        cost_price: 0,
        discount: row.item_discount ?? 0,
        total: row.item_total ?? 0,
      });
    }
  }
  return sales;
}

export const salesRepo = {
  generateTicketNumber: async (db: SQLiteDatabase): Promise<string> => {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sales WHERE date(created_at) = date('now')"
    );
    const count = (result?.count ?? 0) + 1;
    const date = new Date();
    const prefix = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    return `${prefix}-${String(count).padStart(5, "0")}`;
  },

  create: async (
    db: SQLiteDatabase,
    sale: {
      ticket_number: string;
      customer_id: number | null;
      user_id: number;
      cash_session_id: number;
      subtotal: number;
      igv: number;
      total: number;
      discount: number;
      payment_method: string;
      amount_paid: number;
      change_amount: number;
      notes?: string;
    },
    items: {
      product_id: number;
      product_name: string;
      product_barcode: string | null;
      quantity: number;
      unit: string;
      unit_price: number;
      cost_price: number;
      discount: number;
      total: number;
    }[]
  ): Promise<number> => {
    const saleResult = await db.runAsync(
      `INSERT INTO sales (ticket_number, customer_id, user_id, cash_session_id, subtotal, igv, total, discount, payment_method, amount_paid, change_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sale.ticket_number,
        sale.customer_id,
        sale.user_id,
        sale.cash_session_id,
        sale.subtotal,
        sale.igv,
        sale.total,
        sale.discount,
        sale.payment_method,
        sale.amount_paid,
        sale.change_amount,
        sale.notes ?? null,
      ]
    );

    const saleId = saleResult.lastInsertRowId;

    for (const item of items) {
      await db.runAsync(
        `INSERT INTO sale_items (sale_id, product_id, product_name, product_barcode, quantity, unit, unit_price, cost_price, discount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          saleId,
          item.product_id,
          item.product_name,
          item.product_barcode,
          item.quantity,
          item.unit,
          item.unit_price,
          item.cost_price,
          item.discount,
          item.total,
        ]
      );

      await db.runAsync(
        "UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?",
        [item.quantity, item.product_id]
      );
    }

    if (sale.customer_id) {
      await db.runAsync(
        "UPDATE customers SET debt = debt + ?, updated_at = datetime('now') WHERE id = ?",
        [sale.total, sale.customer_id]
      );
    }

    return saleId;
  },

  getAll: async (db: SQLiteDatabase, limit = 50): Promise<Sale[]> => {
    return await db.getAllAsync<Sale>(
      "SELECT * FROM sales ORDER BY created_at DESC LIMIT ?",
      [limit]
    );
  },

  getAllWithItems: async (db: SQLiteDatabase, limit = 100): Promise<SaleWithItems[]> => {
    const rows = await db.getAllAsync<SaleItemsJoinRow>(
      `SELECT s.*, si.id as item_id, si.product_id as item_product_id, si.product_barcode as item_product_barcode,
              si.product_name as item_product_name, si.quantity as item_quantity, si.unit as item_unit,
              si.unit_price as item_unit_price, si.discount as item_discount, si.total as item_total
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       ORDER BY s.created_at DESC, si.id ASC
       LIMIT ?`,
      [limit]
    );
    return buildSaleItems(rows);
  },

  getById: async (db: SQLiteDatabase, id: number): Promise<SaleWithItems | null> => {
    const sale = await db.getFirstAsync<Sale>(
      "SELECT * FROM sales WHERE id = ?",
      [id]
    );
    if (!sale) return null;

    const items = await db.getAllAsync<SaleItem>(
      "SELECT * FROM sale_items WHERE sale_id = ?",
      [id]
    );

    const customer = sale.customer_id
      ? await db.getFirstAsync<{ name: string }>(
          "SELECT name FROM customers WHERE id = ?",
          [sale.customer_id]
        )
      : null;

    return {
      ...sale,
      items,
      customer_name: customer?.name,
    };
  },

  getTodaySales: async (db: SQLiteDatabase): Promise<number> => {
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(total), 0) as total FROM sales WHERE date(created_at) = date('now') AND status = 'completed'"
    );
    return result?.total ?? 0;
  },

  getTodayCount: async (db: SQLiteDatabase): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM sales WHERE date(created_at) = date('now') AND status = 'completed'"
    );
    return result?.count ?? 0;
  },

  getBySession: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<Sale[]> => {
    return await db.getAllAsync<Sale>(
      "SELECT * FROM sales WHERE cash_session_id = ? ORDER BY created_at DESC",
      [sessionId]
    );
  },

  getByCustomerId: async (
    db: SQLiteDatabase,
    customerId: number,
    limit = 20
  ): Promise<SaleWithItems[]> => {
    const rows = await db.getAllAsync<SaleItemsJoinRow>(
      `SELECT s.*, si.id as item_id, si.product_id as item_product_id, si.product_barcode as item_product_barcode,
              si.product_name as item_product_name, si.quantity as item_quantity, si.unit as item_unit,
              si.unit_price as item_unit_price, si.discount as item_discount, si.total as item_total
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE s.customer_id = ?
       ORDER BY s.created_at DESC, si.id ASC
       LIMIT ?`,
      [customerId, limit]
    );
    return buildSaleItems(rows);
  },

  getTopProductIds: async (
    db: SQLiteDatabase,
    limit = 12
  ): Promise<number[]> => {
    const rows = await db.getAllAsync<{ product_id: number }>(
      `SELECT si.product_id as product_id, SUM(si.quantity) as total_qty
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.status = 'completed'
       GROUP BY si.product_id
       ORDER BY total_qty DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map((r) => r.product_id);
  },
};
