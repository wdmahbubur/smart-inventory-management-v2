const router = require('express').Router();
const {
  listCategories,
  getCategory,
  createCategory,
  deleteCategory,
} = require('../controllers/category.controller');
const { requireRole } = require('../middleware/auth');
const { validate }    = require('../middleware/validate');
const { createCategorySchema } = require('../schemas/index');

router.get('/',     listCategories);
router.get('/:id',  getCategory);
router.post('/',    requireRole('admin', 'manager'), validate(createCategorySchema), createCategory);
router.delete('/:id', requireRole('admin'),          deleteCategory);

module.exports = router;
