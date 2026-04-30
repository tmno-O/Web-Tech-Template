// ============================================================
//  search.js — Search Results Page
//
//  Flow:
//    1. Read ?q= from URL
//    2. Pre-fill the search bar
//    3. Fetch products.json
//    4. Filter products whose name contains the query
//    5. Sort (if sort-select changes)
//    6. Render into #product-container
// ============================================================

const PRODUCTS_URL = 'data/json/products.json';

let allProducts = [];
let sortOrder   = 'default';

document.addEventListener('DOMContentLoaded', function () {
    var query = getQueryParam('q');

    // Pre-fill the search bar with the current query
    var input = document.getElementById('search-page-input');
    if (input && query) {
        input.value = query;
    }

    // Wire up sort select
    var sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            sortOrder = this.value;
            renderResults(query);
        });
    }

    // Fetch and render
    var container = document.getElementById('product-container');
    if (!container) return;

    fetch(PRODUCTS_URL)
        .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function (data) {
            allProducts = data.products;
            renderResults(query);
        })
        .catch(function (err) {
            console.error('[search.js]', err);
            container.innerHTML = '<div class="alert alert-danger w-100 text-center">Could not load products. Please try again later.</div>';
        });
});


// ── renderResults() ─────────────────────────────────────────
function renderResults(query) {
    var container = document.getElementById('product-container');
    var countEl   = document.getElementById('results-count');

    var results = allProducts;

    // Filter by query
    if (query && query.trim() !== '') {
        var q = query.trim().toLowerCase();
        results = results.filter(function (p) {
            return p.name.toLowerCase().indexOf(q) !== -1 ||
                   (p.category && p.category.toLowerCase().indexOf(q) !== -1);
        });
    }

    // Sort
    results = sortProducts(results.slice(), sortOrder);

    // Results count text
    if (countEl) {
        if (!query || query.trim() === '') {
            countEl.textContent = 'Showing all ' + results.length + ' products';
        } else if (results.length === 0) {
            countEl.innerHTML = 'No results found for <strong>"' + escapeHtml(query) + '"</strong>';
        } else {
            countEl.innerHTML = 'About <strong>' + results.length + '</strong> result' +
                (results.length !== 1 ? 's' : '') +
                ' for <strong>"' + escapeHtml(query) + '"</strong>';
        }
    }

    // Render cards or empty state
    if (results.length === 0) {
        container.innerHTML =
            '<div class="w-100 text-center py-5">' +
            '<svg width="64" height="64" style="opacity:0.15"><use xlink:href="images/sprite.svg#search-20"></use></svg>' +
            '<p class="mt-3 text-muted">No products match your search. Try different keywords.</p>' +
            '</div>';
        return;
    }

    container.innerHTML = results.map(buildProductCard).join('');
}


// ── sortProducts() ───────────────────────────────────────────
function sortProducts(products, order) {
    if (order === 'name-az')   return products.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (order === 'name-za')   return products.sort(function (a, b) { return b.name.localeCompare(a.name); });
    if (order === 'price-low') return products.sort(function (a, b) { return a.price - b.price; });
    if (order === 'price-high')return products.sort(function (a, b) { return b.price - a.price; });
    return products.sort(function (a, b) { return a.id - b.id; });
}


// ── getQueryParam() ─────────────────────────────────────────
function getQueryParam(name) {
    var url    = new URL(window.location.href);
    return url.searchParams.get(name) || '';
}


// ── escapeHtml() ─────────────────────────────────────────────
function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}


// ── buildProductCard() ──────────────────────────────────────
function buildProductCard(product) {
    var availabilityClass = product.availability === 'In Stock' ? 'text-success' : 'text-danger';
    return (
        '<div class="products-list__item">' +
        '<div class="product-card">' +
        '<button class="product-card__quickview" type="button"><svg width="16px" height="16px"><use xlink:href="images/sprite.svg#quickview-16"></use></svg><span class="fake-svg-icon"></span></button>' +
        '<div class="product-card__badges-list">' + buildBadge(product.badge) + '</div>' +
        '<div class="product-card__image"><a href="' + product.url + '"><img src="' + product.image + '" alt="' + escapeHtml(product.name) + '"></a></div>' +
        '<div class="product-card__info">' +
        '<div class="product-card__name"><a href="' + product.url + '">' + product.name + '</a></div>' +
        '<div class="product-card__rating"><div class="rating"><div class="rating__body">' + buildStars(product.rating) + '</div></div>' +
        '<div class="product-card__rating-legend">' + product.reviews + ' Reviews</div></div>' +
        '<ul class="product-card__features-list">' + buildFeatures(product.features) + '</ul>' +
        '</div>' +
        '<div class="product-card__actions">' +
        '<div class="product-card__availability">Availability: <span class="' + availabilityClass + '">' + product.availability + '</span></div>' +
        '<div class="product-card__prices">' + buildPrice(product.price, product.compareAtPrice) + '</div>' +
        '<div class="product-card__buttons">' +
        '<button class="btn btn-primary product-card__addtocart" type="button">Add To Cart</button>' +
        '<button class="btn btn-secondary product-card__addtocart product-card__addtocart--list" type="button">Add To Cart</button>' +
        '<button class="btn btn-light btn-svg-icon btn-svg-icon--fake-svg product-card__wishlist" type="button"><svg width="16px" height="16px"><use xlink:href="images/sprite.svg#wishlist-16"></use></svg><span class="fake-svg-icon fake-svg-icon--wishlist-16"></span></button>' +
        '<button class="btn btn-light btn-svg-icon btn-svg-icon--fake-svg product-card__compare" type="button"><svg width="16px" height="16px"><use xlink:href="images/sprite.svg#compare-16"></use></svg><span class="fake-svg-icon fake-svg-icon--compare-16"></span></button>' +
        '</div></div></div></div>'
    );
}

function buildBadge(badge) {
    if (!badge) return '';
    return '<div class="product-card__badge product-card__badge--' + badge + '">' + badge.charAt(0).toUpperCase() + badge.slice(1) + '</div>';
}

function buildPrice(price, compareAtPrice) {
    if (compareAtPrice) {
        return '<span class="product-card__new-price">' + formatPrice(price) + '</span>' +
               '<span class="product-card__old-price">' + formatPrice(compareAtPrice) + '</span>';
    }
    return formatPrice(price);
}

function formatPrice(amount) {
    return '$' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function buildStars(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var active = i <= rating ? ' rating__star--active' : '';
        html += '<svg class="rating__star' + active + '" width="13px" height="12px"><g class="rating__fill"><use xlink:href="images/sprite.svg#star-normal"></use></g><g class="rating__stroke"><use xlink:href="images/sprite.svg#star-normal-stroke"></use></g></svg>' +
                '<div class="rating__star rating__star--only-edge' + active + '"><div class="rating__fill"><div class="fake-svg-icon"></div></div><div class="rating__stroke"><div class="fake-svg-icon"></div></div></div>';
    }
    return html;
}

function buildFeatures(features) {
    return features.map(function (f) { return '<li>' + f + '</li>'; }).join('');
}
