const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotation.controller');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, attachCompanyScope);

router.post('/', checkRole('sales_rep'), asyncWrap((req, res) => quotationController.create(req, res)));
router.put('/:id/submit', checkRole('sales_rep'), asyncWrap((req, res) => quotationController.submit(req, res)));

module.exports = router;
