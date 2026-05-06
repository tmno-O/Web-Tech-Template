/**
 * cart.route.js — /api/cart
 *
 * POST   /api/cart          — add an item to the cart
 * GET    /api/cart/:userId  — get all cart items for a user (with product info)
 * DELETE /api/cart/:id      — remove a single cart item
 *
 * Security: parameterized queries (?) on every statement, FK constraints enforced.
 */

const { Router } = require('express');
const { run, getOne, getAll } = require('../database');

const router = Router();

// ── POST /api/cart ────────────────────────────────────────────────────────────
// Body: { user_id, product_id, quantity }
router.post('/', async (req, res) => {
    const { user_id, product_id, quantity } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (user_id == null || user_id === '') {
        return res.status(400).json({ error: 'user_id is required.' });
    }
    if (product_id == null || product_id === '') {
        return res.status(400).json({ error: 'product_id is required.' });
    }
    if (quantity == null || quantity === '') {
        return res.status(400).json({ error: 'quantity is required.' });
    }
    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return res.status(400).json({ error: 'quantity must be a positive integer.' });
    }

    try {
        // ── 404: user existence check ─────────────────────────────────────────
        const user = await getOne('SELECT id FROM users WHERE id = ?', [user_id]);
        if (!user) {
            return res.status(404).json({ error: `User with id ${user_id} not found.` });
        }

        // ── 404 / 409: product existence + stock check ────────────────────────
        const product = await getOne(
            'SELECT id, name, stock_quantity FROM products WHERE id = ?',
            [product_id]
        );
        if (!product) {
            return res.status(404).json({ error: `Product with id ${product_id} not found.` });
        }
        if (product.stock_quantity < Number(quantity)) {
            return res.status(409).json({
                error: `Insufficient stock for "${product.name}". ` +
                       `Available: ${product.stock_quantity}, requested: ${quantity}.`,
            });
        }

        // ── Transaction: INSERT into cart ─────────────────────────────────────
        await run('BEGIN TRANSACTION');

        const result = await run(
            `INSERT INTO cart (user_id, product_id, quantity, added_at)
             VALUES (?, ?, ?, datetime('now'))`,
            [user_id, product_id, quantity]
        );

        await run('COMMIT');

        return res.status(201).json({
            cart_id:    result.lastID,
            user_id:    Number(user_id),
            product_id: Number(product_id),
            quantity:   Number(quantity),
        });

    } catch (err) {
        await run('ROLLBACK').catch(() => {});
        console.error('[Cart] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

// ── GET /api/cart/:userId ─────────────────────────────────────────────────────
// Returns all cart items for the user with product name and price via JOIN.
router.get('/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
        return res.status(400).json({ error: 'userId must be a positive integer.' });
    }

    try {
        const user = await getOne('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: `User with id ${userId} not found.` });
        }

        const items = await getAll(
            `SELECT c.id,
                    c.user_id,
                    c.product_id,
                    c.quantity,
                    c.added_at,
                    p.name  AS product_name,
                    p.price AS unit_price
             FROM   cart     c
             JOIN   products p ON p.id = c.product_id
             WHERE  c.user_id = ?
             ORDER  BY c.added_at DESC`,
            [userId]
        );

        return res.status(200).json({ user_id: Number(userId), items });

    } catch (err) {
        console.error('[Cart] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

// ── DELETE /api/cart/:id ──────────────────────────────────────────────────────
// Removes a single cart row by its primary key.
router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({ error: 'id must be a positive integer.' });
    }

    try {
        const existing = await getOne('SELECT id FROM cart WHERE id = ?', [id]);
        if (!existing) {
            return res.status(404).json({ error: `Cart item with id ${id} not found.` });
        }

        await run('DELETE FROM cart WHERE id = ?', [id]);

        return res.status(200).json({ message: `Cart item ${id} removed.` });

    } catch (err) {
        console.error('[Cart] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

module.exports = router;
