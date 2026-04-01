import { Router } from 'express';
import { pageController } from '../controllers/cesizentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public
router.get('/', pageController.getPublished);

// Admin only
router.get('/all', authenticate, requireAdmin, pageController.getAll);
router.post('/', authenticate, requireAdmin, pageController.create);
router.put('/:id', authenticate, requireAdmin, pageController.update);
router.delete('/:id', authenticate, requireAdmin, pageController.delete);

export default router;
