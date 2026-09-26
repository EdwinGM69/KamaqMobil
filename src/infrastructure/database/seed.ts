import { type SQLiteDatabase } from "expo-sqlite";

export async function seedDatabase(db: SQLiteDatabase) {
  const existingUsers = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM users"
  );

  if (existingUsers && existingUsers.count > 0) return;

  await db.execAsync(`
    INSERT INTO users (username, password_hash, name, role) VALUES
      ('admin', 'admin123', 'Administrador', 'admin'),
      ('edwin', '123456', 'Edwin Vendedor', 'vendor'),
      ('maria', '123456', 'Maria Vendedora', 'vendor');

    INSERT INTO products (barcode, name, price, cost_price, stock, min_stock, category, unit) VALUES
      ('7501234567890', 'Coca Cola 500ml', 3.50, 2.00, 120, 20, 'bebidas', 'und'),
      ('7501234567891', 'Coca Cola 1L', 5.50, 3.50, 80, 20, 'bebidas', 'und'),
      ('7501234567892', 'Inca Kola 500ml', 3.50, 2.00, 95, 20, 'bebidas', 'und'),
      ('7501234567893', 'Agua San Luis 625ml', 1.50, 0.80, 150, 30, 'bebidas', 'und'),
      ('7501234567894', 'Pilsen Callao 330ml', 4.00, 2.50, 60, 15, 'cervezas', 'und'),
      ('7501234567895', 'Cusqueña Negra 330ml', 4.50, 2.80, 45, 15, 'cervezas', 'und'),
      ('7501234567896', 'Galleta Oreo 117g', 4.00, 2.50, 70, 20, 'galletas', 'und'),
      ('7501234567897', 'Galleta Casino 180g', 3.50, 2.00, 55, 15, 'galletas', 'und'),
      ('7501234567898', 'Paneton Clara 900g', 18.00, 12.00, 25, 10, 'panetones', 'und'),
      ('7501234567899', 'Leche Perfecta 400g', 5.50, 3.50, 40, 10, 'lacteos', 'und'),
      ('7501234567900', 'Atun Florida 170g', 5.00, 3.00, 35, 10, 'enlatados', 'und'),
      ('7501234567901', 'Aceite Primor 1L', 8.50, 6.00, 30, 10, 'aceites', 'und'),
      ('7501234567902', 'Arroz Cenicero 1kg', 4.50, 3.00, 60, 15, 'granos', 'und'),
      ('7501234567903', 'Fideo Don Vittorio 500g', 3.00, 1.80, 50, 15, 'pastas', 'und'),
      ('7501234567904', 'Azucar Pellon 1kg', 4.00, 2.80, 45, 15, 'azucar', 'und'),
      ('7501234567905', 'Sal Bahia 1kg', 2.50, 1.50, 80, 20, 'condimentos', 'und'),
      ('7501234567906', 'Jabon Bolivar 3x100g', 6.00, 3.50, 25, 10, 'higiene', 'und'),
      ('7501234567907', 'Papel Higienico 4 rollos', 5.50, 3.00, 30, 10, 'higiene', 'und'),
      ('7501234567908', 'Shampoo Head Shoulders 375ml', 12.00, 8.00, 20, 8, 'higiene', 'und'),
      ('7501234567909', 'Cerveza Pilsen Callao Lata 355ml', 3.50, 2.00, 100, 25, 'cervezas', 'und'),
      ('7501234567910', 'Chicharron premium', 30.00, 18.00, 12.500, 2, 'condimentos', 'kg'),
      ('7501234567911', 'Queso fresco', 25.00, 15.00, 8.250, 2, 'lacteos', 'kg'),
      ('7501234567912', 'Salsa de tomate', 12.00, 7.00, 15.000, 3, 'condimentos', 'lt'),
      ('7501234567913', 'Manzana', 8.00, 5.00, 15.000, 3, 'frutas', 'kg');

    UPDATE products SET decimals = 3, min_quantity = 0.050, step = 0.050, frequent_quantities = '0.250,0.500,0.750,1.000' WHERE barcode IN ('7501234567910', '7501234567911');
    UPDATE products SET decimals = 3, min_quantity = 0.100, step = 0.100, frequent_quantities = '0.250,0.500,1.000' WHERE barcode = '7501234567912';
    UPDATE products SET decimals = 3, min_quantity = 0.050, step = 0.050, frequent_quantities = '0.250,0.500,1.000,2.000' WHERE barcode = '7501234567913';

    INSERT INTO customers (name, document_type, document_number, address, phone, debt) VALUES
      ('Juan Perez', 'DNI', '45678912', 'Av. Los Olivos 123', '999888777', 150.00),
      ('Empresa SAC', 'RUC', '20123456789', 'Jr. Comercio 456', '014567890', 500.00),
      ('Maria Garcia', 'DNI', '78912345', 'Calle Lima 789', '988777666', 0),
      ('Pedro Rodriguez', 'DNI', '32165498', 'Av. Principal 321', '977666555', 75.50),
      ('Distribuidora Norte SRL', 'RUC', '20567890123', 'Industrial San Juan 555', '015678901', 1200.00);
  `);

  await seedLots(db);
  await seedMovements(db);
  await seedSales(db);
}

