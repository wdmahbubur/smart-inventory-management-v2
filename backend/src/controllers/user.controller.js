const { pool } = require('../config/db');

// Get all users (for admin management)
const getUsers = async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  return res.json({ success: true, data: result.rows });
};

// Update a user's role
const updateUserRole = async (req, res) => {
  const { id }   = req.params;
  const { role } = req.body;

  if (!['admin', 'manager'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified.' });
  }

  // Prevent admin from demoting themselves to avoid lockout
  if (req.user.id === id && role !== 'admin') {
    return res.status(403).json({ success: false, error: 'You cannot demote yourself.' });
  }

  const result = await pool.query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role, created_at',
    [role, id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  return res.json({ success: true, data: result.rows[0], message: 'User role updated.' });
};

module.exports = { getUsers, updateUserRole };
