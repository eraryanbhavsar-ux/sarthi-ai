import express from 'express';
import { register, login, getMe, updatePreferences, demoLogin } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { registerSchema, loginSchema, updatePreferencesSchema } from '../validators/authSchemas.js';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/demo-login', authLimiter, demoLogin);
router.get('/me', requireAuth, getMe);
router.put('/preferences', requireAuth, validateBody(updatePreferencesSchema), updatePreferences);

export default router;
