// ============================================================
//  products.js
//
//  Data-flow sequence (matches the sequence diagram):
//
//  Browser                 products.js              products.json
//    |                         |                          |
//    |-- DOMContentLoaded -->  |                          |
//    |                         |-- requestProducts() ---->|
//    |                         |      fetch(URL)          |
//    |                         |<---- JSON response ------|
//    |                         |-- renderUI(products) --> |
//    |<--- UI updated ---------|                          |
//
// ============================================================

// Path to the JSON file, relative to the HTML page that loads this script.
// Changing this one constant is all that is needed to point to a different file.
const PRODUCTS_URL = 'data/json/products.json';


// ── ENTRY POINT ─────────────────────────────────────────────
//
// 'DOMContentLoaded' fires once the browser has fully parsed the HTML
// and built the DOM tree (but before images or stylesheets finish loading).
// At that moment the #product-container element is guaranteed to exist,
// so it is safe to start the data request.
document.addEventListener('DOMContentLoaded', requestProducts);


// ── STEP 1 : requestProducts() ──────────────────────────────
//
// Entry function — called automatically by the DOMContentLoaded event.
//
// Responsibility:
//   1. Locate the container element in the DOM.
//   2. Send an HTTP GET request (fetch) to the JSON file.
//   3. Parse the response body as JSON.
//   4. Hand the parsed product array to renderUI().
//
// fetch() is asynchronous: it returns a Promise immediately and resolves
// later when the server responds. The browser does NOT freeze while
// waiting — .then() callbacks run only after the data arrives.
function requestProducts() {
    const container = document.getElementById('product-container');

    // Guard: if this script runs on a page that has no #product-container,
    // stop immediately so no fetch or errors are triggered unnecessarily.
    if (!container) return;

    // ── fetch(PRODUCTS_URL) ──────────────────────────────────
    // Sends: GET data/json/products.json
    // Data flows: Browser → JSON file → Browser (asynchronously)
    fetch(PRODUCTS_URL)

        // First .then() — handle the raw HTTP response.
        // 'response' contains status code, headers, and a readable body stream.
        // response.ok is true for 2xx status codes (e.g. 200 OK).
        .then(function (response) {
            if (!response.ok) {
                // Non-2xx (e.g. 404 Not Found) — throw so .catch() handles it.
                throw new Error('HTTP ' + response.status + ': could not load ' + PRODUCTS_URL);
            }
            // response.json() reads the body stream and parses it as JSON.
            // It also returns a Promise — its resolved value flows to the next .then().
            return response.json();
        })

        // Second .then() — data is now a plain JS object: { products: [ {...}, ... ] }
        // We extract the array and pass it, together with the container, to renderUI().
        .then(function (data) {
            // data.products is the array defined in products.json.
            // From here the data flows into renderUI() which builds the DOM.
            renderUI(container, data.products);
        })

        // .catch() — catches ANY error from the chain above:
        //   - Network failure (offline, CORS, file not found)
        //   - Non-2xx status (thrown in the first .then)
        //   - JSON parse error (malformed JSON)
        .catch(function (error) {
            console.error('[products.js] requestProducts failed:', error);
            renderError(container, 'Could not load products. Please try again later.');
        });
}


// ── STEP 2 : renderUI() ─────────────────────────────────────
//
// Receives:
//   container — the #product-container DOM element
//   products  — the array of product objects from the JSON file
//
// Responsibility:
//   Convert every product object into an HTML card string, then
//   inject all cards into the container with a single DOM write.
//   One write minimises browser reflows compared to appending
//   one card at a time.
//
// Data flow inside this function:
//   products[]  →  .map(buildProductCard)  →  HTML strings[]
//                →  .join('')              →  one big HTML string
//                →  container.innerHTML   →  cards appear on screen
function renderUI(container, products) {
    const html = products.map(buildProductCard).join('');
    container.innerHTML = html; // single DOM write — all cards appear at once
}