export async function seedMovements(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM product_movements"
  );

  if (existing && existing.count > 0) return;

  await db.execAsync(`
    INSERT INTO product_movements (product_id, type, referencia, fecha, usuario, delta_unidades, saldo_resultante, motivo) VALUES
      (1, 'INGRESO_MERCADERIA', 'OC-2026-118', datetime('now', '-120 day'), 'Sofía M.', 60, 120, NULL),
      (1, 'VENTA_POS', 'Venta POS #1042', datetime('now', '-2 day'), 'Edwin V.', -2, 118, NULL),
      (1, 'VENTA_POS', 'Venta POS #1178', datetime('now', '-1 day'), 'Sofía M.', -1, 117, NULL),
      (1, 'AJUSTE_MERMA', 'Ajuste por merma', datetime('now', '-3 hour'), 'Sofía M.', -3, 114, 'Merma'),
      (2, 'INGRESO_MERCADERIA', 'OC-2026-121', datetime('now', '-90 day'), 'Edwin V.', 40, 80, NULL),
      (2, 'VENTA_POS', 'Venta POS #2210', datetime('now', '-5 hour'), 'Edwin V.', -3, 77, NULL),
      (2, 'AUDITORIA', 'Auditoría mensual', datetime('now', '-7 day'), 'María V.', 0, 80, NULL),
      (13, 'INGRESO_MERCADERIA', 'OC-2026-099', datetime('now', '-45 day'), 'Sofía M.', 30, 60, NULL),
      (13, 'VENTA_POS', 'Venta POS #3345', datetime('now', '-1 day'), 'María V.', -4, 56, NULL),
      (13, 'AJUSTE_MANUAL', 'Corrección de conteo', datetime('now', '-2 hour'), 'Edwin V.', -1, 55, 'Corrección de conteo'),
      (16, 'INGRESO_MERCADERIA', 'OC-2026-088', datetime('now', '-60 day'), 'María V.', 40, 80, NULL),
      (16, 'VENTA_POS', 'Venta POS #4120', datetime('now', '-6 hour'), 'Edwin V.', -2, 78, NULL);
  `);
}

export async function seedLots(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM product_lots"
  );

  if (existing && existing.count > 0) return;

  await db.execAsync(`
    INSERT INTO product_lots (product_id, quantity, expiration_date) VALUES
      (1, 40, date('now', '+7 day')),
      (1, 80, date('now', '+90 day')),
      (2, 30, date('now', '+20 day')),
      (2, 50, date('now', '+150 day')),
      (4, 20, date('now', '+12 day')),
      (4, 130, date('now', '+200 day')),
      (5, 15, date('now', '+25 day')),
      (5, 45, date('now', '+120 day')),
      (7, 25, date('now', '+45 day')),
      (9, 30, date('now', '+10 day')),
      (10, 40, date('now', '+60 day')),
      (12, 30, date('now', '+90 day')),
      (13, 15, date('now', '+30 day')),
      (16, 80, date('now', '+365 day'));
  `);
}

interface SeedProductRef {
  name: string;
  barcode: string | null;
  price: number;
  cost: number;
}

const SEED_PRODUCT_CATALOG: Record<number, SeedProductRef> = {
  1: { name: "Coca Cola 500ml", barcode: "7501234567890", price: 3.5, cost: 2.0 },
  2: { name: "Coca Cola 1L", barcode: "7501234567891", price: 5.5, cost: 3.5 },
  3: { name: "Inca Kola 500ml", barcode: "7501234567892", price: 3.5, cost: 2.0 },
  4: { name: "Agua San Luis 625ml", barcode: "7501234567893", price: 1.5, cost: 0.8 },
  5: { name: "Pilsen Callao 330ml", barcode: "7501234567894", price: 4.0, cost: 2.5 },
  6: { name: "Cusqueña Negra 330ml", barcode: "7501234567895", price: 4.5, cost: 2.8 },
  7: { name: "Galleta Oreo 117g", barcode: "7501234567896", price: 4.0, cost: 2.5 },
  8: { name: "Galleta Casino 180g", barcode: "7501234567897", price: 3.5, cost: 2.0 },
  9: { name: "Paneton Clara 900g", barcode: "7501234567898", price: 18.0, cost: 12.0 },
  10: { name: "Leche Perfecta 400g", barcode: "7501234567899", price: 5.5, cost: 3.5 },
  11: { name: "Atun Florida 170g", barcode: "7501234567900", price: 5.0, cost: 3.0 },
  12: { name: "Aceite Primor 1L", barcode: "7501234567901", price: 8.5, cost: 6.0 },
  13: { name: "Arroz Cenicero 1kg", barcode: "7501234567902", price: 4.5, cost: 3.0 },
  14: { name: "Fideo Don Vittorio 500g", barcode: "7501234567903", price: 3.0, cost: 1.8 },
  15: { name: "Azucar Pellon 1kg", barcode: "7501234567904", price: 4.0, cost: 2.8 },
  16: { name: "Sal Bahia 1kg", barcode: "7501234567905", price: 2.5, cost: 1.5 },
};

