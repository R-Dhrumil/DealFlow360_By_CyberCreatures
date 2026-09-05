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

const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/uploads/')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `upload-${Date.now()}${ext}`);
  }
});
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and ICO are allowed.'));
  }
};
const upload = multer({ 
  storage, 
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const serverUrl = req.protocol + '://' + req.get('host');
    res.json({ url: `${serverUrl}/uploads/${req.file.filename}` });
  });
});

// Note: Password update would ideally be in an auth or user controller, but for hackathon speed we add it here
const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

router.put('/password', asyncWrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Missing current or new password' });
  }

  // Enforce password strength: at least 8 chars, 1 uppercase, 1 number
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long and contain at least one uppercase letter and one number.' });
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
