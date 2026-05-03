/**
 * services/productsService.js — Business logic for product data retrieval and filtering.
 *
 * Logic Flow Position: Step 3 (PROCESSING) — Service sub-steps
 *   Controller → products.json : read all products
 *   Controller → Controller    : filter by category (done here)
 *
 * Sequence: controllers/productsController.js → [THIS FILE] → data/products.json
 *
 * This is the only layer that directly touches the data source (products.json).
 * All filtering logic lives here so controllers stay thin.
 */

const fs   = require('fs').promises;
const path = require('path');

/** Absolute path to the JSON data file. */
const DATA_FILE_PATH = path.join(__dirname, '../data/products.json');

/**
 * Reads all products from products.json and optionally filters by category.
 *
 * @param {string|undefined} category
 *   The category to filter by (case-insensitive), e.g. "hat".
 *   Pass `undefined` (no query param) to return every product.
 * @returns {Promise<Array<{id: number, name: string, price: number, image: string, category: string}>>}
 *   Resolves to an array of product objects matching the given category (or all products).
 * @throws {Error} If products.json cannot be read or parsed.
 *
 * Step 3: Controller → products.json: read all products
 *         Controller → Controller   : filter by category
 */
async function findByCategory(category) {
    // Read the raw JSON file from disk
    const rawData = await fs.readFile(DATA_FILE_PATH, 'utf-8');

    // Parse into a JavaScript array
    const allProducts = JSON.parse(rawData);

    // If no category was requested, return the full list
    if (category === undefined) {
        return allProducts;
    }

    // Filter: keep only products whose category matches (case-insensitive)
    const lowerCategory = category.toLowerCase();
    const filteredProducts = allProducts.filter(
        (product) => product.category.toLowerCase() === lowerCategory
    );

    return filteredProducts;
}

module.exports = { findByCategory };
