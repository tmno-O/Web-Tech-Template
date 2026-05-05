const productsService = require('../services/products.service');

/**
 * GET /api/products
 * Query params: q, category, sort
 */
function getAll(req, res) {
    try {
        const { q, category, sort } = req.query;
        const products = productsService.getAllProducts({ q, category, sort });

        res.json({
            success: true,
            count: products.length,
            products,
        });
    } catch (err) {
        console.error('[ProductsController.getAll]', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve products.' });
    }
}

/**
 * GET /api/products/:id
 */
function getById(req, res) {
    try {
        const product = productsService.getProductById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found.' });
        }

        res.json({ success: true, product });
    } catch (err) {
        console.error('[ProductsController.getById]', err);
        res.status(500).json({ success: false, message: 'Failed to retrieve product.' });
    }
}

module.exports = { getAll, getById };
