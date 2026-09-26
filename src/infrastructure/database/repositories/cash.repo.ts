import { type SQLiteDatabase } from "expo-sqlite";

export interface CashSession {
  id: number;
  user_id: number;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number;
  status: string;
  observation: string | null;
  printer_ok: number;
  scanner_ok: number;
  internet_ok: number;
  opened_at: string;
  closed_at: string | null;
}

export interface CashMovement {
  id: number;
  cash_session_id: number;
  type: string;
  amount: number;
  description: string | null;
  reference_id: number | null;
  reference_type: string | null;
  created_at: string;
}

export const cashRepo = {
  openSession: async (
    db: SQLiteDatabase,
    userId: number,
    openingAmount: number,
    observation: string,
    equipment: { printer: boolean; scanner: boolean; internet: boolean }
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO cash_sessions (user_id, opening_amount, observation, printer_ok, scanner_ok, internet_ok, status)
       VALUES (?, ?, ?, ?, ?, ?, 'open')`,
      [
        userId,
        openingAmount,
        observation,
        equipment.printer ? 1 : 0,
        equipment.scanner ? 1 : 0,
        equipment.internet ? 1 : 0,
      ]
    );

    await db.runAsync(
      `INSERT INTO cash_movements (cash_session_id, type, amount, description)
       VALUES (?, 'opening', ?, 'Apertura de caja')`,
      [result.lastInsertRowId, openingAmount]
    );

    return result.lastInsertRowId;
  },

  getOpenSession: async (
    db: SQLiteDatabase,
    userId: number
  ): Promise<CashSession | null> => {
    return await db.getFirstAsync<CashSession>(
      "SELECT * FROM cash_sessions WHERE user_id = ? AND status = 'open' ORDER BY opened_at DESC LIMIT 1",
      [userId]
    );
  },

  closeSession: async (
    db: SQLiteDatabase,
    sessionId: number,
    closingAmount: number,
    expectedAmount: number,
    difference: number
  ): Promise<void> => {
    await db.runAsync(
      `UPDATE cash_sessions
       SET closing_amount = ?, expected_amount = ?, difference = ?, status = 'closed', closed_at = datetime('now')
       WHERE id = ?`,
      [closingAmount, expectedAmount, difference, sessionId]
    );
  },

  addMovement: async (
    db: SQLiteDatabase,
    sessionId: number,
    type: string,
    amount: number,
    description: string,
    referenceId?: number,
    referenceType?: string
  ): Promise<number> => {
    const result = await db.runAsync(
      `INSERT INTO cash_movements (cash_session_id, type, amount, description, reference_id, reference_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        sessionId,
        type,
        amount,
        description,
        referenceId ?? null,
        referenceType ?? null,
      ]
    );
    return result.lastInsertRowId;
  },

  getMovements: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<CashMovement[]> => {
    return await db.getAllAsync<CashMovement>(
      "SELECT * FROM cash_movements WHERE cash_session_id = ? ORDER BY created_at ASC",
      [sessionId]
    );
  },

  getSalesTotal: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<number> => {
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(amount), 0) as total FROM cash_movements WHERE cash_session_id = ? AND type = 'sale'",
      [sessionId]
    );
    return result?.total ?? 0;
  },

  getExpensesTotal: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<number> => {
    const result = await db.getFirstAsync<{ total: number }>(
      "SELECT COALESCE(SUM(ABS(amount)), 0) as total FROM cash_movements WHERE cash_session_id = ? AND type = 'expense'",
      [sessionId]
    );
    return result?.total ?? 0;
  },

  getSessionById: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<CashSession | null> => {
    return await db.getFirstAsync<CashSession>(
      "SELECT * FROM cash_sessions WHERE id = ?",
      [sessionId]
    );
  },

  getSessionTotals: async (
    db: SQLiteDatabase,
    sessionId: number
  ): Promise<{ total: number; cash: number; card: number; yape: number; count: number }> => {
    const result = await db.getFirstAsync<{
      total: number;
      cash: number;
      card: number;
      yape: number;
      count: number;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
         COALESCE(SUM(CASE WHEN payment_method = 'card' THEN total ELSE 0 END), 0) as card,
         COALESCE(SUM(CASE WHEN payment_method = 'yape' THEN total ELSE 0 END), 0) as yape,
         COALESCE(SUM(total), 0) as total,
         COUNT(*) as count
       FROM sales
       WHERE cash_session_id = ? AND status = 'completed'`,
      [sessionId]
    );
    return (
      result ?? {
        total: 0,
        cash: 0,
        card: 0,
        yape: 0,
        count: 0,
      }
    );
  },
};
