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

// Strict State Machine Endpoints
router.put('/:id/approve', checkRole('finance', 'admin', 'sales_manager'), asyncWrap((req, res) => quotationController.approve(req, res)));
router.put('/:id/reject', checkRole('finance', 'admin', 'sales_manager'), asyncWrap((req, res) => quotationController.reject(req, res)));
router.put('/:id/confirm', checkRole('customer', 'sales_rep', 'admin'), asyncWrap((req, res) => quotationController.confirm(req, res)));

router.put('/:id/counter', asyncWrap((req, res) => quotationController.counterOffer(req, res)));
router.post('/', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.create(req, res)));
router.put('/:id/submit', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.submit(req, res)));

module.exports = router;
