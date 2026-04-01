const { pool }       = require('../config/db');
const { logService } = require('../services/log.service');

const listCategories = async (req, res) => {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.created_at,
      u.name          AS created_by_name,
      COUNT(p.id)     AS product_count
    FROM categories c
    LEFT JOIN users    u ON c.created_by   = u.id
    LEFT JOIN products p ON p.category_id  = c.id
    GROUP BY c.id, u.name
    ORDER BY c.name ASC
  `);

  return res.json({ success: true, data: result.rows });
};

const getCategory = async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, u.name AS created_by_name
     FROM categories c
     LEFT JOIN users u ON c.created_by = u.id
     WHERE c.id = $1`,
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Category not found.' });
  return res.json({ success: true, data: result.rows[0] });
};

const createCategory = async (req, res) => {
  const { name } = req.validated.body;

  const result = await pool.query(
    `INSERT INTO categories (name, created_by) VALUES ($1, $2) RETURNING *`,
    [name, req.user.id]
  );

  const category = result.rows[0];

  await logService.write({
    userId:     req.user.id,
    actionType: 'CATEGORY_CREATED',
    entityType: 'category',
    entityId:   category.id,
    message:    `Category "${name}" created`,
  });

  return res.status(201).json({ success: true, data: category });
};

// Delete a category if no products are linked
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  // Guard: block deletion if products are linked
  const linked = await pool.query(
    'SELECT id FROM products WHERE category_id = $1 LIMIT 1',
    [id]
  );
  if (linked.rows.length > 0) {
    return res.status(409).json({
      success: false,
      error: 'Cannot delete a category that has products. Re-assign or delete products first.',
    });
  }

  const result = await pool.query(
    'DELETE FROM categories WHERE id = $1 RETURNING name',
    [id]
  );
  if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Category not found.' });

  await logService.write({
    userId:     req.user.id,
    actionType: 'CATEGORY_DELETED',
    entityType: 'category',
    entityId:   id,
    message:    `Category "${result.rows[0].name}" deleted`,
  });

  return res.json({ success: true, data: null });
};

module.exports = { listCategories, getCategory, createCategory, deleteCategory };
