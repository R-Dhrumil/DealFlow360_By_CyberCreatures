const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuth = require('../middleware/optionalAuth');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

// Public / Live Portal Accessible Routes (Optional Auth so customer portal link works for unauthenticated users)
router.get('/:id', optionalAuth, asyncWrap((req, res) => quotationController.getQuotationById(req, res)));
router.get('/:id/messages', optionalAuth, asyncWrap((req, res) => quotationController.getMessages(req, res)));
router.post('/:id/messages', optionalAuth, asyncWrap((req, res) => quotationController.postMessage(req, res)));
router.put('/:id/counter', optionalAuth, asyncWrap((req, res) => quotationController.counterOffer(req, res)));
router.put('/:id/confirm', optionalAuth, asyncWrap((req, res) => quotationController.confirm(req, res)));

// Protected Internal Routes (Strict Auth required)
router.use(authenticate, attachCompanyScope);

router.get('/', asyncWrap((req, res) => quotationController.getCompanyQuotations(req, res)));
router.post('/customer-request', asyncWrap((req, res) => quotationController.createCustomerRequest(req, res)));

// Strict State Machine Endpoints
router.put('/:id/approve', checkRole('finance', 'admin', 'sales_manager'), asyncWrap((req, res) => quotationController.approve(req, res)));
router.put('/:id/reject', checkRole('finance', 'admin', 'sales_manager'), asyncWrap((req, res) => quotationController.reject(req, res)));
router.put('/:id/status', asyncWrap((req, res) => quotationController.updateStatus(req, res)));

router.post('/', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.create(req, res)));
router.put('/:id/submit', checkRole('sales_rep', 'admin'), asyncWrap((req, res) => quotationController.submit(req, res)));

module.exports = router;

