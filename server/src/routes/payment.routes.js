const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const asyncWrap = require('../utils/asyncWrap');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');

router.use(authenticate, attachCompanyScope);

router.get('/', asyncWrap((req, res) => paymentController.getCompanyPayments(req, res)));

module.exports = router;
