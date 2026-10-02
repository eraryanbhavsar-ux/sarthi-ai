import express from 'express';
import {
  analyzeVision,
  askVisionQuestion,
  guideForm,
  getVisionSessions,
  getVisionSessionById,
  deleteVisionSession,
  getVisionSample,
  translateVision,
  diagnosticVisionTest,
} from '../controllers/visionController.js';
import { optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { aiLimiter, visionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/vision/diagnostic-test
 * @desc    Phase 7 development test with known static image
 * @access  Public
 */
router.post('/diagnostic-test', diagnosticVisionTest);

/**
 * @route   POST /api/vision/analyze
 * @desc    Analyze live camera frame or uploaded image for accessibility
 * @access  Public / Optional Auth
 */
router.post('/analyze', visionLimiter, optionalAuth, upload.single('file'), analyzeVision);

/**
 * @route   POST /api/vision/translate
 * @desc    Translate active vision result into regional language on the fly
 * @access  Public / Optional Auth
 */
router.post('/translate', aiLimiter, optionalAuth, translateVision);

/**
 * @route   POST /api/vision/question
 * @desc    Ask SARTHI contextual questions about the analyzed scene/document
 * @access  Public / Optional Auth
 */
router.post('/question', aiLimiter, optionalAuth, askVisionQuestion);

/**
 * @route   POST /api/vision/form-guide
 * @desc    Step-by-step smart guidance through detected form fields in plain language
 * @access  Public / Optional Auth
 */
router.post('/form-guide', aiLimiter, optionalAuth, guideForm);

/**
 * @route   GET /api/vision/sessions
 * @desc    Get previous vision sessions for the authenticated user or guest
 * @access  Public / Optional Auth
 */
router.get('/sessions', optionalAuth, getVisionSessions);

/**
 * @route   GET /api/vision/sessions/:id
 * @desc    Get single vision session details
 * @access  Public / Optional Auth
 */
router.get('/sessions/:id', optionalAuth, getVisionSessionById);

/**
 * @route   DELETE /api/vision/sessions/:id
 * @desc    Delete a vision session (privacy-focused)
 * @access  Public / Optional Auth
 */
router.delete('/sessions/:id', optionalAuth, deleteVisionSession);

/**
 * @route   GET /api/vision/sample
 * @desc    Instant sample analysis for immediate testing/demo without camera hardware
 * @access  Public
 */
router.get('/sample', optionalAuth, getVisionSample);

export default router;
