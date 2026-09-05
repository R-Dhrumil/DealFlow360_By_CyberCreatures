const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approval.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

// Pending queue — sales reps can see their own; managers/admin see company-wide
router.get('/pending', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.getPending(req, res)));

// Dashboard stats
router.get('/stats', checkRole('sales_rep', 'sales_manager', 'finance_manager', 'admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.getStats(req, res)));

// Approval action (approve, reject, return, modify_and_approve)
// Admin can approve pending_admin_approval; manager handles pending_approval
router.post('/:quotationId/action',
  checkRole('sales_manager', 'finance_manager', 'admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.processAction(req, res)));

// Config endpoints (admin only)
router.get('/config/discount-tiers', checkRole('admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.getDiscountTiers(req, res)));
router.put('/config/discount-tiers', checkRole('admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.upsertDiscountTier(req, res)));
router.get('/config/category-discounts', checkRole('admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.getCategoryDiscounts(req, res)));
router.put('/config/category-discounts', checkRole('admin', 'super_admin'),
  asyncWrap((req, res) => approvalController.upsertCategoryDiscount(req, res)));

module.exports = router;
