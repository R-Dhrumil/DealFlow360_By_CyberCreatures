const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_manager', 'admin'), asyncWrap((req, res) => dashboardController.getMetrics(req, res)));

module.exports = router;
