import { Router } from 'express';
import { registerHandler, loginHandler, meHandler } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/register', registerHandler);
router.post('/login', loginHandler);

// Protected routes (Tenant and Identity verified via JWT)
router.get('/me', authenticate, meHandler);

export default router;
