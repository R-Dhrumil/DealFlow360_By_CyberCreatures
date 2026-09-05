const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const authenticate = require('../middleware/authenticate');
const checkRole = require('../middleware/checkRole');
const asyncWrap = require('../utils/asyncWrap');

router.use(authenticate, checkRole('super_admin'));

router.get('/companies', asyncWrap((req, res) => superadminController.getCompanies(req, res)));
router.get('/users', asyncWrap((req, res) => superadminController.getTenantUsers(req, res)));

const settingsController = require('../controllers/settings.controller');
router.get('/settings', asyncWrap((req, res) => settingsController.getSettings(req, res)));
router.put('/settings', asyncWrap((req, res) => settingsController.updateSettings(req, res)));

// Note: Password update would ideally be in an auth or user controller, but for hackathon speed we add it here
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

router.put('/password', asyncWrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing current or new password' });
  }
  
  const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.userId]);
  if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' });
  
  const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid current password' });
  
  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.userId]);
  
  res.json({ success: true, message: 'Password updated successfully' });
}));

module.exports = router;
