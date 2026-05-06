/**
 * payment.route.js — /api/payment
 *
 * POST /api/payment          — create a payment record linked to an order
 * GET  /api/payment/:orderId — get payment status for an order
 *
 * Security: parameterized queries (?) on every statement, FK constraints enforced.
 */

const { Router } = require('express');
const { run, getOne } = require('../database');

const router = Router();

const ALLOWED_METHODS = ['bank_transfer', 'check', 'cash', 'paypal'];

// ── POST /api/payment ─────────────────────────────────────────────────────────
// Body: { order_id, payment_method, amount }
router.post('/', async (req, res) => {
    const { order_id, payment_method, amount } = req.body;

    // ── Input validation ──────────────────────────────────────────────────────
    if (order_id == null || order_id === '') {
        return res.status(400).json({ error: 'order_id is required.' });
    }
    if (!Number.isInteger(Number(order_id)) || Number(order_id) <= 0) {
        return res.status(400).json({ error: 'order_id must be a positive integer.' });
    }
    if (!payment_method || payment_method === '') {
        return res.status(400).json({ error: 'payment_method is required.' });
    }
    if (!ALLOWED_METHODS.includes(payment_method)) {
        return res.status(400).json({
            error: `payment_method must be one of: ${ALLOWED_METHODS.join(', ')}.`,
        });
    }
    if (amount == null || amount === '') {
        return res.status(400).json({ error: 'amount is required.' });
    }
    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'amount must be a positive number.' });
    }

    try {
        // ── 404: order existence check ────────────────────────────────────────
        const order = await getOne('SELECT id FROM orders WHERE id = ?', [order_id]);
        if (!order) {
            return res.status(404).json({ error: `Order with id ${order_id} not found.` });
        }

        // ── 409: payment already exists for this order (UNIQUE constraint) ────
        const existing = await getOne(
            'SELECT id FROM payments WHERE order_id = ?',
            [order_id]
        );
        if (existing) {
            return res.status(409).json({
                error: `A payment record already exists for order ${order_id}.`,
            });
        }

        // ── INSERT payment ────────────────────────────────────────────────────
        const result = await run(
            `INSERT INTO payments (order_id, payment_method, payment_status, payment_date, amount)
             VALUES (?, ?, 'pending', datetime('now'), ?)`,
            [order_id, payment_method, amount]
        );

        return res.status(201).json({
            payment_id:     result.lastID,
            order_id:       Number(order_id),
            payment_method,
            payment_status: 'pending',
            amount,
        });

    } catch (err) {
        console.error('[Payment] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

// ── GET /api/payment/:orderId ─────────────────────────────────────────────────
// Returns the payment record for the given order.
router.get('/:orderId', async (req, res) => {
    const { orderId } = req.params;

    if (!Number.isInteger(Number(orderId)) || Number(orderId) <= 0) {
        return res.status(400).json({ error: 'orderId must be a positive integer.' });
    }

    try {
        const payment = await getOne(
            `SELECT id AS payment_id,
                    order_id,
                    payment_method,
                    payment_status,
                    payment_date,
                    amount
             FROM   payments
             WHERE  order_id = ?`,
            [orderId]
        );

        if (!payment) {
            return res.status(404).json({
                error: `No payment record found for order ${orderId}.`,
            });
        }

        return res.status(200).json(payment);

    } catch (err) {
        console.error('[Payment] DB error:', err.message);
        return res.status(500).json({ error: 'Database error. Please try again later.' });
    }
});

module.exports = router;
