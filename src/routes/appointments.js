import { Router } from 'express';
import {
  getMyAppointments,
  getAllAppointments,
  createAppointment,
  updateStatus,
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

  return showAll
    ? getAllAppointments(req, res, next)  // controller que já busca tudo
    : getMyAppointments(req, res, next); // controller que filtra pelo barbeiro
});

router.get('/all',    getAllAppointments);
router.get('/stats',  getDashboardStats);
router.post('/',      createAppointment);
router.put('/:id',    updateStatus);
router.delete('/:id', deleteAppointment);

export default router;