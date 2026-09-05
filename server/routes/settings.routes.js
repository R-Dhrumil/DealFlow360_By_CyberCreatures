const express = require('express');
const router = express.Router();
const settingsQueries = require('../db/queries/settings.queries');

// Public route to get global settings for frontend injection
router.get('/public', async (req, res) => {
  try {
    const settings = await settingsQueries.getGlobalSettings();
    res.json(settings);
  } catch (error) {
    console.error('Settings public error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
