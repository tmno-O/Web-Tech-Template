// =============================================================
//  cart.js
//
//  Implements "Add to Cart" using Event Delegation.
//  Every comment block is labelled with its Activity-Diagram node.
//
//  Activity Diagram flow:
//  [Start] → click delegation → read data → [Decision] qty valid?
//    └─ [Yes] → fetch product → [Decision] in stock?
//      └─ [Yes] → [Decision] logged in?
//        ├─ guest   → localStorage
//        └─ member  → POST /api/cart (stub)
//        → [Fork] badge + toast + icon → [Join]
//        → [Decision] continue/checkout → [End]
// =============================================================

// ── In-memory cart state (source of truth for badge maths) ───
let cart = [];

// ── Stubs / placeholders ──────────────────────────────────────

// [Helper] isLoggedIn — placeholder, always guest for now
const isLoggedIn = () => false;

// [Helper] postToServer — stubbed /api/cart call
const postToServer = (item) => {
    console.log('[cart.js] POST /api/cart (stub):', item);
    return Promise.resolve({ ok: true });
};

// ── One-time CSS injection ────────────────────────────────────
(function injectCartStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes cartBounce {
            0%,100% { transform: scale(1);    }
            40%      { transform: scale(1.35); }
            70%      { transform: scale(0.90); }
        }
        .cart-icon--bounce { animation: cartBounce 0.5s ease; }

        .cart-toast-container {
            position: fixed;
            bottom: 1.25rem;
            right:  1.25rem;
            z-index: 9999;
            min-width: 280px;
            max-width: 380px;
        }
        .cart-inline-error { font-size: .8rem; }
    `;
    document.head.appendChild(style);
})();

// ── Toast-container factory ───────────────────────────────────
function getOrCreateToastContainer() {
    let c = document.getElementById('cart-toast-container');
    if (!c) {
        c = document.createElement('div');
        c.id = 'cart-toast-container';
        c.className = 'cart-toast-container';
        document.body.appendChild(c);
    }
    return c;
}

// ── Cart initialisation ───────────────────────────────────────
function initCart() {
    try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); }
    catch (_) { cart = []; }
    syncBadge();
}

// ── In-memory + localStorage helpers ─────────────────────────

function updateCart(item) {
    const existing = cart.find(i => String(i.id) === String(item.id));
    if (existing) {
        existing.qty += item.qty;
    } else {
        cart.push({ ...item });
    }
}

// [Action] Save item to localStorage (key: "cart")
function addToLocalStorage(item) {
    updateCart(item);
    localStorage.setItem('cart', JSON.stringify(cart));
}

// ── UI helpers ────────────────────────────────────────────────

// [Action] Update #cart-count badge (all cart indicator spans)
function syncBadge() {
    const total = cart.reduce((sum, i) => sum + i.qty, 0);
    document.querySelectorAll('a[href="cart.html"] .indicator__value')
            .forEach(el => { el.textContent = total; });
}

function updateBadge() {
    return new Promise(resolve => { syncBadge(); resolve(); });
}

// [Action] Animate #cart-icon (CSS class toggle for bounce)
function animateCartIcon() {
    return new Promise(resolve => {
        const icons = document.querySelectorAll('a[href="cart.html"] .indicator__button');
        icons.forEach(icon => icon.classList.add('cart-icon--bounce'));
        setTimeout(() => {
            icons.forEach(icon => icon.classList.remove('cart-icon--bounce'));
            resolve();
        }, 500);
    });
}

// [Action] Show toast "Added to cart" (auto-dismiss 2 s)
// Also encodes [Decision] Continue shopping or Checkout?
function showSuccessToast(productName) {
    return new Promise(resolve => {
        const container = getOrCreateToastContainer();
        const el = document.createElement('div');
        el.className = 'toast bg-success text-white border-0 mb-2';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-atomic', 'true');
        el.innerHTML = `
            <div class="toast-body">
                <strong>Added to cart!</strong><br>
                <small>${productName}</small>
                <div class="mt-2">
                    <!-- [Decision] Continue shopping or Checkout? -->
                    <button class="btn btn-sm btn-outline-light mr-2 js-continue">Continue Shopping</button>
                    <button class="btn btn-sm btn-light js-checkout">Go to Cart</button>
                </div>
            </div>`;
        container.appendChild(el);

        // [Continue] → stay on page
        el.querySelector('.js-continue').addEventListener('click', () => $(el).toast('hide'));

        // [Checkout] → navigate to cart.html
        el.querySelector('.js-checkout').addEventListener('click', () => {
            $(el).toast('hide');
            window.location.href = 'cart.html';
        });

        $(el).toast({ delay: 2000 }).toast('show');
        $(el).on('hidden.bs.toast', () => { el.remove(); resolve(); });
    });
}

// [Action] Show general-purpose toast (warnings / errors)
function showToast(message, type = 'info') {
    return new Promise(resolve => {
        const container = getOrCreateToastContainer();
        const bgMap = {
            success: 'bg-success text-white',
            error:   'bg-danger  text-white',
            warning: 'bg-warning text-dark',
            info:    'bg-info    text-white',
        };
        const bgClass = bgMap[type] ?? bgMap.info;
        const el = document.createElement('div');
        el.className = `toast ${bgClass} border-0 mb-2`;
        el.setAttribute('role', 'alert');
        el.setAttribute('aria-live', 'assertive');
        el.innerHTML = `
            <div class="toast-body d-flex justify-content-between align-items-start">
                <span>${message}</span>
                <button type="button" class="ml-2 close" data-dismiss="toast" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>`;
        container.appendChild(el);
        $(el).toast({ delay: 3500 }).toast('show');
        $(el).on('hidden.bs.toast', () => { el.remove(); resolve(); });
    });
}

// [Action] Show inline error message (qty validation)
function showInlineError(card, message) {
    if (!card) return;
    card.querySelectorAll('.cart-inline-error').forEach(e => e.remove());
    const err = document.createElement('div');
    err.className = 'cart-inline-error text-danger small mt-1';
    err.textContent = message;
    const anchor = card.querySelector('.product-card__qty') ??
                   card.querySelector('.product-card__buttons');
    if (anchor) {
        anchor.appendChild(err);
        setTimeout(() => err.remove(), 3000);
    }
}


// =============================================================
//  PART A — Listener registration
//  A single delegated click listener on #catalog.
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
    initCart();

    // [Action] Event delegation captures the click on #catalog
    const catalog = document.getElementById('catalog');
    if (!catalog) return;

    catalog.addEventListener('click', handleAddToCart);
});


// =============================================================
//  PART B — Handler function
//  handleAddToCart(event) — the full Activity-Diagram flow.
// =============================================================

// [Start]
async function handleAddToCart(event) {

    // [Action] Event delegation — resolve nearest .add-to-cart ancestor
    // Uses closest() so clicks on inner <svg> / <span> still work.
    const btn = event.target.closest('.add-to-cart');
    if (!btn) return;   // click was on something else inside #catalog

    // [Action] Read data-id (productId) and quantity from the card
    const productId = btn.dataset.id;
    const card      = btn.closest('.product-card');
    const qtyInput  = card?.querySelector('.qty-input');
    const qty       = parseInt(qtyInput?.value ?? '1', 10);

    // [Decision] Quantity valid? (qty > 0)
    if (!qty || isNaN(qty) || qty <= 0) {
        // [Action] Show inline error message → END
        showInlineError(card, 'Please enter a valid quantity (minimum 1).');
        return;
    }

    // [Action] fetch() product info from ./data/json/products.json
    let product;
    try {
        const res = await fetch('data/json/products.json');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        product = data.products.find(p => String(p.id) === String(productId));
        if (!product) throw new Error(`Product ID "${productId}" not found in catalogue`);
    } catch (err) {
        console.error('[cart.js] fetch error:', err);
        showToast('Could not load product data', 'error');
        return;
    }

    // [Decision] In stock? (product.stock >= qty)
    if ((product.stock ?? 0) < qty) {
        // [Action] Show "Out of Stock" toast → END
        showToast('Out of Stock — not enough units available', 'warning');
        return;
    }

    const cartItem = {
        id:    product.id,
        name:  product.name,
        price: product.price,
        qty,
    };

    // [Decision] User logged in?
    if (isLoggedIn()) {
        // [Action] POST item to /api/cart (stub)
        await postToServer(cartItem);
        updateCart(cartItem);           // keep in-memory state in sync
    } else {
        // [Action] Save item to localStorage (key: "cart")
        addToLocalStorage(cartItem);    // also calls updateCart internally
    }

    // [Fork] parallel UI updates — three branches running concurrently
    await Promise.all([
        updateBadge(),                      // ├─ [Action] Update #cart-count badge
        showSuccessToast(product.name),     // ├─ [Action] Show "Added to cart" toast
        animateCartIcon(),                  // └─ [Action] Animate #cart-icon
    ]);
    // [Join] — all three UI updates resolved here

    // [End]
    // (Continue/Checkout decision is embedded in showSuccessToast buttons)
}
