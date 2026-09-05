const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const asyncWrap = require('../utils/asyncWrap');
const authenticate = require('../middleware/authenticate');

router.get('/', authenticate, asyncWrap((req, res) => userController.getCompanyUsers(req, res)));
router.post('/', authenticate, asyncWrap((req, res) => userController.provisionUser(req, res)));

module.exports = router;
