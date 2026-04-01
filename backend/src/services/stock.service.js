const { logService } = require('./log.service');

// Compute restock priority based on stock vs threshold ratio.
const computePriority = (stock, minThreshold) => {
  if (minThreshold === 0 || stock === 0) return 'high';
  const ratio = stock / minThreshold;
  if (ratio <= 0.3) return 'high';
  if (ratio <= 0.6) return 'medium';
  return 'low';
};

// Deduct stock and handle status/restock queue updates.
const deductStock = async ({ client, productId, quantity, userId }) => {
  const result = await client.query(
    `UPDATE products
     SET
       stock     = stock - $1,
       status    = CASE WHEN (stock - $1) <= 0 THEN 'out_of_stock'::product_status ELSE 'active'::product_status END,
       updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, stock, min_threshold, status`,
    [quantity, productId]
  );

  const product = result.rows[0];
  if (!product) throw Object.assign(new Error('Product not found during stock deduction.'), { statusCode: 404 });

  // Auto-add to restock queue if at or below threshold
  if (product.stock <= product.min_threshold) {
    const priority = computePriority(product.stock, product.min_threshold);

    await client.query(
      `INSERT INTO restock_queue (product_id, priority)
       VALUES ($1, $2)
       ON CONFLICT (product_id) DO UPDATE
         SET priority = EXCLUDED.priority, added_at = CASE
           WHEN restock_queue.resolved_at IS NOT NULL THEN NOW()
           ELSE restock_queue.added_at
         END, resolved_at = NULL`,
      [productId, priority]
    );

    await logService.writeWithClient({
      client,
      userId,
      actionType:  'RESTOCK_QUEUED',
      entityType:  'restock',
      entityId:    productId,
      message:     `"${product.name}" added to Restock Queue (${priority} priority) — ${product.stock} unit(s) remaining`,
    });
  }

  return product;
};

// Restore stock (e.g. on order cancellation) and resolve queue if above threshold.
const restoreStock = async ({ client, productId, quantity, userId }) => {
  const result = await client.query(
    `UPDATE products
     SET
       stock      = stock + $1,
       status     = 'active'::product_status,
       updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, stock, min_threshold`,
    [quantity, productId]
  );

  const product = result.rows[0];
  if (!product) return;

  // Resolve queue if now above threshold
  if (product.stock > product.min_threshold) {
    await client.query(
      `UPDATE restock_queue
       SET resolved_at = NOW()
       WHERE product_id = $1 AND resolved_at IS NULL`,
      [productId]
    );
  }

  await logService.writeWithClient({
    client,
    userId,
    actionType:  'STOCK_RESTORED',
    entityType:  'product',
    entityId:    productId,
    message:     `Stock restored for "${product.name}" (+${quantity} units → now ${product.stock})`,
  });

  return product;
};

// Manual restock from the UI.
const manualRestock = async ({ client, productId, addQuantity, userId }) => {
  const result = await client.query(
    `UPDATE products
     SET
       stock      = stock + $1,
       status     = 'active'::product_status,
       updated_at = NOW()
     WHERE id = $2
     RETURNING id, name, stock, min_threshold`,
    [addQuantity, productId]
  );

  const product = result.rows[0];
  if (!product) throw Object.assign(new Error('Product not found.'), { statusCode: 404 });

  // Resolve queue entry if above threshold
  if (product.stock > product.min_threshold) {
    await client.query(
      `UPDATE restock_queue
       SET resolved_at = NOW()
       WHERE product_id = $1 AND resolved_at IS NULL`,
      [productId]
    );
  } else {
    // Still below threshold — update priority
    const priority = computePriority(product.stock, product.min_threshold);
    await client.query(
      `UPDATE restock_queue
       SET priority = $1
       WHERE product_id = $2 AND resolved_at IS NULL`,
      [priority, productId]
    );
  }

  await logService.writeWithClient({
    client,
    userId,
    actionType:  'STOCK_UPDATED',
    entityType:  'product',
    entityId:    productId,
    message:     `Stock manually updated for "${product.name}" (+${addQuantity} units → now ${product.stock})`,
  });

  return product;
};

const stockService = { deductStock, restoreStock, manualRestock, computePriority };
module.exports = { stockService };
