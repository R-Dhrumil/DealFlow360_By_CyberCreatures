const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiry.controller');
const authenticate = require('../middleware/authenticate');
const optionalAuth = require('../middleware/optionalAuth');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

// Public: customer can create an inquiry from marketplace (optionalAuth)
router.post('/', optionalAuth, asyncWrap((req, res) => inquiryController.create(req, res)));

// Protected: internal users only
router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_rep', 'sales_manager', 'admin', 'super_admin'), asyncWrap((req, res) => inquiryController.list(req, res)));
router.get('/:id', checkRole('sales_rep', 'sales_manager', 'admin', 'super_admin'), asyncWrap((req, res) => inquiryController.getOne(req, res)));
router.put('/:id/close', checkRole('sales_manager', 'admin'), asyncWrap((req, res) => inquiryController.close(req, res)));

module.exports = router;
