const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/pending', checkRole('sales_manager', 'finance', 'admin'), asyncWrap((req, res) => approvalController.getPending(req, res)));
router.post('/:quotationId/action', checkRole('sales_manager', 'finance', 'admin'), asyncWrap((req, res) => approvalController.processAction(req, res)));

module.exports = router;
