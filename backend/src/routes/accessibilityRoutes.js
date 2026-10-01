import express from 'express';
import {
  analyzeContent,
  askQuestion,
  translateContent,
  simplifyContent,
  describeImage,
  getSampleData,
  processVoice,
  getTtsStatus,
  synthesizeSpeech,
} from '../controllers/accessibilityController.js';
import { optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validateBody } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import {
  questionSchema,
  translateSchema,
  simplifySchema,
  voiceQuerySchema,
} from '../validators/accessibilitySchemas.js';

const router = express.Router();

// Analyze document, image, or text
router.post('/analyze', aiLimiter, optionalAuth, upload.single('file'), analyzeContent);

// Ask contextual question strictly grounded in document
router.post('/question', aiLimiter, optionalAuth, validateBody(questionSchema), askQuestion);

// Multilingual translation
router.post('/translate', aiLimiter, optionalAuth, validateBody(translateSchema), translateContent);

// "Make it even simpler"
router.post('/simplify', aiLimiter, optionalAuth, validateBody(simplifySchema), simplifyContent);

// Specialized image description
router.post('/describe-image', aiLimiter, optionalAuth, upload.single('file'), describeImage);

// Load realistic fictional sample
router.get('/sample', optionalAuth, getSampleData);

// Process voice transcript
router.post('/voice', aiLimiter, optionalAuth, validateBody(voiceQuerySchema), processVoice);

// Regional Text-to-Speech endpoints
router.get('/tts/status', getTtsStatus);
router.post('/tts', aiLimiter, optionalAuth, synthesizeSpeech);

export default router;
