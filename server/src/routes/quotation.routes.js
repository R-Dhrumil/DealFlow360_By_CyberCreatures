const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.get('/', asyncWrap((req, res) => quotationController.getCompanyQuotations(req, res)));
router.post('/customer-request', asyncWrap((req, res) => quotationController.createCustomerRequest(req, res)));
router.get('/:id', asyncWrap((req, res) => quotationController.getQuotationById(req, res)));
router.put('/:id/status', asyncWrap((req, res) => quotationController.updateStatus(req, res)));
router.put('/:id/counter', asyncWrap((req, res) => quotationController.counterOffer(req, res)));
router.post('/', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.create(req, res)));
router.put('/:id/submit', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.submit(req, res)));

module.exports = router;
