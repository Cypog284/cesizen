import { Router } from 'express';
import { emotionController } from '../controllers/cesizentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public (pour le picker dans le tracker)
router.get('/', emotionController.getAll);
router.get('/flat', emotionController.getAllFlat);

// Admin only
router.post('/', authenticate, requireAdmin, emotionController.create);
router.put('/:id', authenticate, requireAdmin, emotionController.update);
router.delete('/:id', authenticate, requireAdmin, emotionController.delete);

export default router;
