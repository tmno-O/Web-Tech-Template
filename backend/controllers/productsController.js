/**
 * controllers/productsController.js — Handles HTTP req/res for the products resource.
 *
 * Logic Flow Position: Step 3 (PROCESSING) — Controller sub-step
 *   Express → Controller: getProductsByCategory("hat")
 *   Controller → Service: findByCategory("hat")
 *   Controller → Express → Browser: 200 OK + JSON array | 500 Server Error
 *
 * Sequence: middleware/validateQuery.js → [THIS FILE] → services/productsService.js
 */

const productsService = require('../services/productsService');

/**
 * GET /api/products  or  GET /api/products?category=hat
 *
 * Reads the optional `category` query param, delegates filtering to the service,
 * and returns the result as a JSON array with HTTP 200.
 *
 * @param {import('express').Request}  req - Express request; may contain req.query.category
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} Sends 200 + JSON array on success, 500 on unexpected error
 *
 * Step 3: Express → Controller: getProductsByCategory(category)
 * Step 4: Controller → Express → Browser: 200 OK + JSON array
 */
async function getProducts(req, res) {
    try {
        const { category } = req.query;

        // Step 3: Controller → Service: findByCategory(category)
        const products = await productsService.findByCategory(category);

        // Step 4: Controller → Express → Browser: 200 OK + JSON array
        return res.status(200).json(products);

    } catch (error) {
        console.error('[ProductsController.getProducts] Unexpected error:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error: Could not retrieve products.'
        });
    }
}

module.exports = { getProducts };
