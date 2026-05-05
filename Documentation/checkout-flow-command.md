# /checkout-flow — Checkout Flow Implementation Command
# Save this file at: .claude/commands/checkout-flow.md
# Then use it in Claude Code as: /checkout-flow

This slash command implements, validates, and summarizes the full checkout POST route for the Stroyka Tools Store backend, following the **960121 Session 03 – The Checkout Flow** lecture requirements.

---

## STEP 1 — WRITE THE CODE

Implement the following files exactly as specified:

### A. `backend/routes/checkout.js`

Write an Express POST route for `/api/checkout` with this logic:

```
POST /api/checkout
Body (JSON): {
  cartItems:  [ { productId, name, price, quantity } ],   // required, non-empty
  customer: {
    firstName, lastName, email,                           // email validated by regex
    address, city, country
  },
  payment: {
    cardNumber                                            // must be exactly 16 digits
  }
}
```

**Critical Path (Decision Tree from UML):**
1. **Cart Check** – Is `cartItems` empty or missing? → respond `400` with `{ error: "Cart is empty" }`. Do NOT clear the cart on the frontend.
2. **Email Validation** – Use RegEx `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` on `customer.email`. If invalid → respond `400` with `{ field: "email", error: "Invalid email format" }`.
3. **Credit Card Validation** – Use RegEx `/^\d{16}$/` on `payment.cardNumber` (digits only, exactly 16). If invalid → respond `400` with `{ field: "cardNumber", error: "Card number must be 16 digits" }`.
4. **Server-Side Price Recalculation** – Re-calculate `total` from `cartItems` on the server. Do NOT trust the client total.
5. **Save Order (try…catch)** – Wrap the save in a `try { … } catch (err) { … }` block. If it fails → respond `400` with `{ error: "Order could not be saved", details: err.message }`. Do NOT clear the cart.
6. **Success** – Respond `201` with `{ success: true, orderId, total }`.

Include `express.json()` awareness: the route file just exports the router; body parsing is handled globally in `server.js`.

Include XSS sanitization: strip `<` and `>` characters from all string fields before saving.

### B. `backend/data/orders.json`

Initialize as an empty array `[]`.

### C. `backend/server.js` (update only)

Mount the checkout router:
```js
const checkoutRouter = require('./routes/checkout');
app.use('/api', checkoutRouter);
```
Add a console log line: `[Server] Checkout: POST http://localhost:${PORT}/api/checkout`

### D. `checkout.html` (update only — add script block before `</body>`)

Add a `<script>` block that:
- Intercepts the "Place Order" button click (prevent default form submit)
- Reads values from the existing form fields by their IDs
- Builds a `cartItems` array (use localStorage key `cart` if present, else a mock item)
- Sends `fetch('http://localhost:3001/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) })`
- On **success (201)**: shows an alert with the `orderId`, then clears `localStorage.removeItem('cart')`
- On **error (400)**: shows an alert with the specific error message and does **NOT** clear the cart

---

## STEP 2 — RECHECK ALL WORK

After writing all files, perform these verification checks and report each as PASS or FAIL:

| # | Check | Expected |
|---|-------|----------|
| 1 | `express.json()` is in `server.js` BEFORE routes | PASS |
| 2 | checkout route rejects empty cart with 400 | PASS |
| 3 | email validated with RegEx | PASS |
| 4 | cardNumber validated as exactly 16 digits | PASS |
| 5 | total is recalculated server-side | PASS |
| 6 | try…catch wraps the save operation | PASS |
| 7 | on save failure, cart is NOT cleared | PASS |
| 8 | success returns 201 with orderId | PASS |
| 9 | XSS sanitization applied before save | PASS |
| 10 | frontend fetch sends Content-Type: application/json | PASS |
| 11 | checkout route mounted in server.js | PASS |
| 12 | orders.json initialized as empty array | PASS |

---

## STEP 3 — SUMMARY TABLE

After rechecking, output a summary table:

| File | Status | Key Feature Implemented |
|------|--------|------------------------|
| `backend/routes/checkout.js` | Created | Cart check, Email regex, Card regex, Price recalc, try-catch, XSS sanitize |
| `backend/data/orders.json` | Created | Empty array initialized |
| `backend/server.js` | Updated | Checkout router mounted after express.json() |
| `checkout.html` | Updated | fetch() POST, cart clear on success, error display |

**ACID Principle Coverage:**
| Property | Implementation |
|----------|----------------|
| Atomicity | try-catch ensures all-or-nothing; cart only clears after 201 |
| Consistency | Server recalculates total; RegEx validates data integrity |
| Isolation | Each order gets a unique orderId (timestamp + random) |
| Durability | Order written to orders.json before success response |
