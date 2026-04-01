# 📦 Smart Inventory & Order Management System

A full-stack web application for managing products, orders, stock levels, and a restock queue.

---

## ✨ Features

### 📊 Dashboard
- Real-time KPIs: orders today, daily revenue, pending orders, and low-stock alerts
- Recent activity feed with live status indicators
- Low-stock product table with severity-based colour coding

### 🏷️ Product Management
- Create, edit, and delete products with name, description, category, price, stock, and minimum threshold
- Status automatically flips to `out_of_stock` when stock hits zero

### 🛒 Order Management
- Create orders with multiple line items; stock is deducted atomically within a transaction
- Concurrency-safe stock locking (`SELECT … FOR UPDATE`) prevents race conditions
- Enforced status state machine: `pending → confirmed → shipped → delivered` (cancellation allowed at `pending`/`confirmed`/`shipped`)
- Stock is automatically **restored** when a confirmed or shipped order is cancelled
- Filter orders by **status**, **customer/order number search**, and **date range** (From / To)
- Paginated order list with per-order item detail modal

### 🔄 Restock Queue
- Products below their `min_threshold` are automatically queued for restock
- Priority computed dynamically: **High** (0–30% of threshold), **Medium** (31–60%), **Low** (61–99%)
- One-click manual restock; queue entry resolved automatically when threshold is cleared


### 🔐 Authentication & Access Control
- JWT-based auth (7-day expiry)
- Role system: `admin` and `manager`
- Protected routes — all API endpoints require a valid token
- Activity log tracks every meaningful action (order created, stock updated, restock queued, etc.)

---

## 🏗️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| Database | PostgreSQL (via Supabase) |
| ORM/Query | Raw SQL with `pg` |
| Auth | JWT + bcryptjs |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Data Fetching | TanStack React Query v5 |
| HTTP Client | Axios |
| Charts | Recharts |
| Date Utils | date-fns |

---

## 🗂️ Project Structure

```
Elite Pool Task/
├── backend/
│   ├── src/
│   │   ├── config/         # DB pool & helper (withTransaction)
│   │   ├── controllers/    # Route handlers
│   │   ├── db/
│   │   │   ├── migrations/ # 001_init.sql — full schema
│   │   │   └── seeds/      # demo.sql — demo users & products
│   │   ├── middleware/     # auth, validation, error handler
│   │   ├── routes/         # Express routers
│   │   ├── schemas/        # Zod request schemas
│   │   ├── services/       # Business logic (order, stock, log)
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/            # Axios instance & API functions
    │   ├── components/ui/  # Shared UI components
    │   ├── context/        # AuthContext (JWT state)
    │   ├── hooks/          # React Query hooks per resource
    │   ├── pages/          # Dashboard, Products, Orders, RestockQueue, etc.
    │   └── utils/          # formatCurrency, formatDateTime, status configs
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js ≥ 18
- pnpm (`npm install -g pnpm`)
- PostgreSQL database (or a Supabase project)

---

### 1. Clone the repository

```bash
git clone <repository-url>
cd "Elite Pool Task"
```

---

### 2. Backend setup

```bash
cd backend
pnpm install
```

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

Run the database migration to create all tables, enums, indexes, and triggers:

```bash
pnpm migrate
```

Seed the database with demo users and products:

```bash
pnpm seed
```

Start the development server:

```bash
pnpm dev
```

The API will be available at **http://localhost:5000**.

---

### 3. Frontend setup

```bash
cd ../frontend
pnpm install
pnpm dev
```

The app will be available at **http://localhost:5173**.

> The Vite dev server proxies `/api/*` requests to `http://localhost:5000` automatically.

---

## 👤 Demo Credentials

After seeding the database, the following accounts are available:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.com` | `demo1234` |
| Manager | `manager@demo.com` | `demo1234` |

---

## 📡 API Reference

All protected endpoints require the header:
```
Authorization: Bearer <jwt_token>
```

### Auth
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Login, returns JWT |
| `GET` | `/api/auth/me` | Get current user |

### Products
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List products (`?search`, `?category_id`, `?status`, `?low_stock`, `?page`, `?limit`) |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `DELETE` | `/api/products/:id` | Delete product |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List orders (`?status`, `?search`, `?from`, `?to`, `?page`, `?limit`) |
| `GET` | `/api/orders/:id` | Get single order with items |
| `POST` | `/api/orders` | Create order (deducts stock atomically) |
| `PATCH` | `/api/orders/:id/status` | Update order status |

### Restock Queue
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/restock` | List unresolved restock entries |
| `POST` | `/api/restock/:id/restock` | Manually restock a product |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard` | KPIs, low-stock list, recent activity |

### Categories & Logs
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/categories` | List all categories |
| `POST` | `/api/categories` | Create category |
| `GET` | `/api/logs` | Paginated activity log |

---

## 🗄️ Database Schema

```
users ──────────────────────────────────────────────────────┐
  id, name, email, password_hash, role, created_at          │
                                                             │
categories ─────────────────────────────────────────────┐   │
  id, name, created_by → users, created_at              │   │
                                                         │   │
products ───────────────────────────────────────────────┘   │
  id, name, description, category_id, price,                │
  stock, min_threshold, status (enum), created_by           │
       │                                                     │
       ├──── restock_queue                                   │
       │       id, product_id, priority (enum),             │
       │       added_at, resolved_at                         │
       │                                                     │
orders ─────────────────────────────────────────────────────┘
  id, order_number, customer_name, total_price,
  status (enum), notes, created_by
       │
       └──── order_items
               id, order_id, product_id,
               quantity, price_at_order

activity_logs
  id, user_id, action_type, entity_type (enum),
  entity_id, message, meta (JSONB), created_at
```

**Enum types:** `user_role`, `product_status`, `order_status`, `restock_priority`, `log_entity`

---

## 🧩 Key Design Decisions

- **Atomic transactions** — order creation and stock deduction happen inside a single `withTransaction` wrapper; any failure rolls back everything
- **Row-level locking** — `SELECT … FOR UPDATE` on product rows prevents overselling under concurrent requests
- **Enum-safe queries** — all PostgreSQL enum columns use explicit `::enum_type` casts in UPDATE statements
- **Automatic restock queuing** — stock deduction triggers a queue upsert with dynamic priority; no manual intervention needed
- **Immutable price history** — `price_at_order` is stored on each order item, so repricing a product never corrupts historical order totals
