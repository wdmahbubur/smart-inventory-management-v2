const router       = require('express').Router();
const { listLogs } = require('../controllers/log.controller');

router.get('/', listLogs);

module.exports = router;
