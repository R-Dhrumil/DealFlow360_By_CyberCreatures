const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const asyncWrap = require('../utils/asyncWrap');

router.get('/products', asyncWrap((req, res) => marketplaceController.getProducts(req, res)));

module.exports = router;
