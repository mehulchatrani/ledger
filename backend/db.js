const { createClient } = require("@libsql/client");

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function initialize() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        quantity REAL,
        quantity_unit TEXT,
        total REAL,
        description TEXT,
        date TEXT
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT,
        email TEXT UNIQUE COLLATE NOCASE,
        google_sub TEXT UNIQUE,
        created_at TEXT NOT NULL
      )`,
      args: [],
    },
  ]);

  const columns = await all("PRAGMA table_info(records)");
  const existingColumns = new Set(columns.map((column) => column.name));
  const migrations = [];
  if (!existingColumns.has("quantity"))
    migrations.push("ALTER TABLE records ADD COLUMN quantity REAL");
  if (!existingColumns.has("quantity_unit"))
    migrations.push("ALTER TABLE records ADD COLUMN quantity_unit TEXT");
  if (!existingColumns.has("total"))
    migrations.push("ALTER TABLE records ADD COLUMN total REAL");
  if (!existingColumns.has("user_id"))
    migrations.push(
      "ALTER TABLE records ADD COLUMN user_id INTEGER REFERENCES users(id)",
    );
  if (migrations.length)
    await db.batch(migrations.map((sql) => ({ sql, args: [] })));
}

function all(sql, params = []) {
  return db.execute({ sql, args: params }).then((result) => result.rows);
}

function run(sql, params = []) {
  return db.execute({ sql, args: params }).then((result) => ({
    id: Number(result.lastInsertRowid || 0),
    changes: result.rowsAffected,
  }));
}

module.exports = {
  all,
  run,
  ready: initialize(),
};
