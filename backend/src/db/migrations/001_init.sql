-- Initial schema setup

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enum Types

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE product_status AS ENUM ('active', 'out_of_stock');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE restock_priority AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE log_entity AS ENUM ('order', 'product', 'category', 'restock', 'auth');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sequences for auto-generating IDs

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000 INCREMENT 1;

-- Tables

-- users
CREATE TABLE IF NOT EXISTS users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT         NOT NULL,
  role          user_role    NOT NULL DEFAULT 'manager',
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) UNIQUE NOT NULL,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- products
CREATE TABLE IF NOT EXISTS products (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255)   NOT NULL,
  description   TEXT,
  category_id   UUID           REFERENCES categories(id) ON DELETE SET NULL,
  price         NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock         INTEGER        NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_threshold INTEGER        NOT NULL DEFAULT 5 CHECK (min_threshold >= 0),
  status        product_status NOT NULL DEFAULT 'active',
  created_by    UUID           REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- orders
CREATE TABLE IF NOT EXISTS orders (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number  VARCHAR(20)  UNIQUE NOT NULL DEFAULT ('ORD-' || nextval('order_number_seq')),
  customer_name VARCHAR(255) NOT NULL,
  total_price   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  status        order_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_by    UUID         REFERENCES users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- order_items
CREATE TABLE IF NOT EXISTS order_items (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id       UUID           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id     UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity       INTEGER        NOT NULL CHECK (quantity > 0),
  price_at_order NUMERIC(10, 2) NOT NULL CHECK (price_at_order >= 0),
  UNIQUE (order_id, product_id)
);

-- restock_queue
CREATE TABLE IF NOT EXISTS restock_queue (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID             NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  priority    restock_priority NOT NULL DEFAULT 'medium',
  added_at    TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  entity_type log_entity  NOT NULL,
  entity_id   UUID,
  message     TEXT        NOT NULL,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimization

CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status    ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock     ON products(stock);

CREATE INDEX IF NOT EXISTS idx_orders_status      ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_by  ON orders(created_by);

CREATE INDEX IF NOT EXISTS idx_order_items_order   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_entity     ON activity_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_restock_unresolved
  ON restock_queue(resolved_at)
  WHERE resolved_at IS NULL;

-- Triggers for updated_at timestamps

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
