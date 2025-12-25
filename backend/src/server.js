// CRITICAL: Load environment variables FIRST before any other imports
// This ensures JWT_SECRET and other env vars are available when auth.service.js is imported
import './config/env-loader.js';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import connectRedis from './config/redis.js'; // Phase 3.3.5: Redis for leaderboards
import { errorHandler } from './middleware/error.middleware.js';
import logger from './config/logger.js';
import { requestTracing } from './middleware/requestTracing.middleware.js';

const app = express();
const httpServer = createServer(app);

// Socket.io setup
// Allow localhost and dev tunnels for development
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://bnc51nt1-3000.inc1.devtunnels.ms',
  'http://bnc51nt1-3000.inc1.devtunnels.ms'
];

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Make io accessible to routes
app.set('io', io);

// Phase 3.3.5: Make io accessible to services via singleton
import { setSocketIO } from './config/socket.js';
setSocketIO(io);

// Trust proxy (required for rate limiting behind reverse proxy/tunnels)
// This allows Express to correctly identify client IPs
app.set('trust proxy', true);

// Middleware
// Phase 3.4.4: Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false, // Allow for dev tunnels in development
  crossOriginEmbedderPolicy: false, // Allow for dev tunnels
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "no-referrer" }
}));

// CORS configuration - allow localhost and dev tunnels
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || [
  'http://localhost:3001',
  'http://localhost:3000',
  'https://bnc51nt1-3000.inc1.devtunnels.ms',
  'http://bnc51nt1-3000.inc1.devtunnels.ms'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // In development, log but allow (for flexibility)
      if (process.env.NODE_ENV === 'development') {
        logger.warn(`CORS: Origin ${origin} not in allowed list, but allowing in development`);
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request tracing middleware
app.use(requestTracing);

// Phase 3.5.1: Performance monitoring middleware
import { requestTimingMiddleware, cacheStatsMiddleware } from './middleware/performance.middleware.js';
app.use(requestTimingMiddleware);
app.use(cacheStatsMiddleware);

// Phase 3.1.3: Serve static audio files
// Phase 3.5.1: Enhanced with CDN support and cache headers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static file serving with cache headers (can be served via CDN)
const staticOptions = {
  maxAge: '1y', // Cache for 1 year
  immutable: true,
  etag: true,
  lastModified: true
};

app.use('/uploads/audio', express.static(path.join(__dirname, '../uploads/audio'), staticOptions));
// Phase 3.3.4: Serve static certificate PDFs
app.use('/uploads/certificates', express.static(path.join(__dirname, '../uploads/certificates'), staticOptions));
// Phase 3.4.1: Serve static report files
app.use('/uploads/reports', express.static(path.join(__dirname, '../uploads/reports'), staticOptions));
// Phase 5.5: Serve blueprint files
app.use('/uploads/blueprints', express.static(path.join(__dirname, '../uploads/blueprints'), staticOptions));
// Map Integration: Serve QR code files
app.use('/uploads/qr-codes', express.static(path.join(__dirname, '../uploads/qr-codes'), staticOptions));

// Phase 3.5.1: Health check routes (before API routes for load balancer checks)
import healthRoutes from './routes/health.routes.js';
app.use('/api/health', healthRoutes);
// Legacy health check (backward compatibility)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Kavach API is running',
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import schoolRoutes from './routes/school.routes.js';
import drillRoutes from './routes/drill.routes.js';
import alertRoutes from './routes/alert.routes.js';
import moduleRoutes from './routes/module.routes.js';
import syncRoutes from './routes/sync.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import deviceRoutes from './routes/device.routes.js';
import aiRoutes from './routes/ai.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import audioRoutes from './routes/audio.routes.js'; // Phase 3.1.3
import gameRoutes from './routes/game.routes.js'; // Phase 3.2
import scoreRoutes from './routes/score.routes.js'; // Phase 3.3.1
import adaptiveScoringRoutes from './routes/adaptiveScoring.routes.js'; // Phase 3.3.2
import badgeRoutes from './routes/badge.routes.js'; // Phase 3.3.3
import certificateRoutes from './routes/certificate.routes.js'; // Phase 3.3.4
import difficultyRoutes from './routes/difficulty.routes.js'; // Phase 3.1.5
import qrRoutes from './routes/qr.routes.js'; // Phase 2.5
import teacherRoutes from './routes/teacher.routes.js'; // Phase 2.5
import parentRoutes from './routes/parent.routes.js'; // Parent Monitoring System
import activityRoutes from './routes/activity.routes.js'; // Phase 2: Activity Tracking
import parentQRCodeRoutes from './routes/parent-qr-code.routes.js'; // Phase 2: Parent QR Codes
import groupActivityRoutes from './routes/group-activity.routes.js'; // Phase 2.5
import projectorRoutes from './routes/projector.routes.js'; // Phase 2.5
import analyticsRoutes from './routes/analytics.routes.js'; // Phase 3.4.1
import communicationRoutes from './routes/communication.routes.js'; // Phase 3.4.3
import broadcastRoutes from './routes/broadcast.routes.js'; // Phase 3.4.3
import templateRoutes from './routes/template.routes.js'; // Phase 3.4.3
import gdprRoutes from './routes/gdpr.routes.js'; // Phase 3.4.4
import auditRoutes from './routes/audit.routes.js'; // Phase 3.4.4
import securityRoutes from './routes/security.routes.js'; // Phase 3.4.4
import voiceRoutes from './routes/voice.routes.js'; // Phase 3.5.5
import arNavigationRoutes from './routes/arNavigation.routes.js'; // Phase 4.7
import safeZoneRoutes from './routes/safeZone.routes.js'; // Phase 4.7
import mlPredictionRoutes from './routes/mlPrediction.routes.js'; // Phase 4.8
import userSettingsRoutes from './routes/userSettings.routes.js'; // Phase 4.9
import incidentRoutes from './routes/incident.routes.js'; // Phase 4.10
import meshRoutes from './routes/mesh.routes.js'; // Phase 5.3
import arRoutes from './routes/ar.routes.js'; // Phase 5.7
import classroomJoinRoutes from './routes/classroom-join.routes.js'; // RBAC Refinement
import rosterRoutes from './routes/roster.routes.js'; // RBAC Refinement
import adminRoutes from './routes/admin.routes.js'; // RBAC Refinement: Admin class management
import studentRoutes from './routes/student.routes.js'; // Student-specific routes
import { preventNoSQLInjection } from './middleware/input-validation.middleware.js'; // Phase 3.4.4
import path from 'path';
import { fileURLToPath } from 'url';

app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes); // Phase 2.5
app.use('/api/parent', parentRoutes); // Parent Monitoring System
app.use('/api/activity', activityRoutes); // Phase 2: Activity Tracking
app.use('/api/qr/parent', parentQRCodeRoutes); // Phase 2: Parent QR Codes
app.use('/api/group-activities', groupActivityRoutes); // Phase 2.5
app.use('/api/projector', projectorRoutes); // Phase 2.5
app.use('/api/classroom', classroomJoinRoutes); // RBAC Refinement
app.use('/api/roster', rosterRoutes); // RBAC Refinement
app.use('/api/admin', adminRoutes); // RBAC Refinement: Admin class management
app.use('/api/student', studentRoutes); // Student-specific routes
app.use('/api/users', userRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/drills', drillRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/sync', syncRoutes); // Add-on 2
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/audio', audioRoutes); // Phase 3.1.3
app.use('/api/games', gameRoutes); // Phase 3.2
app.use('/api/scores', scoreRoutes); // Phase 3.3.1
app.use('/api/adaptive-scoring', adaptiveScoringRoutes); // Phase 3.3.2
app.use('/api/badges', badgeRoutes); // Phase 3.3.3
app.use('/api/certificates', certificateRoutes); // Phase 3.3.4
app.use('/api/difficulty', difficultyRoutes); // Phase 3.1.5
app.use('/api/qr', qrRoutes); // Phase 2.5
app.use('/api/ai', aiRoutes); // Add-on 3
app.use('/api/metrics', metricsRoutes);
app.use('/api/analytics', analyticsRoutes); // Phase 3.4.1
app.use('/api/communication', communicationRoutes); // Phase 3.4.3
app.use('/api/broadcast', broadcastRoutes); // Phase 3.4.3
app.use('/api/templates', templateRoutes); // Phase 3.4.3
app.use('/api/gdpr', gdprRoutes); // Phase 3.4.4
app.use('/api/audit', auditRoutes); // Phase 3.4.4
app.use('/api/security', securityRoutes); // Phase 3.4.4
app.use('/api/voice', voiceRoutes); // Phase 3.5.5
app.use('/api/ar-navigation', arNavigationRoutes); // Phase 4.7
app.use('/api/safe-zones', safeZoneRoutes); // Phase 4.7
app.use('/api/ml-predictions', mlPredictionRoutes); // Phase 4.8
app.use('/api/settings', userSettingsRoutes); // Phase 4.9
app.use('/api/incidents', incidentRoutes); // Phase 4.10
app.use('/api/mesh', meshRoutes); // Phase 5.3
app.use('/api/ar', arRoutes); // Phase 5.7

// Phase 3.4.4: Prevent NoSQL injection (apply to all routes)
app.use(preventNoSQLInjection);

app.get('/api', (req, res) => {
  res.json({
    message: 'Kavach API v1.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      users: '/api/users',
      schools: '/api/schools',
      drills: '/api/drills',
      alerts: '/api/alerts',
      modules: '/api/modules',
      sync: '/api/sync',
      leaderboard: '/api/leaderboard',
      devices: '/api/devices',
      audio: '/api/audio',
      games: '/api/games',
      ai: '/api/ai',
      metrics: '/api/metrics'
    }
  });
});

