// ============================================================
//  product-page.js — Populates product.html from ?id= param
// ============================================================

document.addEventListener('DOMContentLoaded', function () {
    var id = new URL(window.location.href).searchParams.get('id');
    if (!id) return;

    fetch('data/json/products.json')
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        })
        .then(function (data) {
            var product = data.products.find(function (p) {
                return String(p.id) === String(id);
            });
            if (!product) return;
            populate(product);
        })
        .catch(function (err) {
            console.error('[product-page.js]', err);
        });
});

function populate(p) {
    // Page title
    document.title = p.name + ' - Stroyka';

    // Breadcrumb
    var bc = document.querySelector('.breadcrumb-item.active');
    if (bc) bc.textContent = p.name;

    // Product name
    var nameEl = document.querySelector('h1.product__name');
    if (nameEl) nameEl.textContent = p.name;

    // Price
    var priceEl = document.querySelector('.product__prices');
    if (priceEl) {
        if (p.compareAtPrice) {
            priceEl.innerHTML =
                '<span class="product-card__new-price">' + formatPrice(p.price) + '</span>' +
                '<span class="product-card__old-price">' + formatPrice(p.compareAtPrice) + '</span>';
        } else {
            priceEl.textContent = formatPrice(p.price);
        }
    }

    // Availability (sidebar + meta list)
    var availText  = p.availability || 'In Stock';
    var availClass = availText === 'In Stock' ? 'text-success' : 'text-danger';
    document.querySelectorAll(
        '.product__availability span, .product__meta-availability span'
    ).forEach(function (el) {
        el.textContent = availText;
        el.className   = availClass;
    });

    // Features list
    var featEl = document.querySelector('ul.product__features');
    if (featEl && p.features) {
        featEl.innerHTML = p.features.map(function (f) {
            return '<li>' + escHtml(f) + '</li>';
        }).join('');
    }

    // Rating stars
    var ratingBody = document.querySelector('.product__rating .rating__body');
    if (ratingBody) ratingBody.innerHTML = buildStars(p.rating);

    // Review count
    var reviewEl = document.querySelector('.product__rating-legend a');
    if (reviewEl) reviewEl.textContent = (p.reviews || 0) + ' Reviews';

    // Gallery — update every img src inside the featured owl-carousel and the thumbnail carousel
    document.querySelectorAll('#product-image img').forEach(function (img) {
        img.src = p.image;
        img.alt = escHtml(p.name);
    });
    document.querySelectorAll('#product-image a').forEach(function (a) {
        a.href = p.image;
    });
    document.querySelectorAll('.product-gallery__carousel img').forEach(function (img) {
        img.src = p.image;
        img.alt = escHtml(p.name);
    });
}

// ── Helpers ──────────────────────────────────────────────────

function formatPrice(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function escHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function buildStars(rating) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var a = i <= rating ? ' rating__star--active' : '';
        html +=
            '<svg class="rating__star' + a + '" width="13px" height="12px">' +
            '<g class="rating__fill"><use xlink:href="images/sprite.svg#star-normal"></use></g>' +
            '<g class="rating__stroke"><use xlink:href="images/sprite.svg#star-normal-stroke"></use></g>' +
            '</svg>' +
            '<div class="rating__star rating__star--only-edge' + a + '">' +
            '<div class="rating__fill"><div class="fake-svg-icon"></div></div>' +
            '<div class="rating__stroke"><div class="fake-svg-icon"></div></div>' +
            '</div>';
    }
    return html;
}
