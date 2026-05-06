/**
 * orders.route.js — POST /api/orders
 *
 * Logic Flow: server.js → [THIS FILE] → database.js
 *
 * Security layers applied:
 *   - helmet (HTTP headers)         — mounted in server.js
 *   - express-rate-limit            — 100 req / 15 min per IP
 *   - Input validation              — all required fields checked
 *   - Parameterized queries (?)     — prevents SQL Injection
 *   - DB TRANSACTION                — atomic order + items insert
 *   - bcrypt (salt 10)              — used for password hashing in
 *                                     /register and /login routes;
 *                                     user.password is never exposed here
 */

const { Router } = require('express');
const rateLimit  = require('express-rate-limit');
const bcrypt     = require('bcrypt'); // referenced for awareness; auth hashing lives in /register
const { run, getOne } = require('../database');

const router = Router();

// ── Rate limiter ──────────────────────────────────────────────────────────────
const ordersLimiter = rateLimit({
    windowMs:        15 * 60 * 1000, // 15 minutes
    max:             100,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { error: 'Too many requests — please try again after 15 minutes.' },
});

router.use(ordersLimiter);

// ── POST /api/orders ──────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
    const { user_id, items, total_price } = req.body;

    // ── 400: Top-level field validation ──────────────────────────────────────
    if (user_id == null || user_id === '') {
        return res.status(400).json({ error: 'user_id is required.' });
    }
    if (!Number.isInteger(Number(user_id)) || Number(user_id) <= 0) {
        return res.status(400).json({ error: 'user_id must be a positive integer.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'items must be a non-empty array.' });
    }
    if (total_price == null || total_price === '') {
        return res.status(400).json({ error: 'total_price is required.' });
    }
    if (typeof total_price !== 'number' || total_price <= 0) {
        return res.status(400).json({ error: 'total_price must be a positive number.' });
    }

    // ── 400: Per-item field validation ────────────────────────────────────────
    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.product_id == null || item.product_id === '') {
            return res.status(400).json({ error: `items[${i}].product_id is required.` });
        }
        if (!Number.isInteger(Number(item.product_id)) || Number(item.product_id) <= 0) {
            return res.status(400).json({ error: `items[${i}].product_id must be a positive integer.` });
        }
        if (item.quantity == null || item.quantity === '') {
            return res.status(400).json({ error: `items[${i}].quantity is required.` });
        }
        if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
            return res.status(400).json({ error: `items[${i}].quantity must be a positive integer.` });
        }
    }

    try {
        // ── 404: User existence check ─────────────────────────────────────────
        // Parameterized query (?) prevents SQL Injection
        const user = await getOne('SELECT id FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({ error: `User with id ${user_id} not found.` });
        }

        // ── 404 / 409: Product existence + stock check ────────────────────────
        const resolvedItems = [];

        for (const item of items) {
            const product = await getOne(
                'SELECT id, name, price, stock_quantity FROM products WHERE id = ?',
                [item.product_id]
            );

            if (!product) {
                return res.status(404).json({ error: `Product with id ${item.product_id} not found.` });
            }

            if (product.stock_quantity < item.quantity) {
                return res.status(409).json({
                    error: `Insufficient stock for "${product.name}". ` +
                           `Available: ${product.stock_quantity}, requested: ${item.quantity}.`,
                });
            }

            resolvedItems.push({
                product_id: item.product_id,
                quantity:   item.quantity,
                unit_price: product.price,
            });
        }

        // ── TRANSACTION: INSERT orders → INSERT order_items → UPDATE stock ─────
        // If any step throws, ROLLBACK undoes all changes atomically
        await run('BEGIN TRANSACTION');

        const orderRow = await run(
            `INSERT INTO orders (user_id, total_price, status, order_date)
             VALUES (?, ?, 'pending', datetime('now'))`,
            [user_id, total_price]
        );

        const orderId = orderRow.lastID;

        for (const item of resolvedItems) {
            // Parameterized — prevents SQL Injection in items loop
            await run(
                'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unit_price]
            );
            await run(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await run('COMMIT');

        // ── 201: Return new order details ─────────────────────────────────────
        const order = await getOne(
            'SELECT id, status, order_date FROM orders WHERE id = ?',
            [orderId]
        );

        return res.status(201).json({
            order_id:   order.id,
            status:     order.status,
            order_date: order.order_date,
        });

    } catch (err) {
        // ROLLBACK on any DB error — orders insert is all-or-nothing
        await run('ROLLBACK').catch(() => {});
        console.error('[Orders] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

module.exports = router;
