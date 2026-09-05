const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const authenticate = require('../middleware/authenticate');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

// Public route to get payment options for a company
router.get('/:id/payment-options', asyncWrap((req, res) => companyController.getPublicPaymentOptions(req, res)));

// All company admin routes require authentication and valid administrative roles
router.use(authenticate, checkRole('admin', 'super_admin', 'company_admin', 'finance_manager'));

router.get('/payment-settings', asyncWrap((req, res) => companyController.getPaymentSettings(req, res)));
router.put('/payment-settings', asyncWrap((req, res) => companyController.updatePaymentSettings(req, res)));

module.exports = router;
