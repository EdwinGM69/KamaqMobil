import { type SQLiteDatabase } from "expo-sqlite";

export interface DebtPayment {
  id: number;
  customer_id: number;
  amount: number;
  payment_method: string;
  sale_id: number | null;
  notes: string | null;
  created_at: string;
}

export const debtPaymentsRepo = {
  create: async (
    db: SQLiteDatabase,
    payment: {
      customer_id: number;
      amount: number;
      payment_method: string;
      sale_id?: number;
      notes?: string;
    }
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO debt_payments (customer_id, amount, payment_method, sale_id, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        payment.customer_id,
        payment.amount,
        payment.payment_method,
        payment.sale_id ?? null,
        payment.notes ?? null,
      ]
    );

    await db.runAsync(
      "UPDATE customers SET debt = MAX(0, debt - ?), updated_at = datetime('now') WHERE id = ?",
      [payment.amount, payment.customer_id]
    );

    return result.lastInsertRowId;
  },

  getByCustomer: async (
    db: SQLiteDatabase,
    customerId: number
  ): Promise<DebtPayment[]> => {
    return await db.getAllAsync<DebtPayment>(
      "SELECT * FROM debt_payments WHERE customer_id = ? ORDER BY created_at DESC",
      [customerId]
    );
  },

  getTotalByCustomer: async (
    db: SQLiteDatabase,
    customerId: number
  ): Promise<number> => {
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM debt_payments WHERE customer_id = ?",
      [customerId]
    );
    return result?.total ?? 0;
  },
};
