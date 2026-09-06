const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

// GET /reporting — Fetch dynamic reporting analytics
router.get('/', checkRole('sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'), asyncWrap((req, res) => reportController.getReport(req, res)));

// GET /reporting/filters — Fetch dropdown options for filters
router.get('/filters', checkRole('sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'), asyncWrap((req, res) => reportController.getFilters(req, res)));

module.exports = router;
