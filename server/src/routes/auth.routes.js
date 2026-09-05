const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const asyncWrap = require('../utils/asyncWrap');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/login', authRateLimiter, asyncWrap((req, res) => authController.login(req, res)));
router.post('/customer/login', authRateLimiter, asyncWrap((req, res) => authController.customerLogin(req, res)));
router.post('/customer/signup', authRateLimiter, asyncWrap((req, res) => authController.customerSignup(req, res)));

module.exports = router;
