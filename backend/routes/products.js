/**
 * routes/products.js — URL endpoint definitions for /api/products.
 *
 * Logic Flow Position: Step 2 (REQUEST)
 *   - Receives the routed request from server.js
 *   - Runs the validateQuery middleware (Gatekeeper) first
 *   - Delegates to productsController if validation passes
 *
 * Sequence: server.js → [THIS FILE] → validateQuery → productsController
 */

const express            = require('express');
const validateQuery      = require('../middleware/validateQuery');
const productsController = require('../controllers/productsController');

const router = express.Router();

/**
 * GET /api/products
 * GET /api/products?category=hat
 *
 * Step 2: Browser → Express Server: GET /api/products?category=hat
 * First runs the Gatekeeper (validateQuery), then the controller.
 */
router.get('/', validateQuery, productsController.getProducts);

module.exports = router;
