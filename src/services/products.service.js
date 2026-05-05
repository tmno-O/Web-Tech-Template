const path = require('path');

const DATA_PATH = path.join(__dirname, '../../data/json/products.json');

// Loaded once; replace with a DB call when you migrate away from JSON
const { products: ALL_PRODUCTS } = require(DATA_PATH);

/**
 * Return products filtered and sorted according to the given options.
 * @param {object} opts
 * @param {string} [opts.q]        - Search term (name or category)
 * @param {string} [opts.category] - Exact category match
 * @param {string} [opts.sort]     - name-az | name-za | price-low | price-high
 */
function getAllProducts({ q, category, sort } = {}) {
    let results = [...ALL_PRODUCTS];

    if (q) {
        const query = q.trim().toLowerCase();
        results = results.filter(
            (p) =>
                p.name.toLowerCase().includes(query) ||
                (p.category && p.category.toLowerCase().includes(query))
        );
    }

    if (category) {
        results = results.filter((p) => p.category === category);
    }

    return _sort(results, sort);
}

/**
 * Find a single product by its numeric id. Returns null if not found.
 * @param {string|number} id
 */
function getProductById(id) {
    return ALL_PRODUCTS.find((p) => p.id === Number(id)) || null;
}

// ── Private helper ───────────────────────────────────────────

function _sort(products, order) {
    switch (order) {
        case 'name-az':    return products.sort((a, b) => a.name.localeCompare(b.name));
        case 'name-za':    return products.sort((a, b) => b.name.localeCompare(a.name));
        case 'price-low':  return products.sort((a, b) => a.price - b.price);
        case 'price-high': return products.sort((a, b) => b.price - a.price);
        default:           return products.sort((a, b) => a.id - b.id);
    }
}

module.exports = { getAllProducts, getProductById };
