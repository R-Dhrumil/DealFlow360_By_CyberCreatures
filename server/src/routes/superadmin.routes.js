const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authenticate = require('../middleware/authenticate');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, checkRole('super_admin'));

router.get('/companies', asyncWrap((req, res) => superadminController.getCompanies(req, res)));

module.exports = router;
