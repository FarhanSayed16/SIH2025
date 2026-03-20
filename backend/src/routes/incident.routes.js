/**
 * Phase 4.10: Incident Management Routes
 */

import express from 'express';
import {
  getIncidentHistory,
  getIncidentDetails,
  getIncidentStats,
  exportIncidentReport,
  createHistoricalIncident,
  getHistoricalIncidents,
  updateHistoricalIncident,
  deleteHistoricalIncident,
  getHistoricalIncidentStats
} from '../controllers/incident.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/rbac.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get incident history (paginated, filtered)
router.get('/', getIncidentHistory);

// Get incident statistics
router.get('/stats', getIncidentStats);

// Export incident report to PDF (admin only)
router.get('/export/pdf', requireAdmin, exportIncidentReport);

// Historical Incident Routes (admin only) - MUST come before /:id route
router.post('/historical', requireAdmin, createHistoricalIncident);
router.get('/historical', getHistoricalIncidents);
router.get('/historical/stats', getHistoricalIncidentStats);
router.put('/historical/:id', requireAdmin, updateHistoricalIncident);
router.delete('/historical/:id', requireAdmin, deleteHistoricalIncident);

// Get incident details - MUST come after /historical routes
router.get('/:id', getIncidentDetails);

export default router;

