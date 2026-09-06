const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuth = require('../middleware/optionalAuth');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

// ── Public / Portal Routes (optional auth so customer portal works unauthenticated) ──
router.get('/latest', optionalAuth, asyncWrap((req, res) => quotationController.getLatestQuotation(req, res)));
router.get('/latest/discount', optionalAuth, asyncWrap((req, res) => quotationController.getLatestDiscount(req, res)));
router.get('/:id/discount', optionalAuth, asyncWrap((req, res) => quotationController.getLatestDiscount(req, res)));
router.get('/:id/latest-discount', optionalAuth, asyncWrap((req, res) => quotationController.getLatestDiscount(req, res)));
router.get('/:id', optionalAuth, asyncWrap((req, res) => quotationController.getQuotationById(req, res)));
router.get('/:id/messages', optionalAuth, asyncWrap((req, res) => quotationController.getMessages(req, res)));
router.post('/:id/messages', optionalAuth, asyncWrap((req, res) => quotationController.postMessage(req, res)));
router.put('/:id/counter', optionalAuth, asyncWrap((req, res) => quotationController.counterOffer(req, res)));
router.put('/:id/confirm', optionalAuth, asyncWrap((req, res) => quotationController.confirm(req, res)));

// ── Protected Internal Routes ──
router.use(authenticate, attachCompanyScope);

router.get('/', asyncWrap((req, res) => quotationController.getCompanyQuotations(req, res)));

// Customer inquiry via marketplace (any authenticated user / customer)
router.post('/customer-request', asyncWrap((req, res) => quotationController.createCustomerRequest(req, res)));

// Real-time discount validation
router.post('/validate-discount', asyncWrap((req, res) => quotationController.validateDiscount(req, res)));

// Calculate Risk and Risk Analysis
router.post('/:id/calculate-risk', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'),
  asyncWrap((req, res) => quotationController.calculateRisk(req, res)));
router.get('/:id/risk-analysis', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'),
  asyncWrap((req, res) => quotationController.getRiskAnalysis(req, res)));

// Approval / rejection (sales_manager + admin can also approve pending_admin_approval)
router.put('/:id/approve', checkRole('finance_manager', 'finance', 'admin', 'sales_manager', 'super_admin'),
  asyncWrap((req, res) => quotationController.approve(req, res)));
router.put('/:id/reject', checkRole('finance_manager', 'finance', 'admin', 'sales_manager', 'super_admin'),
  asyncWrap((req, res) => quotationController.reject(req, res)));
router.put('/:id/status', asyncWrap((req, res) => quotationController.updateStatus(req, res)));

// Create + submit (sales rep, finance manager, and admin)
router.post('/', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'),
  asyncWrap((req, res) => quotationController.create(req, res)));
router.put('/:id/submit', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'finance', 'admin', 'super_admin'),
  asyncWrap((req, res) => quotationController.submit(req, res)));

module.exports = router;
