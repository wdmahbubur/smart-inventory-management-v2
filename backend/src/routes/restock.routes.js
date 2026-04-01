const router = require('express').Router();
const {
  listQueue,
  getHistory,
  resolveRestock,
  dismissFromQueue,
} = require('../controllers/restock.controller');
const { validate }          = require('../middleware/validate');
const { resolveRestockSchema } = require('../schemas/index');

router.get('/',               listQueue);
router.get('/history',        getHistory);
router.patch('/:id/resolve',  validate(resolveRestockSchema), resolveRestock);
router.delete('/:id',         dismissFromQueue);

module.exports = router;
