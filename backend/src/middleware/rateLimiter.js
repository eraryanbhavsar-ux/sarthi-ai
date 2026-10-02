import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after a few minutes.',
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Limit login/register attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again later.',
  },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 AI requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'SARTHI AI request rate limit reached. Please wait a moment before sending another query.',
  },
});

export const visionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 80, // 80 vision frames per minute to smoothly support 2-4s periodic analysis without false 429 errors
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'SARTHI Vision rate limit reached. Retrying...',
  },
});

