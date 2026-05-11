/**
 * server.js — Entry point for the Stroyka Tools Store REST API backend.
 *
 * Logic Flow Position: Step 2 (REQUEST) + Step 4 (RESPONSE)
 *   - Step 2: Receives the incoming HTTP requests from the browser / client
 *   - Step 4: Sends the final HTTP response back to the browser / client
 *
 * Sequence: Browser → [THIS FILE] → Router → Middleware → Controller → Service
 *           Service → Controller → Router → [THIS FILE] → Browser
 */

// Load .env variables before any other require so every module sees them.
require('dotenv').config();

// ── Environment variable validation ──────────────────────────────────────────
// Collect ALL problems before exiting so the developer sees everything at once
// rather than fixing one variable, restarting, and discovering the next one.
const _envErrors = [];

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length <= 16) {
    _envErrors.push('JWT_SECRET — must be set and longer than 16 characters');
}

if (
    process.env.PORT !== undefined &&
    (isNaN(Number(process.env.PORT)) || Number(process.env.PORT) <= 0)
) {
    _envErrors.push('PORT — must be a valid positive number (or leave unset to default to 3001)');
}

if (!['development', 'production'].includes(process.env.NODE_ENV)) {
    _envErrors.push(
        `NODE_ENV — must be "development" or "production" (got: "${process.env.NODE_ENV}")`
    );
}

if (_envErrors.length > 0) {
    console.error('❌ Missing or invalid environment variables:\n');
    _envErrors.forEach(msg => console.error(`   • ${msg}`));
    console.error('\n   Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
}

console.log('✅ Environment variables validated.');

const express = require('express');  // Import the Express framework
const cors    = require('cors');     // Import CORS middleware to allow cross-origin requests
const helmet  = require('helmet');   // Secure HTTP response headers

const productsRouter  = require('./routes/products');      // Import the products router
const registerRouter  = require('./routes/register');      // Import the registration router
const loginRouter     = require('./routes/login');         // Import the login router
const checkoutRouter  = require('./routes/checkout');      // Session 03: Checkout Flow router
const ordersRouter    = require('./routes/orders.route');  // Session 05: Orders + SQLite
const cartRouter      = require('./routes/cart.route');    // Session 05: Cart + SQLite
const paymentRouter   = require('./routes/payment.route'); // Session 05: Payments + SQLite

// Initialise DB connection and create tables on startup
require('./database');

const app  = express();              // Create the Express application instance
const PORT = process.env.PORT || 3001; // Use environment PORT or default to 3001

// ── Middleware ────────────────────────────────────────────────────────────────
// Set secure HTTP headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());
// Allow cross-origin requests so the Stroyka frontend can call this API
app.use(cors());
// Parse incoming JSON request bodies so req.body is populated
app.use(express.json({ limit: '10kb' }));
// Serve static files (test.html) from the backend folder
app.use(express.static(__dirname));

// ── API Routes ────────────────────────────────────────────────────────────────
// Mount the products router — handles GET /api/products
app.use('/api/products', productsRouter);
// Mount the register router — handles POST /api/register
app.use('/api/register', registerRouter);
// Mount the login router — handles POST /api/login
app.use('/api', loginRouter);
// Mount the checkout router — handles POST /api/checkout (Session 03)
app.use('/api', checkoutRouter);
// Mount the orders router  — handles POST /api/orders  (Session 05)
app.use('/api/orders',  ordersRouter);
// Mount the cart router    — handles POST/GET/DELETE /api/cart (Session 05)
app.use('/api/cart',    cartRouter);
// Mount the payment router — handles POST/GET /api/payment     (Session 05)
app.use('/api/payment', paymentRouter);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Products: http://localhost:${PORT}/api/products?category=hat`);
    console.log(`[Server] Register: POST http://localhost:${PORT}/api/register`);
    console.log(`[Server] Login:    POST http://localhost:${PORT}/api/login`);
    console.log(`[Server] Checkout: POST http://localhost:${PORT}/api/checkout`);
    console.log(`[Server] Orders:   POST http://localhost:${PORT}/api/orders`);
    console.log(`[Server] Cart:     POST http://localhost:${PORT}/api/cart`);
    console.log(`[Server] Cart:     GET  http://localhost:${PORT}/api/cart/:userId`);
    console.log(`[Server] Cart:     DEL  http://localhost:${PORT}/api/cart/:id`);
    console.log(`[Server] Payment:  POST http://localhost:${PORT}/api/payment`);
    console.log(`[Server] Payment:  GET  http://localhost:${PORT}/api/payment/:orderId`);
});
