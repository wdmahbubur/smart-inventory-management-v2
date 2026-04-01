-- Demo seed data for development
-- Default password: Test@1234

-- Demo Admin User
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Admin User',
  'admin@demo.com',
  '$2a$12$wg6Q2yVAFXQ7ltEI7E1AxOwzV/zlGsvg5fbic47T1WFgZsSk1rpDG',
  'admin'
) ON CONFLICT (id) DO NOTHING;

-- Demo Manager User
INSERT INTO users (id, name, email, password_hash, role)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Manager User',
  'manager@demo.com',
  '$2a$12$wg6Q2yVAFXQ7ltEI7E1AxOwzV/zlGsvg5fbic47T1WFgZsSk1rpDG',
  'manager'
) ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO categories (id, name, created_by) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'Electronics', 'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000002', 'Clothing',    'aaaaaaaa-0000-0000-0000-000000000001'),
  ('cccccccc-0000-0000-0000-000000000003', 'Grocery',     'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO products (name, description, category_id, price, stock, min_threshold, status, created_by) VALUES
  (
    'iPhone 13',
    'Apple iPhone 13 with A15 Bionic chip, 6.1-inch Super Retina XDR display.',
    'cccccccc-0000-0000-0000-000000000001', 999.99, 3, 10, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Samsung Galaxy S22',
    'Samsung Galaxy S22 with Snapdragon 8 Gen 1, 6.1-inch Dynamic AMOLED display.',
    'cccccccc-0000-0000-0000-000000000001', 799.99, 15, 10, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Wireless Headphones',
    'Premium noise-cancelling wireless headphones with 30-hour battery life.',
    'cccccccc-0000-0000-0000-000000000001', 149.99, 8, 10, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'T-Shirt Basic',
    'High-quality 100% cotton basic t-shirt available in multiple colors.',
    'cccccccc-0000-0000-0000-000000000002', 19.99, 50, 20, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Denim Jeans',
    'Classic slim-fit denim jeans with stretch fabric for comfort.',
    'cccccccc-0000-0000-0000-000000000002', 49.99, 2, 15, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Running Shoes',
    'Lightweight and breathable running shoes with cushioned sole.',
    'cccccccc-0000-0000-0000-000000000002', 89.99, 0, 10, 'out_of_stock',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Rice 5kg',
    'Premium long-grain white rice, ideal for everyday cooking.',
    'cccccccc-0000-0000-0000-000000000003', 8.99, 100, 30, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  ),
  (
    'Olive Oil 1L',
    'Extra virgin cold-pressed olive oil from Mediterranean orchards.',
    'cccccccc-0000-0000-0000-000000000003', 12.99, 4, 20, 'active',
    'aaaaaaaa-0000-0000-0000-000000000001'
  )
ON CONFLICT (id) DO NOTHING;
