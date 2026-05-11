# Stroyka Tools Store

A full-stack e-commerce REST API for a hardware and tools store, built with Node.js, Express, and SQLite. Supports user authentication, product browsing, shopping cart management, order placement, and payment recording.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 4 |
| Database | SQLite 3 (via `sqlite3` driver) |
| Auth | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcrypt` (salt rounds configurable) |
| Security headers | `helmet` |
| Rate limiting | `express-rate-limit` |
| Config | `dotenv` |

---

## Architecture Overview

Requests flow through a layered architecture that separates HTTP concerns from business logic and data access:

```
Client (Browser)
     │
     ▼
server.js           ← loads .env, mounts routers, starts HTTP server
     │
     ▼
routes/             ← thin Express routers — only mount handlers
     │
     ▼
controllers/        ← extract req.body / req.query, call service, return res.json()
     │
     ▼
services/           ← business logic only (filtering, calculations, rules)
     │
     ▼
database.js         ← SQLite connection, schema creation, run/getOne/getAll helpers
```

**Auth routes** (`login.js`, `register.js`) currently combine the controller and service layers
and are candidates for the full Controller → Service → Repository split.

---

## How to Run Locally

### Prerequisites

- Node.js 20+
- npm 10+
- Git

### Steps

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Web-Tech-Template

# 2. Install backend dependencies
cd backend
npm install

# 3. Configure environment variables
cp .env.example .env
# Open .env and set JWT_SECRET to a strong random value:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# 4. Start the server
npm start
# or for auto-reload during development:
npm run dev
```

The API will be available at `http://localhost:3001`.

---

## API Endpoints

| Method | Endpoint | Description | Auth required |
|---|---|---|---|
| `GET` | `/api/products` | List all products | No |
| `GET` | `/api/products?category=hat` | Filter products by category | No |
| `POST` | `/api/register` | Register a new user account | No |
| `POST` | `/api/login` | Authenticate and receive a JWT | No |
| `POST` | `/api/checkout` | Submit cart + payment (legacy JSON flow) | No |
| `POST` | `/api/orders` | Place an order (SQLite-backed) | No |
| `POST` | `/api/cart` | Add an item to the cart | No |
| `GET` | `/api/cart/:userId` | Get all cart items for a user | No |
| `DELETE` | `/api/cart/:id` | Remove a cart item by ID | No |
| `POST` | `/api/payment` | Record a payment for an order | No |
| `GET` | `/api/payment/:orderId` | Get payment status for an order | No |

### Request / Response examples

**POST `/api/login`**
```json
// Request body
{ "email": "user@example.com", "password": "Secret@123" }

// 200 OK
{ "token": "<jwt>", "name": "Jane", "email": "user@example.com" }
```

**POST `/api/orders`**
```json
// Request body
{
  "user_id": 1,
  "items": [{ "product_id": 3, "quantity": 2 }],
  "total_price": 149.99
}

// 201 Created
{ "order_id": 7, "status": "pending", "order_date": "2026-05-11 10:00:00" }
```

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set each value before starting the server.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment (`development` / `production`) |
| `PORT` | No | `3001` | TCP port the Express server listens on |
| `JWT_SECRET` | **Yes** | — | Secret used to sign and verify JWTs. Min 32 characters. Never commit this value. |
| `JWT_EXPIRES_IN` | No | `1h` | JWT lifetime — any value accepted by `jsonwebtoken` (e.g. `2h`, `7d`) |
| `BCRYPT_SALT_ROUNDS` | No | `10` | bcrypt work factor. OWASP minimum is 10; use 12 for production. |
| `DB_PATH` | No | `backend/store.db` | Absolute path to the SQLite file. Leave blank to use the default. |

### Generating a strong `JWT_SECRET`

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Security Notes

- `JWT_SECRET` has no hard-coded fallback. The server will refuse to start if this variable is missing or still set to the placeholder value.
- All SQL queries use parameterised statements (`?`) — no raw string interpolation.
- Passwords are never stored in plain text; only bcrypt hashes are persisted.
- `helmet` sets secure HTTP response headers on every request.
- `express-rate-limit` is applied to the orders endpoint (100 requests / 15 min per IP).
- `store.db` and `.env` are excluded from version control via `.gitignore`.

---

## Project Structure

```
Web-Tech-Template/
├── README.md
├── .gitignore
└── backend/
    ├── server.js               ← entry point, middleware, router mounts
    ├── database.js             ← SQLite connection + schema + query helpers
    ├── .env                    ← secrets (gitignored — never commit)
    ├── .env.example            ← safe template to commit
    ├── .gitignore              ← backend-specific ignores
    ├── package.json
    ├── routes/
    │   ├── login.js            ← POST /api/login
    │   ├── register.js         ← POST /api/register
    │   ├── products.js         ← GET  /api/products
    │   ├── checkout.js         ← POST /api/checkout (legacy JSON)
    │   ├── orders.route.js     ← POST /api/orders
    │   ├── cart.route.js       ← POST/GET/DELETE /api/cart
    │   └── payment.route.js    ← POST/GET /api/payment
    ├── controllers/
    │   └── productsController.js
    ├── services/
    │   └── productsService.js
    └── data/
        ├── products.json       ← product catalogue (read-only seed)
        ├── auth_user.json      ← flat-file user store (login/register)
        └── orders.json         ← legacy order store (checkout route)
```

---

## Author

**Kitichet Phonsut**  
Chiang Mai University — Digital Industry Integration
