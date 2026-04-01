const { pool, withTransaction } = require('../config/db');
const { stockService }          = require('../services/stock.service');
const { logService }            = require('../services/log.service');

// List products waiting for restock
const listQueue = async (req, res) => {
  const result = await pool.query(`
    SELECT
      rq.id,
      rq.product_id,
      rq.priority,
      rq.added_at,
      p.name          AS product_name,
      p.stock         AS current_stock,
      p.min_threshold,
      p.price,
      p.status        AS product_status,
      c.name          AS category_name,
      CASE
        WHEN p.min_threshold = 0 THEN 0
        ELSE ROUND((p.stock::DECIMAL / p.min_threshold) * 100)
      END AS stock_pct
    FROM restock_queue rq
    JOIN products    p ON rq.product_id  = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE rq.resolved_at IS NULL
    ORDER BY p.stock ASC, rq.added_at ASC
  `);

  return res.json({ success: true, data: result.rows });
};

// Get history of restocks for audit
const getHistory = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const result = await pool.query(
    `SELECT
       rq.*,
       p.name       AS product_name,
       c.name       AS category_name
     FROM restock_queue rq
     JOIN products    p ON rq.product_id  = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE rq.resolved_at IS NOT NULL
     ORDER BY rq.resolved_at DESC
     LIMIT $1 OFFSET $2`,
    [parseInt(limit), offset]
  );

  return res.json({ success: true, data: result.rows });
};

// Process a manual restock for a queued item
const resolveRestock = async (req, res) => {
  const { id }          = req.params;
  const { add_quantity } = req.validated.body;

  // Fetch queue entry + product info
  const queueResult = await pool.query(
    `SELECT rq.*, p.name AS product_name, p.stock AS current_stock
     FROM restock_queue rq
     JOIN products p ON rq.product_id = p.id
     WHERE rq.id = $1 AND rq.resolved_at IS NULL`,
    [id]
  );

  if (!queueResult.rows[0]) {
    return res.status(404).json({
      success: false,
      error: 'Restock queue entry not found or already resolved.',
    });
  }

  const entry = queueResult.rows[0];

  const updatedProduct = await withTransaction(async (client) => {
    return stockService.manualRestock({
      client,
      productId:   entry.product_id,
      addQuantity: add_quantity,
      userId:      req.user.id,
    });
  });

  return res.json({
    success: true,
    data: {
      product: updatedProduct,
      message: `Restocked "${entry.product_name}" with +${add_quantity} units. New stock: ${updatedProduct.stock}.`,
    },
  });
};

// Remove an item from the queue without adding stock
const dismissFromQueue = async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `UPDATE restock_queue
     SET resolved_at = NOW()
     WHERE id = $1 AND resolved_at IS NULL
     RETURNING *, (SELECT name FROM products WHERE id = product_id) AS product_name`,
    [id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ success: false, error: 'Queue entry not found or already resolved.' });
  }

  await logService.write({
    userId:     req.user.id,
    actionType: 'RESTOCK_DISMISSED',
    entityType: 'restock',
    entityId:   result.rows[0].product_id,
    message:    `Restock queue entry dismissed for "${result.rows[0].product_name}"`,
  });

  return res.json({ success: true, data: null });
};

module.exports = { listQueue, getHistory, resolveRestock, dismissFromQueue };
