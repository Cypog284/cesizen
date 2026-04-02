import { Router } from 'express';
import { trackerController } from '../controllers/trackerController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/', trackerController.addEntry);
router.get('/', trackerController.getHistory);
router.get('/report', trackerController.getReport);
router.get('/streak', trackerController.getStreak);
router.get('/chart', trackerController.getChart30Days);
router.delete('/:id', trackerController.deleteEntry);

export default router;
