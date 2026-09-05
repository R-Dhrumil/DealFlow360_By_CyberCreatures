const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const uploadController = require('../controllers/upload.controller');
const asyncWrap = require('../utils/asyncWrap');

const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.post('/', upload.single('file'), asyncWrap((req, res) => uploadController.handleFileUpload(req, res)));

module.exports = router;
