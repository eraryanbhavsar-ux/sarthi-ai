import express from 'express';
import {
  getSessions,
  getSessionById,
  updateChecklist,
  deleteSession,
  getUserStats,
} from '../controllers/sessionController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { updateChecklistSchema } from '../validators/accessibilitySchemas.js';

const router = express.Router();

router.get('/', optionalAuth, getSessions);
router.get('/stats', optionalAuth, getUserStats);
router.get('/:id', optionalAuth, getSessionById);
router.patch('/:id/checklist', optionalAuth, validateBody(updateChecklistSchema), updateChecklist);
router.delete('/:id', optionalAuth, deleteSession);

export default router;
