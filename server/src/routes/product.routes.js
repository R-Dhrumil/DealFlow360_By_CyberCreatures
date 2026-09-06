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

// Variants
router.get('/:id/variants', checkRole('sales_rep', 'sales_manager', 'admin', 'customer', 'super_admin'), asyncWrap((req, res) => productController.getProductVariants(req, res)));
router.post('/:id/variants', checkRole('admin'), asyncWrap((req, res) => productController.addProductVariant(req, res)));

// Price Lists
router.get('/config/price-lists', checkRole('admin', 'sales_manager'), asyncWrap((req, res) => productController.getPriceLists(req, res)));
router.post('/config/price-lists', checkRole('admin', 'sales_manager'), asyncWrap((req, res) => productController.createPriceList(req, res)));
module.exports = router;

