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

const express = require('express');  // Import the Express framework
const cors    = require('cors');     // Import CORS middleware to allow cross-origin requests

const productsRouter = require('./routes/products');  // Import the products router
const registerRouter = require('./routes/register');  // Import the registration router

const app  = express();              // Create the Express application instance
const PORT = process.env.PORT || 3000; // Use environment PORT or default to 3000

// ── Middleware ────────────────────────────────────────────────────────────────
// Allow cross-origin requests so the Stroyka frontend can call this API
app.use(cors());
// Parse incoming JSON request bodies so req.body is populated
app.use(express.json());

// ── API Routes ────────────────────────────────────────────────────────────────
// Mount the products router — handles GET /api/products
app.use('/api/products', productsRouter);
// Mount the register router — handles POST /api/register
app.use('/api/register', registerRouter);

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`[Server] Running at http://localhost:${PORT}`);
    console.log(`[Server] Products: http://localhost:${PORT}/api/products?category=hat`);
    console.log(`[Server] Register: POST http://localhost:${PORT}/api/register`);
});
