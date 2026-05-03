/**
 * server.js — Entry point for the Stroyka Tools Store REST API backend.
 *
 * Logic Flow Position: Step 2 (REQUEST) + Step 4 (RESPONSE)
 *   - Step 2: Receives the incoming HTTP GET request from the browser
 *   - Step 4: Sends the final HTTP response (200 JSON / 400 / 500) back to the browser
 *
 * Sequence: Browser → [THIS FILE] → Router → Middleware → Controller → Service
 *           Service → Controller → Router → [THIS FILE] → Browser
 */

const express = require('express');
const cors    = require('cors');

const productsRouter = require('./routes/products');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
// Allow cross-origin requests so the Stroyka frontend can call this API
app.use(cors());
// Parse incoming JSON request bodies
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
// Step 2: Mount the products router at /api/products
app.use('/api/products', productsRouter);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Try: http://localhost:${PORT}/api/products?category=hat`);
});
