const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const asyncWrap = require('../utils/asyncWrap');
const optionalAuth = require('../middleware/optionalAuth');

router.get('/products', asyncWrap((req, res) => marketplaceController.getProducts(req, res)));
router.post('/purchase', optionalAuth, asyncWrap((req, res) => marketplaceController.purchaseProduct(req, res)));

module.exports = router;
