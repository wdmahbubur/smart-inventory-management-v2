const router           = require('express').Router();
const { authenticate } = require('../middleware/auth');

// Public routes
router.use('/auth', require('./auth.routes'));

// Protected routes (JWT required)
router.use(authenticate);

router.use('/categories', require('./category.routes'));
router.use('/products',   require('./product.routes'));
router.use('/orders',     require('./order.routes'));
router.use('/restock',    require('./restock.routes'));
router.use('/dashboard',  require('./dashboard.routes'));
router.use('/logs',       require('./log.routes'));
router.use('/users',      require('./user.routes'));

module.exports = router;
