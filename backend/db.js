const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbFile = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      quantity REAL,
      quantity_unit TEXT,
      total REAL,
      description TEXT,
      date TEXT
    )`,
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT,
      email TEXT UNIQUE COLLATE NOCASE,
      google_sub TEXT UNIQUE,
      created_at TEXT NOT NULL
    )`,
  );

  db.all("PRAGMA table_info(records)", (err, columns) => {
    if (err) throw err;
    const existingColumns = new Set(columns.map((column) => column.name));
    if (!existingColumns.has("quantity"))
      db.run("ALTER TABLE records ADD COLUMN quantity REAL");
    if (!existingColumns.has("quantity_unit"))
      db.run("ALTER TABLE records ADD COLUMN quantity_unit TEXT");
    if (!existingColumns.has("total"))
      db.run("ALTER TABLE records ADD COLUMN total REAL");
    if (!existingColumns.has("user_id"))
      db.run(
        "ALTER TABLE records ADD COLUMN user_id INTEGER REFERENCES users(id)",
      );
  });
});

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  all,
  run,
};
