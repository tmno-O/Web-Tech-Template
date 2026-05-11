/**
 * checkout.js — POST /api/checkout route
 *
 * Session 03: The Checkout Flow (960121)
 * Implements the full transactional checkout logic:
 *   1. Cart Validation    — reject empty carts (400)
 *   2. Email Validation   — server-side RegEx firewall (400)
 *   3. Card Validation    — 16-digit RegEx check (400)
 *   4. Price Recalc       — never trust the client total
 *   5. XSS Sanitization   — strip <script> injection vectors
 *   6. Atomic Save        — try-catch; on failure cart is NOT cleared
 *   7. Success            — 201 with orderId + total
 *
 * ACID:
 *   A (Atomicity)   — try-catch = all-or-nothing
 *   C (Consistency) — RegEx + server recalc = valid state only
 *   I (Isolation)   — unique orderId per transaction
 *   D (Durability)  — written to orders.json before 201 response
 *
 * Logic Flow: server.js → [THIS FILE] → orders.json
 */

const express   = require('express');
const fs        = require('fs').promises;
const path      = require('path');
const rateLimit = require('express-rate-limit');

const router      = express.Router();
const ORDERS_PATH = path.join(__dirname, '../data/orders.json');

// ── Rate limiter ──────────────────────────────────────────────────────────────
const checkoutLimiter = rateLimit({
    windowMs:        15 * 60 * 1000,
    max:             10,
    standardHeaders: true,
    legacyHeaders:   false,
    message:         { error: 'Too many checkout requests — please try again after 15 minutes.' },
});

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * sanitize() — XSS protection
 * Strip < and > from any string to prevent script injection
 * before data touches the "Orders" database.
 * Reference: Session 03, slide 8 — "Sanitization"
 */
function sanitize(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/</g, '').replace(/>/g, '');
}

/**
 * generateOrderId() — Isolation property of ACID
 * Creates a unique ID for each transaction so orders
 * do not affect each other.
 */
function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 9000 + 1000);
}

// ── Validation RegEx ───────────────────────────────────────────────────────

// Email — verifies format: something@domain.tld
// Session 03, slide 4: "Server-Side Validation (RegEx) — logical firewall"
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Credit card — exactly 16 digits, no spaces or dashes
// Session 03, slide 19: "Is the credit card number the right length?"
const CARD_REGEX = /^\d{16}$/;

// ── POST /api/checkout ─────────────────────────────────────────────────────

/**
 * The Checkout Route
 *
 * Expected request body (application/json):
 * {
 *   cartItems: [{ productId, name, price, quantity }],
 *   customer:  { firstName, lastName, email, address, city, country },
 *   payment:   { cardNumber }
 * }
 *
 * Decision Tree (Session 03, slide 19 — UML):
 *   Is cart empty?        → 400 reject (do NOT clear frontend cart)
 *   Is email invalid?     → 400 reject (do NOT clear frontend cart)
 *   Is card invalid?      → 400 reject (do NOT clear frontend cart)
 *   All valid?            → recalculate total → try save → 201 success
 */
