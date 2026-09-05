import { Router } from 'express';
import { createUser, getAllUsers, getUserById, updateUserRole } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/rbac.middleware.js';
import { ROLES } from '../config/roles.js';

const router = Router();

router.use(authenticate);

// Admin-only user creation
router.post('/', authorize(ROLES.ADMIN), createUser);

// User management endpoints
router.get('/', authorize(ROLES.ADMIN), getAllUsers);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.MANAGER), getUserById);
router.patch('/:id/role', authorize(ROLES.ADMIN), updateUserRole);

export default router;
