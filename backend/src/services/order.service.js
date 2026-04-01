const { withTransaction } = require('../config/db');
const { stockService }   = require('./stock.service');
const { logService }     = require('./log.service');

// Create an order atomically.
// Deducts stock, writes activity log, and handles rollbacks.
const createOrder = async ({ customerName, items, notes, userId }) => {
  return withTransaction(async (client) => {

    // Duplicate product check
    const productIds = items.map((i) => i.product_id);
    const uniqueIds  = new Set(productIds);

    if (uniqueIds.size !== productIds.length) {
      throw Object.assign(
        new Error('Duplicate product detected — each product can only appear once per order.'),
        { statusCode: 400, conflictType: 'DUPLICATE_PRODUCT' }
      );
    }

    // Lock & fetch product rows
    const productResult = await client.query(
      `SELECT id, name, stock, status, price, min_threshold
       FROM products
       WHERE id = ANY($1::uuid[])
       FOR UPDATE`,
      [productIds]
    );

    const productMap = Object.fromEntries(productResult.rows.map((p) => [p.id, p]));

    // Validate each item
    const stockErrors = [];

    for (const item of items) {
      const product = productMap[item.product_id];

      if (!product) {
        throw Object.assign(
          new Error(`Product not found: ${item.product_id}`),
          { statusCode: 404 }
        );
      }

      // Inactive product check
      if (product.status === 'out_of_stock') {
        throw Object.assign(
          new Error(`Product "${product.name}" is currently unavailable (Out of Stock).`),
          { statusCode: 409, conflictType: 'INACTIVE_PRODUCT' }
        );
      }

      // Insufficient stock check
      if (item.quantity > product.stock) {
        stockErrors.push({
          product_id:   item.product_id,
          product_name: product.name,
          requested:    item.quantity,
          available:    product.stock,
          message:      `Only ${product.stock} unit(s) available for "${product.name}".`,
        });
      }
    }

    if (stockErrors.length > 0) {
      throw Object.assign(
        new Error('Insufficient stock for one or more products.'),
        { statusCode: 409, conflictType: 'INSUFFICIENT_STOCK', details: stockErrors }
      );
    }

    // Calculate total price
    let totalPrice = 0;
    const enrichedItems = items.map((item) => {
      const product   = productMap[item.product_id];
      const lineTotal = parseFloat(product.price) * item.quantity;
      totalPrice += lineTotal;
      return {
        product_id:    item.product_id,
        quantity:      item.quantity,
        price_at_order: parseFloat(product.price),
      };
    });

    // Insert order
    const orderResult = await client.query(
      `INSERT INTO orders (customer_name, total_price, status, notes, created_by)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING *`,
      [customerName, totalPrice.toFixed(2), notes || null, userId]
    );
    const order = orderResult.rows[0];

    // Insert order items
    for (const item of enrichedItems) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_order)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.product_id, item.quantity, item.price_at_order]
      );
    }

    // Deduct stock for each item
    for (const item of enrichedItems) {
      await stockService.deductStock({
        client,
        productId: item.product_id,
        quantity:  item.quantity,
        userId,
      });
    }

    // Activity log
    await logService.writeWithClient({
      client,
      userId,
      actionType:  'ORDER_CREATED',
      entityType:  'order',
      entityId:    order.id,
      message:     `Order ${order.order_number} created for ${customerName} — ${items.length} item(s), total $${totalPrice.toFixed(2)}`,
    });

    return order;
  });
};

// Update order status and handle stock restoration if cancelled.
const updateOrderStatus = async ({ orderId, newStatus, userId }) => {
  return withTransaction(async (client) => {

    // Lock the order row first (FOR UPDATE cannot be combined with GROUP BY)
    const lockResult = await client.query(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [orderId]
    );

    const order = lockResult.rows[0];
    if (!order) {
      throw Object.assign(new Error('Order not found.'), { statusCode: 404 });
    }

    // Fetch associated items separately
    const itemsResult = await client.query(
      `SELECT product_id, quantity FROM order_items WHERE order_id = $1`,
      [orderId]
    );
    order.items = itemsResult.rows;

    // Transition map
    const validTransitions = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['shipped',   'cancelled'],
      shipped:   ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[order.status].includes(newStatus)) {
      throw Object.assign(
        new Error(`Cannot transition order from "${order.status}" to "${newStatus}".`),
        { statusCode: 400, conflictType: 'INVALID_TRANSITION' }
      );
    }

    // Restore stock when cancelling a confirmed or shipped order
    if (newStatus === 'cancelled' && ['confirmed', 'shipped'].includes(order.status)) {
      for (const item of order.items) {
        await stockService.restoreStock({
          client,
          productId: item.product_id,
          quantity:  item.quantity,
          userId,
        });
      }
    }

    // Update status
    const updated = await client.query(
      `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [newStatus, orderId]
    );

    await logService.writeWithClient({
      client,
      userId,
      actionType:  'ORDER_STATUS_UPDATED',
      entityType:  'order',
      entityId:    orderId,
      message:     `Order ${order.order_number} status changed: "${order.status}" → "${newStatus}"`,
    });

    return updated.rows[0];
  });
};

const orderService = { createOrder, updateOrderStatus };
module.exports = { orderService };
