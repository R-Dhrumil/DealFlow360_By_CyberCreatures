import { Router } from 'express';
import { uploadSingleFile, uploadMultipleFiles } from '../controllers/upload.controller.js';
import { uploadSingle, uploadMultiple } from '../middlewares/upload.middleware.js';

const router = Router();

// Upload a single file (form field: 'file')
router.post('/single', uploadSingle('file'), uploadSingleFile);

// Upload multiple files (form field: 'files', max 10)
router.post('/multiple', uploadMultiple('files', 10), uploadMultipleFiles);

export default router;
