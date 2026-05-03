const express = require('express');
const cors    = require('cors');
const path    = require('path');

const productsRouter = require('./src/routes/products.route');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── API routes ───────────────────────────────────────────────
app.use('/api/products', productsRouter);

// ── Static files (HTML template) ────────────────────────────
app.use(express.static(path.join(__dirname)));

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
