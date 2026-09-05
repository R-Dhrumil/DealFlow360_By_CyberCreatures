const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const asyncWrap = require('../utils/asyncWrap');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post('/login', authRateLimiter, asyncWrap((req, res) => authController.unifiedLogin(req, res)));
router.post('/signup', authRateLimiter, asyncWrap((req, res) => authController.unifiedSignup(req, res)));

module.exports = router;

