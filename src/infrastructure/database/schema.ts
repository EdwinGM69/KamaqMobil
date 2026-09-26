export const DATABASE_NAME = "kamaq.db";

export const SCHEMA_VERSION = 4;

export const CREATE_TABLES = `
  PRAGMA journal_mode = 'wal';
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'vendor',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    barcode TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    cost_price REAL NOT NULL DEFAULT 0,
    stock REAL NOT NULL DEFAULT 0,
    min_stock REAL NOT NULL DEFAULT 5,
    image_url TEXT,
    category TEXT DEFAULT 'general',
    unit TEXT DEFAULT 'und',
    decimals INTEGER DEFAULT 0,
    min_quantity REAL DEFAULT 1,
    step REAL DEFAULT 1,
    frequent_quantities TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS product_lots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    expiration_date TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS product_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    referencia TEXT,
    fecha TEXT DEFAULT (datetime('now')),
    usuario TEXT,
    delta_unidades REAL NOT NULL DEFAULT 0,
    saldo_resultante REAL NOT NULL DEFAULT 0,
    motivo TEXT,
    ubicacion TEXT,
    comentario TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'DNI',
    document_number TEXT UNIQUE NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    debt REAL DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cash_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    opening_amount REAL NOT NULL,
    closing_amount REAL,
    expected_amount REAL,
    difference REAL DEFAULT 0,
    status TEXT DEFAULT 'open',
    observation TEXT,
    printer_ok INTEGER DEFAULT 1,
    scanner_ok INTEGER DEFAULT 1,
    internet_ok INTEGER DEFAULT 1,
    opened_at TEXT DEFAULT (datetime('now')),
    closed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS cash_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cash_session_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    description TEXT,
    reference_id INTEGER,
    reference_type TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER,
    user_id INTEGER NOT NULL,
    cash_session_id INTEGER NOT NULL,
    subtotal REAL NOT NULL DEFAULT 0,
    igv REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    discount REAL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    amount_paid REAL DEFAULT 0,
    change_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'completed',
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (cash_session_id) REFERENCES cash_sessions(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    product_barcode TEXT,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'und',
    unit_price REAL NOT NULL,
    cost_price REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    sale_id INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sale_id) REFERENCES sales(id)
  );

  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
  CREATE INDEX IF NOT EXISTS idx_customers_document ON customers(document_number);
  CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at);
  CREATE INDEX IF NOT EXISTS idx_sales_session ON sales(cash_session_id);
  CREATE INDEX IF NOT EXISTS idx_cash_movements_session ON cash_movements(cash_session_id);
  CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
  CREATE INDEX IF NOT EXISTS idx_product_lots_product ON product_lots(product_id);
  CREATE INDEX IF NOT EXISTS idx_product_lots_expiry ON product_lots(expiration_date);
  CREATE INDEX IF NOT EXISTS idx_product_movements_product ON product_movements(product_id);
`;
