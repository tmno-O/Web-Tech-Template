# Stroyka Tools Store — Backend API

REST API backend for the Stroyka Tools Store frontend.  
Built with **Node.js + Express** following the ROUTE → CONTROLLER → SERVICE pattern.

---

## Installation

```bash
cd backend
npm install
```

---

## Running the server

**Development mode** (auto-restarts on file changes via nodemon):
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server starts at **http://localhost:3000**

---

## API Endpoints

### GET /api/products

Returns all products.

```bash
curl "http://localhost:3000/api/products"
```

### GET /api/products?category=hat

Returns only products in the specified category.

```bash
curl "http://localhost:3000/api/products?category=hat"
```

**Allowed category values:**
`hat`, `drill`, `screwdriver`, `grinder`, `planer`, `power-tool`, `jigsaw`, `wrench`, `instrument`, `jackhammer`, `spray-gun`, `saw`

---

## Expected Responses

**Success — `200 OK`** (`?category=hat`):
```json
[
  {
    "id": 1,
    "name": "Safety Hard Hat Brandix SH-100 Class E",
    "price": 29.99,
    "image": "images/products/product-1.jpg",
    "category": "hat"
  },
  {
    "id": 2,
    "name": "Construction Bump Cap Makita BC-200 Vented",
    "price": 19.99,
    "image": "images/products/product-2.jpg",
    "category": "hat"
  },
  {
    "id": 3,
    "name": "Full-Brim Hard Hat DeWalt DPG11 ANSI Z89.1",
    "price": 34.99,
    "image": "images/products/product-3.jpg",
    "category": "hat"
  }
]
```

**Invalid category — `400 Bad Request`**:
```bash
curl "http://localhost:3000/api/products?category=unknown"
```
```json
{
  "success": false,
  "message": "Invalid category \"unknown\". Allowed values: hat, drill, screwdriver, ..."
}
```

---

## Architecture

```
/backend
  ├── server.js                   Entry point — Express setup, CORS, port 3000
  ├── package.json
  ├── /routes
  │   └── products.js             URL definitions only — GET /
  ├── /controllers
  │   └── productsController.js   Handles req/res, calls service
  ├── /services
  │   └── productsService.js      Business logic — reads JSON, filters by category
  ├── /middleware
  │   └── validateQuery.js        Gatekeeper — validates ?category query param
  └── /data
      └── products.json           Data source (15 products, 3 in "hat" category)
```
