const router                    = require('express').Router();
const { signup, login, me }     = require('../controllers/auth.controller');
const { authenticate }          = require('../middleware/auth');
const { validate }              = require('../middleware/validate');
const { signupSchema, loginSchema } = require('../schemas/index');

router.post('/signup', validate(signupSchema), signup);
router.post('/login',  validate(loginSchema),  login);
router.get('/me',      authenticate,           me);

module.exports = router;
