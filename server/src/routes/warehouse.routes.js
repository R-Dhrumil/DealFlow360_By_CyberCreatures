const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_rep', 'sales_manager', 'admin', 'super_admin', 'operations', 'finance_manager'), asyncWrap((req, res) => warehouseController.getCompanyWarehouses(req, res)));
router.post('/', checkRole('admin', 'super_admin'), asyncWrap((req, res) => warehouseController.createWarehouse(req, res)));
router.put('/:id', checkRole('admin', 'super_admin'), asyncWrap((req, res) => warehouseController.updateWarehouse(req, res)));
router.delete('/:id', checkRole('admin', 'super_admin'), asyncWrap((req, res) => warehouseController.deleteWarehouse(req, res)));

router.get('/quotations/:id/suggest-split', checkRole('sales_manager', 'admin', 'sales_rep'), asyncWrap((req, res) => warehouseController.suggestSplit(req, res)));
router.post('/quotations/:id/accept-split', checkRole('sales_manager', 'admin', 'sales_rep'), asyncWrap((req, res) => warehouseController.acceptSplit(req, res)));

module.exports = router;
