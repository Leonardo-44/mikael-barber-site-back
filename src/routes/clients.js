import { Router } from 'express';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/',     getClients);
router.post('/',    createClient);
router.put('/:id',  updateClient);
router.delete('/:id', deleteClient);

export default router;