const express = require('express');
const router = express.Router();
const financeController = require('../controllers/finance.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);
// Typically finance endpoints might require finance_manager or admin role
// router.use(checkRole(['finance_manager', 'admin', 'super_admin']));

router.get('/billing-schedules', asyncWrap((req, res) => financeController.getBillingSchedules(req, res)));
router.get('/credit-notes', asyncWrap((req, res) => financeController.getCreditNotes(req, res)));

module.exports = router;
