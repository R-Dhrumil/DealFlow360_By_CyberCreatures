const express = require('express');
const router = express.Router();
const exportController = require('../controllers/export.controller');
const asyncWrap = require('../utils/asyncWrap');

router.get('/pdf/:id', asyncWrap((req, res) => exportController.exportQuotationPDF(req, res)));
router.get('/excel', asyncWrap((req, res) => exportController.exportReportExcel(req, res)));

module.exports = router;
