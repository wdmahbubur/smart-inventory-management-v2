const { pool }         = require('../config/db');
const { orderService } = require('../services/order.service');

// Create a new order
const createOrder = async (req, res) => {
  const { customer_name, items, notes } = req.validated.body;

  const order = await orderService.createOrder({
    customerName: customer_name,
    items,
    notes,
    userId: req.user.id,
  });

  return res.status(201).json({ success: true, data: order });
};

// Fetch a list of orders with filters and pagination
const listOrders = async (req, res) => {
  const {
    status,
    from,
    to,
    search,
    page  = 1,
    limit = 20,
  } = req.query;

  const offset     = (parseInt(page) - 1) * parseInt(limit);
  const params     = [];
  const conditions = [];

  if (status) {
    params.push(status);
    conditions.push(`o.status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`o.created_at >= $${params.length}::timestamptz`);
  }
  if (to) {
    params.push(to);
    conditions.push(`o.created_at <= ($${params.length}::timestamptz + INTERVAL '1 day')`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(o.customer_name ILIKE $${params.length} OR o.order_number ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM orders o ${where}`,
    params
  );

  params.push(parseInt(limit), offset);

  const result = await pool.query(
    `SELECT
       o.*,
       u.name AS created_by_name,
       COALESCE(
         json_agg(
           json_build_object(
             'id',             oi.id,
             'product_id',     oi.product_id,
             'product_name',   p.name,
             'quantity',       oi.quantity,
             'price_at_order', oi.price_at_order,
             'line_total',     (oi.quantity * oi.price_at_order)
           )
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN users       u  ON o.created_by   = u.id
     LEFT JOIN order_items oi ON oi.order_id     = o.id
     LEFT JOIN products    p  ON oi.product_id   = p.id
     ${where}
     GROUP BY o.id, u.name
     ORDER BY o.created_at DESC
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

// Get order details by ID
const getOrder = async (req, res) => {
  const result = await pool.query(
    `SELECT
       o.*,
       u.name AS created_by_name,
       COALESCE(
         json_agg(
           json_build_object(
             'id',             oi.id,
             'product_id',     oi.product_id,
             'product_name',   p.name,
             'category_name',  c.name,
             'quantity',       oi.quantity,
             'price_at_order', oi.price_at_order,
             'line_total',     (oi.quantity * oi.price_at_order)
           )
         ) FILTER (WHERE oi.id IS NOT NULL),
         '[]'
       ) AS items
     FROM orders o
     LEFT JOIN users       u  ON o.created_by   = u.id
     LEFT JOIN order_items oi ON oi.order_id     = o.id
     LEFT JOIN products    p  ON oi.product_id   = p.id
     LEFT JOIN categories  c  ON p.category_id   = c.id
     WHERE o.id = $1
     GROUP BY o.id, u.name`,
    [req.params.id]
  );

  if (!result.rows[0]) {
    return res.status(404).json({ success: false, error: 'Order not found.' });
  }

  return res.json({ success: true, data: result.rows[0] });
};

// Update order status
const updateStatus = async (req, res) => {
  const { status } = req.validated.body;

  const order = await orderService.updateOrderStatus({
    orderId:   req.params.id,
    newStatus: status,
    userId:    req.user.id,
  });

  return res.json({ success: true, data: order });
};

module.exports = { createOrder, listOrders, getOrder, updateStatus };
