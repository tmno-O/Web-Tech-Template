/**
 * middleware/validateQuery.js — Gatekeeper: validates incoming query parameters.
 *
 * Logic Flow Position: Step 3 (PROCESSING) — Gatekeeper sub-step
 *   Express → Gatekeeper (validate category param)
 *   Gatekeeper → Express: OK (call next) | 400 Bad Request (reject)
 *
 * Sequence: routes/products.js → [THIS FILE] → productsController (on valid input)
 *                                            → Browser 400 Bad Request (on invalid)
 */

/** Exhaustive list of valid category values accepted by this API. */
const ALLOWED_CATEGORIES = [
    'hat',
    'drill',
    'screwdriver',
    'grinder',
    'planer',
    'power-tool',
    'jigsaw',
    'wrench',
    'instrument',
    'jackhammer',
    'spray-gun',
    'saw'
];

/**
 * Express middleware that validates the optional `category` query parameter.
 *
 * @param {import('express').Request}      req  - Express request object
 * @param {import('express').Response}     res  - Express response object
 * @param {import('express').NextFunction} next - Passes control to the next handler
 * @returns {void}
 *
 * Step 3: Express → Gatekeeper (validate category param)
 *         Gatekeeper → Express (OK) — calls next()
 *         Gatekeeper → Browser    — sends 400 Bad Request on invalid input
 */
function validateQuery(req, res, next) {
    const { category } = req.query;

    // No category supplied → return all products (valid scenario)
    if (category === undefined) {
        return next();
    }

    // Category must be a non-empty string
    if (typeof category !== 'string' || category.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'Invalid request: category must be a non-empty string.'
        });
    }

    // Category must match one of the allowed values (case-insensitive)
    if (!ALLOWED_CATEGORIES.includes(category.toLowerCase())) {
        return res.status(400).json({
            success: false,
            message: `Invalid category "${category}". Allowed values: ${ALLOWED_CATEGORIES.join(', ')}.`
        });
    }

    // All checks passed — let the request continue to the controller
    next();
}

module.exports = validateQuery;
