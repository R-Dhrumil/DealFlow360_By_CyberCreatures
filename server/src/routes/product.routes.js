const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_rep', 'sales_manager', 'admin'), asyncWrap((req, res) => productController.getCompanyProducts(req, res)));
router.post('/', checkRole('admin'), asyncWrap((req, res) => productController.createProduct(req, res)));

module.exports = router;

