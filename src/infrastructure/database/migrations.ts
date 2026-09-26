import { type SQLiteDatabase } from "expo-sqlite";
import { SCHEMA_VERSION, CREATE_TABLES } from "./schema";
import { seedDatabase, seedLots, seedMovements } from "./seed";

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion >= SCHEMA_VERSION) {
    return;
  }

  if (currentVersion === 0) {
    await db.execAsync(CREATE_TABLES);
    await seedDatabase(db);
    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS product_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        expiration_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_product_lots_product ON product_lots(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_lots_expiry ON product_lots(expiration_date);
    `);
    await seedLots(db);
    currentVersion = 2;
  }

  if (currentVersion === 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS product_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        referencia TEXT,
        fecha TEXT DEFAULT (datetime('now')),
        usuario TEXT,
        delta_unidades INTEGER NOT NULL DEFAULT 0,
        saldo_resultante INTEGER NOT NULL DEFAULT 0,
        motivo TEXT,
        ubicacion TEXT,
        comentario TEXT,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_product_movements_product ON product_movements(product_id);
    `);
    await seedMovements(db);
    currentVersion = 3;
  }

  if (currentVersion === 3) {
    const cols = await db.getAllAsync<{ name: string }>(
      "PRAGMA table_info(products)"
    );
    const hasDecimals = cols.some((c) => c.name === "decimals");

    if (!hasDecimals) {
      await db.execAsync(`
        ALTER TABLE products ADD COLUMN decimals INTEGER DEFAULT 0;
        ALTER TABLE products ADD COLUMN min_quantity REAL DEFAULT 1;
        ALTER TABLE products ADD COLUMN step REAL DEFAULT 1;
        ALTER TABLE products ADD COLUMN frequent_quantities TEXT;
      `);

      await db.execAsync("PRAGMA foreign_keys = OFF;");

      await db.execAsync(`
      BEGIN;

      CREATE TABLE products_new (
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

      INSERT INTO products_new (id, barcode, name, price, cost_price, stock, min_stock, image_url, category, unit, decimals, min_quantity, step, frequent_quantities, created_at, updated_at)
        SELECT id, barcode, name, price, cost_price, stock, min_stock, image_url, category,
               CASE WHEN unit = 'unit' THEN 'und' ELSE unit END,
               decimals, min_quantity, step, frequent_quantities, created_at, updated_at
        FROM products;

      DROP TABLE products;
      ALTER TABLE products_new RENAME TO products;

      CREATE TABLE sale_items_new (
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

      INSERT INTO sale_items_new (id, sale_id, product_id, product_name, product_barcode, quantity, unit, unit_price, cost_price, discount, total)
        SELECT id, sale_id, product_id, product_name, product_barcode, quantity, 'und', unit_price, cost_price, discount, total
        FROM sale_items;

      DROP TABLE sale_items;
      ALTER TABLE sale_items_new RENAME TO sale_items;

      CREATE TABLE product_movements_new (
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

      INSERT INTO product_movements_new (id, product_id, type, referencia, fecha, usuario, delta_unidades, saldo_resultante, motivo, ubicacion, comentario)
        SELECT id, product_id, type, referencia, fecha, usuario, delta_unidades, saldo_resultante, motivo, ubicacion, comentario
        FROM product_movements;

      DROP TABLE product_movements;
      ALTER TABLE product_movements_new RENAME TO product_movements;

      CREATE TABLE product_lots_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        expiration_date TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      INSERT INTO product_lots_new (id, product_id, quantity, expiration_date, created_at)
        SELECT id, product_id, quantity, expiration_date, created_at
        FROM product_lots;

      DROP TABLE product_lots;
      ALTER TABLE product_lots_new RENAME TO product_lots;

      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
      CREATE INDEX IF NOT EXISTS idx_product_movements_product ON product_movements(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_lots_product ON product_lots(product_id);
      CREATE INDEX IF NOT EXISTS idx_product_lots_expiry ON product_lots(expiration_date);

      COMMIT;
    `);

      await db.execAsync("PRAGMA foreign_keys = ON;");
    }
    currentVersion = 4;
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
