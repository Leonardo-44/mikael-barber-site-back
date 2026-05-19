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

const router = Router();

router.use(authMiddleware);

router.get('/',       getMyAppointments);
router.get('/all',    getAllAppointments);
router.get('/stats',  getDashboardStats);
router.post('/',      createAppointment);
router.put('/:id',    updateStatus);
router.delete('/:id', deleteAppointment);

export default router;