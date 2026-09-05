import { Router } from 'express';
import { getScopedData, exportSampleExcel, exportSamplePdf } from '../controllers/sample.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { scopeData } from '../middlewares/rbac.middleware.js';

const router = Router();

router.get('/scoped-data', authenticate, scopeData('procurement'), getScopedData);

// Instant export demo endpoints
router.get('/export/excel', exportSampleExcel);
router.get('/export/pdf', exportSamplePdf);

export default router;
