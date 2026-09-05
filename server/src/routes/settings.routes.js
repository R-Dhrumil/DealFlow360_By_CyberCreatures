const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const asyncWrap = require('../utils/asyncWrap');

// Public route to get global settings for frontend injection
router.get('/public', asyncWrap((req, res) => settingsController.getSettings(req, res)));

module.exports = router;