export async function seedSales(db: SQLiteDatabase) {
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM sales"
  );

  if (existing && existing.count > 0) return;

  await db.execAsync(`
    INSERT INTO cash_sessions (id, user_id, opening_amount, closing_amount, expected_amount, difference, status, observation, opened_at, closed_at) VALUES
      (1, 1, 200, 850, 850, 0, 'closed', 'Sesión demo (seed)', datetime('now', '-30 day'), datetime('now', '-29 day'));
  `);

  type SeedSale = {
    id: number;
    customer_id: number | null;
    user_id: number;
    ticket: string;
    created_at: string;
    payment: string;
    amount_paid: number;
    items: [number, number][];
  };

  const saleSeeds: SeedSale[] = [
    { id: 1, customer_id: 1, user_id: 2, ticket: "20260830-00001", created_at: "-12 day", payment: "cash", amount_paid: 25, items: [[1, 3], [3, 2], [8, 1]] },
    { id: 2, customer_id: 2, user_id: 3, ticket: "20260901-00002", created_at: "-10 day", payment: "yape", amount_paid: 53.1, items: [[12, 2], [13, 5], [2, 1]] },
    { id: 3, customer_id: 5, user_id: 2, ticket: "20260903-000003", created_at: "-8 day", payment: "transferencia", amount_paid: 102.66, items: [[1, 10], [4, 12], [16, 8], [3, 4]] },
    { id: 4, customer_id: null, user_id: 1, ticket: "20260905-000004", created_at: "-6 day", payment: "cash", amount_paid: 30.68, items: [[5, 2], [6, 4]] },
    { id: 5, customer_id: 3, user_id: 2, ticket: "20260906-000005", created_at: "-5 day", payment: "cash", amount_paid: 50, items: [[2, 2], [7, 3], [10, 2]] },
    { id: 6, customer_id: null, user_id: 3, ticket: "20260907-000006", created_at: "-4 day", payment: "yape", amount_paid: 25.96, items: [[16, 4], [15, 3]] },
    { id: 7, customer_id: 4, user_id: 1, ticket: "20260908-000007", created_at: "-3 day", payment: "cash", amount_paid: 70, items: [[1, 8], [3, 8]] },
    { id: 8, customer_id: null, user_id: 2, ticket: "20260909-000008", created_at: "-2 day", payment: "cash", amount_paid: 33.04, items: [[9, 1], [11, 2]] },
    { id: 9, customer_id: 1, user_id: 3, ticket: "20260910-000009", created_at: "-1 day", payment: "tarjeta", amount_paid: 46.61, items: [[1, 4], [2, 3], [4, 6]] },
    { id: 10, customer_id: 5, user_id: 2, ticket: "20260911-000010", created_at: "-1 hour", payment: "transferencia", amount_paid: 149.27, items: [[12, 5], [13, 10], [14, 6], [1, 6]] },
  ];

  const round2 = (n: number) => Math.round(n * 100) / 100;

  for (const sale of saleSeeds) {
    let subtotal = 0;
    for (const [pid, qty] of sale.items) {
      subtotal += qty * SEED_PRODUCT_CATALOG[pid].price;
    }
    const igv = round2(subtotal * 0.18);
    const total = round2(subtotal + igv);
    const change = round2(Math.max(0, sale.amount_paid - total));

    await db.runAsync(
      `INSERT INTO sales (id, ticket_number, customer_id, user_id, cash_session_id, subtotal, igv, total, discount, payment_method, amount_paid, change_amount, status, created_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, ?, 0, ?, ?, ?, 'completed', datetime('now', ?))`,
      [
        sale.id,
        sale.ticket,
        sale.customer_id,
        sale.user_id,
        subtotal,
        igv,
        total,
        sale.payment,
        sale.amount_paid,
        change,
        sale.created_at,
      ]
    );

    for (const [pid, qty] of sale.items) {
      const p = SEED_PRODUCT_CATALOG[pid];
      await db.runAsync(
        `INSERT INTO sale_items (sale_id, product_id, product_name, product_barcode, quantity, unit_price, cost_price, discount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
        [sale.id, pid, p.name, p.barcode, qty, p.price, p.cost, qty * p.price]
      );
    }
  }
}
