const { pool } = require('../config/db');

// Fetch activity logs with optional entity filtering
const listLogs = async (req, res) => {
  const { limit = 10, entity_type, action_type, entity_id } = req.query;

  const params     = [];
  const conditions = [];

  if (entity_type) {
    params.push(entity_type);
    conditions.push(`l.entity_type = $${params.length}`);
  }
  if (action_type) {
    params.push(action_type);
    conditions.push(`l.action_type = $${params.length}`);
  }
  if (entity_id) {
    params.push(entity_id);
    conditions.push(`l.entity_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Cap limit at 100 entries
  params.push(Math.min(parseInt(limit) || 10, 100));

  const result = await pool.query(
    `SELECT
       l.id,
       l.action_type,
       l.entity_type,
       l.entity_id,
       l.message,
       l.meta,
       l.created_at,
       u.name AS user_name,
       u.role AS user_role
     FROM activity_logs l
     LEFT JOIN users u ON l.user_id = u.id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT $${params.length}`,
    params
  );

  return res.json({ success: true, data: result.rows });
};

module.exports = { listLogs };
