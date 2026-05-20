import { Router } from 'express';
import { login, me, register } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.post('/login',    login);
router.post('/register', authMiddleware, register); // ✅ só autenticado pode criar barbeiro
router.get('/me',        authMiddleware, me);

export default router;