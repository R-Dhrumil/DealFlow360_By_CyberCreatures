const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_rep', 'sales_manager', 'admin', 'customer', 'super_admin', 'operations', 'finance_manager'), asyncWrap((req, res) => productController.getCompanyProducts(req, res)));
router.post('/', checkRole('admin'), asyncWrap((req, res) => productController.createProduct(req, res)));
router.put('/:id', checkRole('admin'), asyncWrap((req, res) => productController.updateProduct(req, res)));
router.delete('/:id', checkRole('admin'), asyncWrap((req, res) => productController.deleteProduct(req, res)));
router.patch('/:id/stock', checkRole('admin'), asyncWrap((req, res) => productController.updateStock(req, res)));

module.exports = router;