// ── HELPER : renderError() ───────────────────────────────────
//
// Called by requestProducts() when fetch fails.
// Replaces the container content with a visible Bootstrap alert
// so the user sees a friendly message instead of a blank area.
function renderError(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger w-100 text-center" role="alert">
            <strong>Error:</strong> ${message}
        </div>`;
}


// ── HELPER : buildProductCard() ──────────────────────────────
//
// Pure function — called once per product inside renderUI().
// Takes a single product object and returns its full HTML card string.
//
// Data used from the product object:
//   product.badge          → badge label (new / hot / sale / null)
//   product.url            → link href for image and name
//   product.image          → <img> src
//   product.name           → product title text
//   product.rating         → number of filled stars (1–5)
//   product.reviews        → review count shown next to stars
//   product.features[]     → spec list items
//   product.availability   → "In Stock" or "Out of Stock"
//   product.price          → current price (number)
//   product.compareAtPrice → original price before discount, or null
function buildProductCard(product) {
    // Map availability string to a Bootstrap colour class.
    const availabilityClass = product.availability === 'In Stock' ? 'text-success' : 'text-danger';

    return `
        <div class="products-list__item">
            <div class="product-card">
                <button class="product-card__quickview" type="button">
                    <svg width="16px" height="16px">
                        <use xlink:href="images/sprite.svg#quickview-16"></use>
                    </svg>
                    <span class="fake-svg-icon"></span>
                </button>
                <div class="product-card__badges-list">
                    ${buildBadge(product.badge)}
                </div>
                <div class="product-card__image">
                    <a href="${product.url}">
                        <img src="${product.image}" alt="${product.name}">
                    </a>
                </div>
                <div class="product-card__info">
                    <div class="product-card__name">
                        <a href="${product.url}">${product.name}</a>
                    </div>
                    <div class="product-card__rating">
                        <div class="rating">
                            <div class="rating__body">
                                ${buildStars(product.rating)}
                            </div>
                        </div>
                        <div class="product-card__rating-legend">${product.reviews} Reviews</div>
                    </div>
                    <ul class="product-card__features-list">
                        ${buildFeatures(product.features)}
                    </ul>
                </div>
                <div class="product-card__actions">
                    <div class="product-card__availability">
                        Availability: <span class="${availabilityClass}">${product.availability}</span>
                    </div>
                    <div class="product-card__prices">
                        ${buildPrice(product.price, product.compareAtPrice)}
                    </div>
                    <div class="product-card__buttons">
                        <button class="btn btn-primary product-card__addtocart" type="button">
                            Add To Cart
                        </button>
                        <button class="btn btn-secondary product-card__addtocart product-card__addtocart--list" type="button">
                            Add To Cart
                        </button>
                        <button class="btn btn-light btn-svg-icon btn-svg-icon--fake-svg product-card__wishlist" type="button">
                            <svg width="16px" height="16px">
                                <use xlink:href="images/sprite.svg#wishlist-16"></use>
                            </svg>
                            <span class="fake-svg-icon fake-svg-icon--wishlist-16"></span>
                        </button>
                        <button class="btn btn-light btn-svg-icon btn-svg-icon--fake-svg product-card__compare" type="button">
                            <svg width="16px" height="16px">
                                <use xlink:href="images/sprite.svg#compare-16"></use>
                            </svg>
                            <span class="fake-svg-icon fake-svg-icon--compare-16"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
}


// ── HELPER : buildBadge() ────────────────────────────────────
//
// Returns a badge <div> when the product has a badge value
// ("new", "hot", or "sale"), or an empty string when badge is null.
// The CSS class badge--{type} controls the colour.
function buildBadge(badge) {
    if (!badge) return '';
    const label = badge.charAt(0).toUpperCase() + badge.slice(1);
    return `<div class="product-card__badge product-card__badge--${badge}">${label}</div>`;
}


// ── HELPER : buildPrice() ────────────────────────────────────
//
// When compareAtPrice is present the product is on sale:
//   show the discounted price (new) AND the original price (old/strikethrough).
// When compareAtPrice is null, show only the regular price.
function buildPrice(price, compareAtPrice) {
    if (compareAtPrice) {
        return `
            <span class="product-card__new-price">${formatPrice(price)}</span>
            <span class="product-card__old-price">${formatPrice(compareAtPrice)}</span>`;
    }
    return formatPrice(price);
}


// ── HELPER : formatPrice() ───────────────────────────────────
//
// Converts a numeric amount to a display string with $ and commas.
// Examples:  749    → "$749.00"
//            1019   → "$1,019.00"
//            159    → "$159.00"
function formatPrice(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


// ── HELPER : buildStars() ────────────────────────────────────
//
// Generates 5 SVG star icons for the rating widget.
// Stars with index i <= rating receive the "--active" CSS modifier
// (filled colour); the rest stay empty/outline.
// Each star has two variants rendered by the template:
//   rating__star         — used by browsers that support <svg><use>
//   rating__star--only-edge — fallback for browsers that don't
function buildStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const activeClass = i <= rating ? ' rating__star--active' : '';
        html += `
            <svg class="rating__star${activeClass}" width="13px" height="12px">
                <g class="rating__fill">
                    <use xlink:href="images/sprite.svg#star-normal"></use>
                </g>
                <g class="rating__stroke">
                    <use xlink:href="images/sprite.svg#star-normal-stroke"></use>
                </g>
            </svg>
            <div class="rating__star rating__star--only-edge${activeClass}">
                <div class="rating__fill"><div class="fake-svg-icon"></div></div>
                <div class="rating__stroke"><div class="fake-svg-icon"></div></div>
            </div>`;
    }
    return html;
}


// ── HELPER : buildFeatures() ─────────────────────────────────
//
// Converts the features array from the JSON into a list of <li> elements.
// Example input:  ["Speed: 750 RPM", "Voltage: 20 Volts", ...]
// Example output: "<li>Speed: 750 RPM</li><li>Voltage: 20 Volts</li>..."
function buildFeatures(features) {
    return features.map(f => `<li>${f}</li>`).join('');
}
