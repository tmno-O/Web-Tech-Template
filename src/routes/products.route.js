const { Router } = require('express');
const productsController = require('../controllers/products.controller');

const router = Router();

// GET /api/products          → all products (supports ?q=, ?category=, ?sort=)
router.get('/', productsController.getAll);

// GET /api/products/:id      → single product by id
router.get('/:id', productsController.getById);

module.exports = router;
