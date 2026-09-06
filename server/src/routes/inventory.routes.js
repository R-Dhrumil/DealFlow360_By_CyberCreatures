const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

// Apply authentication and company scoping to all inventory routes
router.use(authenticate, attachCompanyScope);

// Only specific roles can manage/view inventory
router.get('/', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.getOverview(req, res)));
router.get('/transactions', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.getTransactions(req, res)));
router.get('/rebalance-logs', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.getRebalanceLogs(req, res)));
router.get('/lots', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.getLots(req, res)));
router.post('/rebalance', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.triggerRebalancing(req, res)));
router.post('/adjust', checkRole('admin', 'super_admin', 'operations', 'sales_manager'), asyncWrap((req, res) => inventoryController.adjustStock(req, res)));

module.exports = router;
