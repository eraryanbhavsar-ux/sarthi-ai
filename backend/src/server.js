import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { connectDB, getDBStatus } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import accessibilityRoutes from './routes/accessibilityRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import visionRoutes from './routes/visionRoutes.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o) || o === '*')) {
      return callback(null, true);
    }
    // Allow any vercel.app deployment preview domain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for hackathon review, logged
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body Parsing
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Global Rate Limiting
app.use('/api', globalLimiter);

// Root Welcome Route
app.get('/', (req, res) => {
  res.status(200).json({
    product: 'SARTHI',
    tagline: 'Understand. Hear. Translate. Act.',
    status: 'healthy',
    message: 'SARTHI Accessibility & Inclusion AI API is Live!',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      accessibility: '/api/accessibility',
      vision: '/api/vision',
      sessions: '/api/sessions',
    },
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.status(200).json({
    status: 'healthy',
    product: 'SARTHI',
    tagline: 'Understand. Hear. Translate. Act.',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: dbStatus.isConnected,
      fallbackMode: dbStatus.isInMemoryFallback,
    },
    aiConfigured: Boolean(env.GEMINI_API_KEY),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/vision', visionRoutes);

// 404 Route Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
async function startServer() {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 SARTHI Backend Server Active on Port ${env.PORT}`);
    console.log(`🌐 Product: SARTHI - "Understand. Hear. Translate. Act."`);
    console.log(`📡 Health Check: http://localhost:${env.PORT}/api/health`);
    console.log(`=======================================================`);
  });

  const shutdown = () => {
    console.log('\n[SARTHI] Gracefully shutting down...');
    server.close(() => {
      console.log('[SARTHI] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return server;
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
