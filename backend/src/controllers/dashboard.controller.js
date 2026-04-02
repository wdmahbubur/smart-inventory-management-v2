const { pool } = require('../config/db');

// Get dashboard KPI summary and charts
const getSummary = async (req, res) => {
  // Start of today in UTC
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const [
    ordersTodayResult,
    ordersByStatusResult,
    productSummaryResult,
    revenueTodayResult,
    totalProductsResult,
    revenueChartResult,
    recentOrdersResult,
    categorySalesResult,
  ] = await Promise.all([

    // Orders today
    pool.query(
      `SELECT COUNT(*) AS count
       FROM orders
       WHERE created_at >= $1`,
      [todayStart.toISOString()]
    ),

    // Orders by status
    pool.query(
      `SELECT
         status,
         COUNT(*)                                                  AS total,
         COUNT(*) FILTER (WHERE created_at >= $1)                 AS today
       FROM orders
       GROUP BY status`,
      [todayStart.toISOString()]
    ),
    // Product Summary (Shows low stock and OK items)
    pool.query(`
      SELECT 
        p.id, p.name, p.stock, p.min_threshold, p.status, 
        c.name as category_name,
        CASE 
          WHEN p.stock = 0 THEN 'Out of Stock'
          WHEN p.stock <= p.min_threshold THEN 'Low Stock'
          ELSE 'OK'
        END as stock_level
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock ASC
      LIMIT 8
    `),

    // Daily revenue
    pool.query(
      `SELECT COALESCE(SUM(total_price), 0) AS revenue
       FROM orders
       WHERE created_at >= $1
         AND status NOT IN ('pending', 'cancelled')`,
      [todayStart.toISOString()]
    ),

    // Product distribution
    pool.query(`
      SELECT
        COUNT(*)                                         AS total,
        COUNT(*) FILTER (WHERE status = 'active')        AS active,
        COUNT(*) FILTER (WHERE status = 'out_of_stock')  AS out_of_stock,
        COUNT(*) FILTER (WHERE stock <= min_threshold AND stock > 0) AS low_stock
      FROM products
    `),

    // 7-day revenue trend
    pool.query(`
      SELECT
        DATE(created_at AT TIME ZONE 'UTC')  AS day,
        COUNT(*)                             AS order_count,
        COALESCE(SUM(total_price), 0)        AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
        AND status NOT IN ('pending', 'cancelled')
      GROUP BY DATE(created_at AT TIME ZONE 'UTC')
      ORDER BY day ASC
    `),

    // Recent orders feed
    pool.query(`
      SELECT
        o.id,
        o.order_number,
        o.customer_name,
        o.total_price,
        o.status,
        o.created_at,
        u.name AS created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `),

    // Revenue by category (all-time, non-cancelled/pending)
    pool.query(`
      SELECT
        COALESCE(c.name, 'Uncategorised') AS category,
        COALESCE(SUM(oi.price_at_order * oi.quantity), 0) AS revenue
      FROM order_items oi
      JOIN orders o   ON oi.order_id  = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.status NOT IN ('pending', 'cancelled')
      GROUP BY COALESCE(c.name, 'Uncategorised')
      ORDER BY revenue DESC
    `),
  ]);

  // Shape status counts into a flat object
  const statusMap = {};
  for (const row of ordersByStatusResult.rows) {
    statusMap[row.status] = {
      total: parseInt(row.total),
      today: parseInt(row.today),
    };
  }

  const productStats = totalProductsResult.rows[0];

  const summary = {
    orders_today: parseInt(ordersTodayResult.rows[0].count),
    revenue_today: parseFloat(revenueTodayResult.rows[0].revenue),
    total_products: parseInt(productStats.total),
    active_products: parseInt(productStats.active),
    out_of_stock_products: parseInt(productStats.out_of_stock),
    low_stock_count: parseInt(productStats.low_stock),
    pending_orders: statusMap.pending?.total || 0,
    completed_orders: statusMap.delivered?.total || 0,
    orders_by_status: statusMap,
    product_summary: productSummaryResult.rows,
    recent_orders: recentOrdersResult.rows,
    revenue_chart: revenueChartResult.rows.map((r) => ({
      day: r.day,
      revenue: parseFloat(r.revenue),
      order_count: parseInt(r.order_count),
    })),
    category_sales: categorySalesResult.rows.map((r) => ({
      category: r.category,
      revenue: parseFloat(r.revenue),
    })),
  };

  return res.json({ success: true, data: summary });
};

module.exports = { getSummary };
