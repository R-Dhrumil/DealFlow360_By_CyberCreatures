import { Router } from 'express';
import { login, register, sendOtp, verifyOtp, getMe } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Public Auth Endpoints
router.post('/register', register);
router.post('/login', login);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);

// Protected Auth Endpoints
router.get('/me', authenticate, getMe);

export default router;