// Initialize Socket.io handler
import { initializeSocket } from './socket/socketHandler.js';
initializeSocket(io);

// Initialize FCM service (will log status)
try {
  await import('./services/fcm.service.js');
  logger.info('📱 FCM service loaded');
} catch (error) {
  logger.warn('⚠️ FCM service load failed:', error.message);
}

// Phase 4.4: Initialize Dead Man's Switch service
try {
  const { startDeadManSwitch } = await import('./services/deadManSwitch.service.js');
  startDeadManSwitch();
  logger.info('🚨 Dead Man Switch service started');
} catch (error) {
  logger.warn('⚠️ Dead Man Switch service load failed:', error.message);
}

// Phase 4.10: Initialize NDMA/IMD polling service
try {
  const { startNDMAPolling } = await import('./services/ndmaIntegration.service.js');
  const stopNDMAPolling = startNDMAPolling();
  logger.info('🌐 NDMA/IMD polling service started');
  
  // Store stop function for graceful shutdown
  app.set('stopNDMAPolling', stopNDMAPolling);
} catch (error) {
  logger.warn('⚠️ NDMA/IMD polling service load failed:', error.message);
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for port forwarding

connectDB()
  .then(async () => {
    // Run database migrations (one-time fixes for schema updates)
    try {
      const { runMigrations } = await import('./utils/migrations.js');
      await runMigrations();
    } catch (error) {
      logger.warn('Database migrations warning:', error.message);
    }

    // Phase 3.3.5: Connect to Redis (optional, leaderboards work without it)
    // Only attempt connection if REDIS_URL is set, otherwise skip silently
    if (process.env.REDIS_URL) {
      try {
        await connectRedis();
      } catch (error) {
        // Connection failed, but that's OK - leaderboards will use MongoDB
        logger.debug('Redis connection skipped (not configured or unavailable)');
      }
    } else {
      logger.info('ℹ️  Redis not configured - leaderboards will use MongoDB (this is OK)');
    }

    // Check if port is available before listening
    httpServer.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Please kill the process using this port.`);
        logger.error(`   Run: Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
        process.exit(1);
      } else {
        logger.error('❌ Server error:', error);
        process.exit(1);
      }
    });

    // Phase 3.4.3: Start message scheduler
    try {
      const schedulerService = await import('./services/scheduler.service.js');
      schedulerService.default.startScheduler();
    } catch (error) {
      logger.warn('Failed to start message scheduler:', error.message);
    }

    httpServer.listen(PORT, HOST, () => {
      logger.info(`🚀 Kavach Backend running on ${HOST}:${PORT}`);
      logger.info(`📡 Socket.io server ready`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Local: http://localhost:${PORT}`);
      logger.info(`✅ CORS: Configured for localhost (can be extended via CORS_ORIGIN env)`);
    });
  })
  .catch((error) => {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  });

export default app;