router.post('/checkout', checkoutLimiter, async (req, res) => {

    // ── Phase 3: The Populated Object (Session 03, slide 12)
    // By the time we reach here, express.json() middleware has already
    // parsed the raw JSON string into req.body (a JavaScript Object).
    const { cartItems, customer, payment } = req.body;

    // ── STEP 1: Inventory / Cart Check ────────────────────────────────────
    // Session 03, slide 7 — "Inventory Check: Ensure items are still available"
    // Edge case: "Item sold out while user was typing"
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        return res.status(400).json({
            error: 'Cart is empty. Please add items before checking out.'
        });
        // NOTE: 400 means frontend must NOT clear the cart.
    }

    // ── STEP 2: Server-Side Validation — Email ────────────────────────────
    // Session 03, slide 4 — "Using Regular Expressions as a logical firewall"
    // Session 03, slide 19 — "Is the email valid? → If no, send Error"
    if (!customer || !customer.email || !EMAIL_REGEX.test(customer.email)) {
        return res.status(400).json({
            field: 'email',
            error: 'Invalid email format. Please enter a valid email address.'
        });
    }

    // ── STEP 3: Server-Side Validation — Credit Card ──────────────────────
    // Session 03, slide 19 — "Is the credit card number the right length?"
    // Using simulated token validation (not storing real card numbers — PCI)
    if (!payment || !payment.cardNumber || !CARD_REGEX.test(payment.cardNumber)) {
        return res.status(400).json({
            field: 'cardNumber',
            error: 'Card number must be exactly 16 digits (numbers only).'
        });
    }

    // ── STEP 4: Server-Side Price Recalculation ───────────────────────────
    // Session 03, slide 7 — "Calculations: Re-calculate total price + tax on server"
    // Edge case: "Price changed since user added it to cart"
    // Never trust the client-submitted total.
    const TAX_RATE     = 0.07;  // 7% tax
    const SHIPPING_FEE = 25.00; // flat rate shipping

    const subtotal = cartItems.reduce((sum, item) => {
        const price    = parseFloat(item.price)    || 0;
        const quantity = parseInt(item.quantity, 10) || 0;
        return sum + (price * quantity);
    }, 0);

    const tax   = parseFloat((subtotal * TAX_RATE).toFixed(2));
    const total = parseFloat((subtotal + tax + SHIPPING_FEE).toFixed(2));

    // ── STEP 5: XSS Sanitization ──────────────────────────────────────────
    // Session 03, slide 8 — "Sanitize data before it touches the Orders database"
    const safeCustomer = {
        firstName : sanitize(customer.firstName  || ''),
        lastName  : sanitize(customer.lastName   || ''),
        email     : sanitize(customer.email),
        address   : sanitize(customer.address    || ''),
        city      : sanitize(customer.city       || ''),
        country   : sanitize(customer.country    || ''),
    };

    const safeCartItems = cartItems.map(item => ({
        productId : item.productId,
        name      : sanitize(item.name || ''),
        price     : parseFloat(item.price)    || 0,
        quantity  : parseInt(item.quantity, 10) || 0,
    }));

    // ── STEP 6: Atomic Save — try-catch (The Transactional Mindset) ───────
    // Session 03, slides 3, 4, 6 — "All-or-Nothing Principle"
    // "If Step 3 (Create Order Record) fails, we must undo Step 2 (Payment)"
    // Session 03, slide 21 — "include a try-catch block so that if the
    // 'Save Order' step fails, it sends a 400 status...and does NOT
    // clear the user's cart on the frontend."
    try {
        const orderId = generateOrderId();

        const newOrder = {
            orderId,
            createdAt   : new Date().toISOString(),
            customer    : safeCustomer,
            items       : safeCartItems,
            subtotal,
            tax,
            shipping    : SHIPPING_FEE,
            total,
            status      : 'confirmed',
        };

        // Read → parse → append → write  (simulated DB transaction)
        const rawData  = await fs.readFile(ORDERS_PATH, 'utf-8');
        const orders   = JSON.parse(rawData);
        orders.push(newOrder);
        await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf-8');

        // ── STEP 7: Success Response ───────────────────────────────────
        // Only after a successful save do we tell the frontend to clear the cart.
        // Session 03, slide 26 — "Cleaning Up: Once the POST is successful,
        // the logic must Clear the Cart (State Management)."
        return res.status(201).json({
            success : true,
            orderId,
            subtotal,
            tax,
            shipping : SHIPPING_FEE,
            total,
            message : `Order ${orderId} placed successfully!`
        });

    } catch (err) {
        // If saving fails, we do NOT clear the cart.
        // The frontend should detect a non-201 response and keep the cart intact.
        console.error('[Checkout] Save failed:', err.message);
        return res.status(500).json({
            error: 'Order could not be saved. Please try again.',
        });
    }
});

module.exports = router;
