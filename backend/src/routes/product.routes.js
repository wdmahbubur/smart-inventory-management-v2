const router = require('express').Router();
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  quickRestock,
} = require('../controllers/product.controller');
const { requireRole } = require('../middleware/auth');
const { validate }    = require('../middleware/validate');
const {
  createProductSchema,
  updateProductSchema,
  restockProductSchema,
} = require('../schemas/index');

router.get('/',                                              listProducts);
router.get('/:id',                                           getProduct);
router.post('/',       validate(createProductSchema),        createProduct);
router.put('/:id',     validate(updateProductSchema),        updateProduct);
router.delete('/:id',  requireRole('admin'),                 deleteProduct);
router.patch('/:id/restock', validate(restockProductSchema), quickRestock);

module.exports = router;
