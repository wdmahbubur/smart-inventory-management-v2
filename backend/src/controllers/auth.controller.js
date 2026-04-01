const bcrypt      = require('bcryptjs');
const { pool }    = require('../config/db');
const { signToken } = require('../utils/jwt');
const { logService } = require('../services/log.service');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Register a new user
const signup = async (req, res) => {
  const { name, email, password, role } = req.validated.body;

  // Check for duplicate email
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return res.status(409).json({ success: false, error: 'Email is already registered.' });
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [name, email, password_hash, role]
  );

  const user  = result.rows[0];
  const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name });

  await logService.write({
    userId:     user.id,
    actionType: 'USER_REGISTERED',
    entityType: 'auth',
    entityId:   user.id,
    message:    `New user registered: ${user.name} (${user.role})`,
  });

  return res.status(201).json({ success: true, data: { token, user } });
};

// Login and return a JWT
const login = async (req, res) => {
  const { email, password } = req.validated.body;

  const result = await pool.query(
    'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Invalid email or password.' });
  }

  const { password_hash, ...safeUser } = user;
  const token = signToken({ id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name });

  return res.status(200).json({ success: true, data: { token, user: safeUser } });
};

// Get currently logged-in user context
const me = async (req, res) => {
  const result = await pool.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!result.rows[0]) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }
  return res.json({ success: true, data: result.rows[0] });
};

module.exports = { signup, login, me };
