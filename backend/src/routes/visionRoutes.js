import express from 'express';
import {
  analyzeVision,
  askVisionQuestion,
  guideForm,
  getVisionSessions,
  getVisionSessionById,
  deleteVisionSession,
  getVisionSample,
} from '../controllers/visionController.js';
import { optionalAuth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * @route   POST /api/vision/analyze
 * @desc    Analyze captured image or uploaded photo for blind/low-vision accessibility
 * @access  Public / Optional Auth
 */
router.post('/analyze', aiLimiter, optionalAuth, upload.single('file'), analyzeVision);

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
