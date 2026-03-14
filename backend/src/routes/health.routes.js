/**
 * Phase 3.5.1: Health Check Routes
 */

import express from 'express';
import {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck
} from '../controllers/health.controller.js';

const router = express.Router();

// Basic health check
router.get('/', healthCheck);

// Detailed health check
router.get('/detailed', detailedHealthCheck);

// Readiness check (for Kubernetes, load balancers)
router.get('/ready', readinessCheck);

// Liveness check (for Kubernetes)
router.get('/live', livenessCheck);

export default router;

