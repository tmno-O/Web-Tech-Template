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

const PRODUCTS_URL = 'data/json/products.json';

// Global state — source of truth for all filters
let allProducts   = [];
let activeCategory = '';   // '' means show all
let sortOrder      = 'default';

document.addEventListener('DOMContentLoaded', requestProducts);


// ── STEP 1 : requestProducts() ──────────────────────────────
function requestProducts() {
    const container = document.getElementById('catalog');
    if (!container) return;

    fetch(PRODUCTS_URL)
        .then(function (response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status + ': could not load ' + PRODUCTS_URL);
            }
            return response.json();
        })
        .then(function (data) {
            allProducts = data.products;
            attachControls();
            applyFilters(container);
        })
        .catch(function (error) {
            console.error('[products.js] requestProducts failed:', error);
            renderError(container, 'Could not load products. Please try again later.');
        });
}


// ── STEP 2 : attachControls() ───────────────────────────────
//
// Wire up sort select and category links after products are loaded.
// Search navigates to search.html — no inline filtering here.
function attachControls() {
    // Sort select
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortOrder = this.value;
            applyFilters(document.getElementById('catalog'));
        });
    }

    // Category filter links
    var categoryLinks = document.querySelectorAll('.category-filter-link');
    categoryLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var clicked = this.dataset.category;

            // Toggle: clicking the active category resets to "all"
            activeCategory = (activeCategory === clicked) ? '' : clicked;

            // Update active visual state on sidebar items
            updateCategoryActive();

            applyFilters(document.getElementById('catalog'));
        });
    });
}


// ── STEP 3 : applyFilters() ─────────────────────────────────
//
// Filters → sorts → renders the current product subset.
function applyFilters(container) {
    var result = allProducts;

    // 1. Category filter
    if (activeCategory) {
        result = result.filter(function (p) {
            return p.category === activeCategory;
        });
    }

    // 2. Sort
    result = sortProducts(result.slice(), sortOrder);

    // 3. Render
    renderUI(container, result);

    // 4. Update results count
    var countEl = document.getElementById('results-count');
    if (countEl) {
        var total = allProducts.length;
        var shown = result.length;
        countEl.textContent = shown === total
            ? 'Showing ' + total + ' products'
            : 'Showing ' + shown + ' of ' + total + ' products';
    }
}




// ── HELPER : sortProducts() ─────────────────────────────────
function sortProducts(products, order) {
    if (order === 'name-az') {
        return products.sort(function (a, b) { return a.name.localeCompare(b.name); });
    }
    if (order === 'name-za') {
        return products.sort(function (a, b) { return b.name.localeCompare(a.name); });
    }
    if (order === 'price-low') {
        return products.sort(function (a, b) { return a.price - b.price; });
    }
    if (order === 'price-high') {
        return products.sort(function (a, b) { return b.price - a.price; });
    }
    // default — original JSON order (by id)
    return products.sort(function (a, b) { return a.id - b.id; });
}


// ── HELPER : updateCategoryActive() ─────────────────────────
//
// Adds/removes the "--current" modifier on sidebar category items
// to reflect the active filter visually.
function updateCategoryActive() {
    var items = document.querySelectorAll('.filter-categories__item');
    items.forEach(function (item) {
        var link = item.querySelector('.category-filter-link');
        if (!link) return;
        if (link.dataset.category === activeCategory) {
            item.classList.add('filter-categories__item--current');
            item.classList.remove('filter-categories__item--child');
        } else {
            item.classList.remove('filter-categories__item--current');
            // Restore --child class for sub-items that had it originally
            if (!item.classList.contains('filter-categories__item--parent')) {
                item.classList.add('filter-categories__item--child');
            }
        }
    });
}


// ── STEP 4 : renderUI() ─────────────────────────────────────
function renderUI(container, products) {
    if (products.length === 0) {
        container.innerHTML = '<div class="alert alert-warning w-100 text-center mt-3" role="alert">No products match your search.</div>';
        return;
    }
    const html = products.map(buildProductCard).join('');
    container.innerHTML = html;
}


// ── HELPER : renderError() ───────────────────────────────────
function renderError(container, message) {
    container.innerHTML = `
        <div class="alert alert-danger w-100 text-center" role="alert">
            <strong>Error:</strong> ${message}
        </div>`;
}


// ── HELPER : buildProductCard() ──────────────────────────────
function buildProductCard(product) {
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
                        <div class="product-card__qty mb-1">
                            <input class="qty-input form-control form-control-sm"
                                   type="number" value="1" min="1"
                                   max="${product.stock ?? 0}"
                                   aria-label="Quantity"
                                   style="width:72px;display:inline-block">
                        </div>
                        <button class="btn btn-primary product-card__addtocart add-to-cart"
                                data-id="${product.id}"
                                data-stock="${product.stock ?? 0}"
                                type="button">
                            Add To Cart
                        </button>
                        <button class="btn btn-secondary product-card__addtocart product-card__addtocart--list add-to-cart"
                                data-id="${product.id}"
                                data-stock="${product.stock ?? 0}"
                                type="button">
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
function buildBadge(badge) {
    if (!badge) return '';
    const label = badge.charAt(0).toUpperCase() + badge.slice(1);
    return `<div class="product-card__badge product-card__badge--${badge}">${label}</div>`;
}


// ── HELPER : buildPrice() ────────────────────────────────────
function buildPrice(price, compareAtPrice) {
    if (compareAtPrice) {
        return `
            <span class="product-card__new-price">${formatPrice(price)}</span>
            <span class="product-card__old-price">${formatPrice(compareAtPrice)}</span>`;
    }
    return formatPrice(price);
}


// ── HELPER : formatPrice() ───────────────────────────────────
function formatPrice(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}


// ── HELPER : buildStars() ────────────────────────────────────
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
function buildFeatures(features) {
    return features.map(f => `<li>${f}</li>`).join('');
}
