const router = require('express').Router();
const { getUsers, updateUserRole } = require('../controllers/user.controller');
const { requireRole } = require('../middleware/auth');

// All endpoints here require Admin role
router.use(requireRole('admin'));

// Fetch all users
router.get('/', getUsers);

// Update user role
router.put('/:id/role', updateUserRole);

module.exports = router;
