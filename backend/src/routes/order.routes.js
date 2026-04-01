const router = require('express').Router();
const {
  createOrder,
  listOrders,
  getOrder,
  updateStatus,
} = require('../controllers/order.controller');
const { validate } = require('../middleware/validate');
const {
  createOrderSchema,
  updateOrderStatusSchema,
} = require('../schemas/index');

router.get('/',             listOrders);
router.get('/:id',          getOrder);
router.post('/',            validate(createOrderSchema),       createOrder);
router.patch('/:id/status', validate(updateOrderStatusSchema), updateStatus);

module.exports = router;
