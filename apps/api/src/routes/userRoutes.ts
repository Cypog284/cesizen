import { Router } from 'express';
import { userController } from '../controllers/cesizentController';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireAdmin);
router.get('/', userController.getAll);
router.get('/dashboard', userController.getDashboard);
router.get('/analytics', userController.getAnalytics);
router.get('/:id', userController.getById);
router.put('/:id/role', userController.updateRole);
router.delete('/:id', userController.delete);

export default router;
