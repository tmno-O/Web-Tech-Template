const sqlite3 = require('sqlite3').verbose();
const path    = require('path');

// Use DB_PATH from env for flexibility (e.g., storing the DB outside the project dir).
// Falls back to backend/store.db when the variable is empty or unset.
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'store.db');

// ── Connection ────────────────────────────────────────────────────────────────
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('[DB] Failed to connect to store.db:', err.message);
        process.exit(1);
    }
    console.log('[DB] Connected to store.db');
});

// SQLite disables FK enforcement by default — enable it per connection
db.run('PRAGMA foreign_keys = ON');

// ── Schema ────────────────────────────────────────────────────────────────────
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT    NOT NULL,
        email      TEXT    NOT NULL UNIQUE,
        password   TEXT    NOT NULL,
        created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        name           TEXT    NOT NULL,
        description    TEXT,
        price          REAL    NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        category       TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        total_price REAL    NOT NULL,
        status      TEXT    NOT NULL DEFAULT 'pending',
        order_date  TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id   INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity   INTEGER NOT NULL,
        unit_price REAL    NOT NULL,
        FOREIGN KEY (order_id)   REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS cart (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity   INTEGER NOT NULL DEFAULT 1,
        added_at   TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id)    REFERENCES users(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id       INTEGER NOT NULL UNIQUE,
        payment_method TEXT    NOT NULL,
        payment_status TEXT    NOT NULL DEFAULT 'pending',
        payment_date   TEXT    NOT NULL DEFAULT (datetime('now')),
        amount         REAL    NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );
`, (err) => {
    if (err) console.error('[DB] Table creation failed:', err.message);
    else     console.log('[DB] Tables ready (users, products, orders, order_items, cart, payments)');
});

// ── Promise helpers ───────────────────────────────────────────────────────────
// db.run wrapper — resolves with `this` so callers can read lastID / changes
const run = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else     resolve(this);
        })
    );

// db.get wrapper — resolves with a single row or undefined
const getOne = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else     resolve(row);
        })
    );

// db.all wrapper — resolves with an array of rows
const getAll = (sql, params = []) =>
    new Promise((resolve, reject) =>
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else     resolve(rows);
        })
    );

module.exports = { db, run, getOne, getAll };
