import { Router } from 'express';
import { login, me, register, getBarbers } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/login',    login);
router.post('/register', authMiddleware, register);
router.get('/me',        authMiddleware, me);
router.get('/barbers',   authMiddleware, getBarbers);

export default router; 