import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import sampleRoutes from './sample.routes.js';
import uploadRoutes from './upload.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sample', sampleRoutes);
router.use('/upload', uploadRoutes);

export default router;
