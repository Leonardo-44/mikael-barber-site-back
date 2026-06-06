import { Router } from 'express';
import {
  getMyAppointments,
  getAllAppointments,
  createAppointment,
  updateStatus,
  updateAppointment,
  deleteAppointment,
  getDashboardStats,
} from '../controllers/appointmentController.js';
import { authMiddleware } from '../middlewares/auth.js';
import 'dotenv/config';

const router = Router();

router.use(authMiddleware); // ✅ protege todas as rotas abaixo

// GET /appointments — admin vê todos, barbeiro vê só os seus
router.get('/', (req, res, next) => {
  const isAdmin = req.barber?.username?.toLowerCase() === process.env.ADMIN_USERNAME?.toLowerCase();
  const showAll = req.query.all === 'true' && isAdmin;
  return showAll ? getAllAppointments(req, res, next) : getMyAppointments(req, res, next);
});

router.get('/all',   getAllAppointments);
router.get('/stats', getDashboardStats);
router.post('/',     createAppointment);

router.patch('/:id/status', updateStatus);  // ← só status
router.put('/:id',          updateAppointment); // ← edição completa

router.delete('/:id', deleteAppointment);

export default router;