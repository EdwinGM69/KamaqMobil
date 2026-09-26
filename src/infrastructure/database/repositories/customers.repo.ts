import { type SQLiteDatabase } from "expo-sqlite";

export interface Customer {
  id: number;
  name: string;
  document_type: string;
  document_number: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  debt: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const customersRepo = {
  getAll: async (db: SQLiteDatabase): Promise<Customer[]> => {
    return await db.getAllAsync<Customer>(
      "SELECT * FROM customers ORDER BY name ASC"
    );
  },

  getById: async (
    db: SQLiteDatabase,
    id: number
  ): Promise<Customer | null> => {
    return await db.getFirstAsync<Customer>(
      "SELECT * FROM customers WHERE id = ?",
      [id]
    );
  },

  search: async (db: SQLiteDatabase, query: string): Promise<Customer[]> => {
    const searchTerm = `%${query}%`;
    return await db.getAllAsync<Customer>(
      "SELECT * FROM customers WHERE name LIKE ? OR document_number LIKE ? ORDER BY name ASC LIMIT 50",
      [searchTerm, searchTerm]
    );
  },

  create: async (
    db: SQLiteDatabase,
    customer: Omit<Customer, "id" | "created_at" | "updated_at" | "debt">
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO customers (name, document_type, document_number, address, phone, email, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customer.name,
        customer.document_type,
        customer.document_number,
        customer.address ?? null,
        customer.phone ?? null,
        customer.email ?? null,
        customer.notes ?? null,
      ]
    );
    return result.lastInsertRowId;
  },

  updateDebt: async (
    db: SQLiteDatabase,
    id: number,
    newDebt: number
  ): Promise<void> => {
    await db.runAsync(
      "UPDATE customers SET debt = ?, updated_at = datetime('now') WHERE id = ?",
      [newDebt, id]
    );
  },

  getWithDebt: async (db: SQLiteDatabase): Promise<Customer[]> => {
    return await db.getAllAsync<Customer>(
      "SELECT * FROM customers WHERE debt > 0 ORDER BY debt DESC"
    );
  },

  count: async (db: SQLiteDatabase): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM customers"
    );
    return result?.count ?? 0;
  },
};
