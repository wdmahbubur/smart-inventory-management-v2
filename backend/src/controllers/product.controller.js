const { pool, withTransaction } = require('../config/db');
const { logService }            = require('../services/log.service');
const { stockService }          = require('../services/stock.service');

// List all products with search and filtering
const listProducts = async (req, res) => {
  const {
    category,
    status,
    search,
    low_stock,
    min_price,
    max_price,
    page  = 1,
    limit = 20,
  } = req.query;

  const offset     = (parseInt(page) - 1) * parseInt(limit);
  const params     = [];
  const conditions = [];

  if (category) {
    params.push(category);
    conditions.push(`p.category_id = $${params.length}`);
  }
  if (status) {
    params.push(status);
    conditions.push(`p.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`p.name ILIKE $${params.length}`);
  }
  if (low_stock === 'true') {
    conditions.push(`p.stock <= p.min_threshold`);
  }
  if (min_price) {
    params.push(parseFloat(min_price));
    conditions.push(`p.price >= $${params.length}`);
  }
  if (max_price) {
    params.push(parseFloat(max_price));
    conditions.push(`p.price <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query (same conditions, no pagination)
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products p ${where}`,
    params
  );

  // Data query
  params.push(parseInt(limit), offset);
  const result = await pool.query(
    `SELECT
       p.*,
       c.name AS category_name,
       CASE WHEN p.stock <= p.min_threshold THEN true ELSE false END AS is_low_stock,
       CASE WHEN rq.id IS NOT NULL AND rq.resolved_at IS NULL THEN true ELSE false END AS in_restock_queue,
       rq.priority AS restock_priority
     FROM products p
     LEFT JOIN categories c    ON p.category_id   = c.id
     LEFT JOIN restock_queue rq ON rq.product_id  = p.id AND rq.resolved_at IS NULL
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({
    success: true,
    data:    result.rows,
    meta: {
      total: parseInt(countResult.rows[0].count),
      page:  parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
    },
  });
};

// Get a single product by ID
const getProduct = async (req, res) => {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name,
       CASE WHEN p.stock <= p.min_threshold THEN true ELSE false END AS is_low_stock
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Product not found.' });
  return res.json({ success: true, data: result.rows[0] });
};

// Create a new product and monitor stock levels
const createProduct = async (req, res) => {
  const { name, description, category_id, price, stock, min_threshold } = req.validated.body;

  // Auto-set status based on initial stock
  const status = stock === 0 ? 'out_of_stock' : 'active';

  const result = await pool.query(
    `INSERT INTO products (name, description, category_id, price, stock, min_threshold, status, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, description || null, category_id, price, stock, min_threshold, status, req.user.id]
  );

  const product = result.rows[0];

  // If initial stock is below threshold, auto-queue for restock
  if (stock <= min_threshold && stock >= 0) {
    const priority = stockService.computePriority(stock, min_threshold);
    await pool.query(
      `INSERT INTO restock_queue (product_id, priority) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [product.id, priority]
    );
  }

  await logService.write({
    userId:     req.user.id,
    actionType: 'PRODUCT_CREATED',
    entityType: 'product',
    entityId:   product.id,
    message:    `Product "${name}" added (stock: ${stock})`,
  });

  return res.status(201).json({ success: true, data: product });
};

// Update an existing product and its restock status
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, price, stock, min_threshold } = req.validated.body;

  const status = stock === 0 ? 'out_of_stock' : 'active';

  const result = await pool.query(
    `UPDATE products
     SET name=$1, description=$2, category_id=$3, price=$4,
         stock=$5, min_threshold=$6, status=$7, updated_at=NOW()
     WHERE id=$8
     RETURNING *`,
    [name, description || null, category_id, price, stock, min_threshold, status, id]
  );

  if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Product not found.' });

  const product = result.rows[0];

  // Update restock queue status
  if (stock <= min_threshold) {
    const priority = stockService.computePriority(stock, min_threshold);
    await pool.query(
      `INSERT INTO restock_queue (product_id, priority)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE SET priority = EXCLUDED.priority, resolved_at = NULL`,
      [product.id, priority]
    );
  } else {
    // Above threshold — resolve any open queue entry
    await pool.query(
      `UPDATE restock_queue SET resolved_at = NOW()
       WHERE product_id = $1 AND resolved_at IS NULL`,
      [product.id]
    );
  }

  await logService.write({
    userId:     req.user.id,
    actionType: 'PRODUCT_UPDATED',
    entityType: 'product',
    entityId:   id,
    message:    `Product "${name}" updated (stock: ${stock})`,
  });

  return res.json({ success: true, data: product });
};

// Delete a product (only if it has no order history)
const deleteProduct = async (req, res) => {
  const { id } = req.params;

  // Guard: cannot delete products with existing order history
  const linked = await pool.query(
    'SELECT id FROM order_items WHERE product_id = $1 LIMIT 1',
    [id]
  );
  if (linked.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete a product that has existing orders.',
    });
  }

  const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING name', [id]);
  if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Product not found.' });

  await logService.write({
    userId:     req.user.id,
    actionType: 'PRODUCT_DELETED',
    entityType: 'product',
    entityId:   id,
    message:    `Product "${result.rows[0].name}" deleted`,
  });

  return res.json({ success: true, data: null });
};

// Quickly add stock to a product from the list
const quickRestock = async (req, res) => {
  const { id } = req.params;
  const { add_quantity } = req.validated.body;

  const product = await withTransaction(async (client) => {
    return stockService.manualRestock({
      client,
      productId:   id,
      addQuantity: add_quantity,
      userId:      req.user.id,
    });
  });

  return res.json({
    success: true,
    data:    product,
    message: `Added ${add_quantity} units to "${product.name}". New stock: ${product.stock}.`,
  });
};

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, quickRestock };
