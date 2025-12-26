/**
 * Phase 4.10: Incident Management Controller
 * Handles incident history, alert logs, and reporting
 */

import AlertLog from '../models/AlertLog.js';
import Alert from '../models/Alert.js';
import School from '../models/School.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import PDFDocument from 'pdfkit';

/**
 * Get incident history (alert logs)
 * GET /api/incidents
 */
export const getIncidentHistory = async (req, res) => {
  try {
    const { institutionId, source, status, type, severity, startDate, endDate, page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Build query
    const query = {};

    // Filter by institution (user's institution or specific institution)
    if (user.role === 'admin' && institutionId) {
      query.institutionId = institutionId;
    } else {
      query.institutionId = user.institutionId;
    }

    // Filter by source (including historical)
    if (source && ['iot', 'admin', 'teacher', 'ai', 'ndma', 'system', 'historical'].includes(source)) {
      query.source = source;
    } else {
      // By default, exclude historical incidents unless specifically requested
      query.isHistorical = { $ne: true };
    }

    // Filter by status
    if (status && ['active', 'resolved', 'false_alarm', 'cancelled'].includes(status)) {
      query.status = status;
    }

    // Filter by type
    if (type && ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other'].includes(type)) {
      query.type = type;
    }

    // Filter by severity
    if (severity && ['low', 'medium', 'high', 'critical'].includes(severity)) {
      query.severity = severity;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get incident logs with populated fields
    const incidents = await AlertLog.find(query)
      .populate('alertId', 'type severity title description status createdAt')
      .populate('institutionId', 'name address')
      .populate('affectedUsers', 'name email role')
      .populate('actions.userId', 'name email')
      .populate('addedBy', 'name email')
      .sort({ createdAt: -1, historicalDate: -1 }) // Sort by createdAt or historicalDate
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await AlertLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching incident history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident history',
      error: error.message
    });
  }
};

/**
 * Get incident details
 * GET /api/incidents/:id
 */
export const getIncidentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const incident = await AlertLog.findById(id)
      .populate('alertId')
      .populate('institutionId', 'name address location')
      .populate('affectedUsers', 'name email role grade section')
      .populate('actions.userId', 'name email role')
      .populate('resolvedBy', 'name email');

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    // Check permission
    if (user.role !== 'admin' && incident.institutionId.toString() !== user.institutionId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    logger.error('Error fetching incident details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident details',
      error: error.message
    });
  }
};

/**
 * Get incident statistics
 * GET /api/incidents/stats
 */
export const getIncidentStats = async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;
    const user = req.user;

    logger.info('Stats Request:', {
      institutionId,
      userInstitutionId: user.institutionId,
      userRole: user.role,
      startDate,
      endDate
    });

    const query = {};

    // Filter by institution
    if (user.role === 'admin' && institutionId) {
      query.institutionId = institutionId;
    } else {
      query.institutionId = user.institutionId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // Aggregate statistics with proper calculations
    const stats = await AlertLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          historical: {
            $sum: { $cond: [{ $eq: ['$isHistorical', true] }, 1, 0] }
          },
          bySource: {
            $push: '$source'
          },
          byStatus: {
            $push: '$status'
          },
          bySeverity: {
            $push: '$severity'
          },
          byType: {
            $push: '$type'
          }
        }
      }
    ]);

    // Process statistics
    const statsData = stats[0] || {};
    const result = {
      total: statsData.total || 0,
      active: statsData.active || 0,
      resolved: statsData.resolved || 0,
      historical: statsData.historical || 0,
      bySource: {},
      byStatus: {},
      bySeverity: {},
      byType: {}
    };

    if (statsData.bySource) {
      // Count by source
      statsData.bySource.forEach(source => {
        if (source) {
          result.bySource[source] = (result.bySource[source] || 0) + 1;
        }
      });
    }

    if (statsData.byStatus) {
      // Count by status
      statsData.byStatus.forEach(status => {
        if (status) {
          result.byStatus[status] = (result.byStatus[status] || 0) + 1;
        }
      });
    }

    if (statsData.bySeverity) {
      // Count by severity
      statsData.bySeverity.forEach(severity => {
        if (severity) {
          result.bySeverity[severity] = (result.bySeverity[severity] || 0) + 1;
        }
      });
    }

    if (statsData.byType) {
      // Count by type
      statsData.byType.forEach(type => {
        if (type) {
          result.byType[type] = (result.byType[type] || 0) + 1;
        }
      });
    }

    logger.info('Stats Result:', result);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching incident statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incident statistics',
      error: error.message
    });
  }
};

/**
 * Export incident report to PDF
 * GET /api/incidents/export/pdf
 */
export const exportIncidentReport = async (req, res) => {
  try {
    const { institutionId, startDate, endDate, source, status } = req.query;
    const user = req.user;

    // Build query (same as getIncidentHistory)
    const query = {};

    if (user.role === 'admin' && institutionId) {
      query.institutionId = institutionId;
    } else {
      query.institutionId = user.institutionId;
    }

    if (source) query.source = source;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get all incidents (no pagination for export)
    const incidents = await AlertLog.find(query)
      .populate('alertId', 'type severity title description')
      .populate('institutionId', 'name address')
      .sort({ createdAt: -1 });

    // Generate PDF report
    const pdfBuffer = await generateIncidentReportPDF(incidents, user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="incident-report-${Date.now()}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error exporting incident report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export incident report',
      error: error.message
    });
  }
};

/**
 * Generate incident report PDF (helper function)
 */
const generateIncidentReportPDF = async (incidents, user) => {
  try {
    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Add header
    doc.fontSize(20)
      .fillColor('#1a1a1a')
      .text('KAVACH Incident Report', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(12)
      .fillColor('#666666')
      .text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10)
      .text(`Generated By: ${user.name || user.email}`, { align: 'center' });

    doc.moveDown(1);

    // Add summary
    doc.fontSize(14)
      .fillColor('#1a1a1a')
      .text('Summary', { underline: true });

    doc.moveDown(0.5);
    doc.fontSize(10)
      .fillColor('#333333')
      .text(`Total Incidents: ${incidents.length}`);

    doc.moveDown(1);

    // Add incidents table
    if (incidents.length > 0) {
      doc.fontSize(14)
        .fillColor('#1a1a1a')
        .text('Incident Details', { underline: true });

      doc.moveDown(0.5);

      incidents.forEach((incident, index) => {
        // Check if we need a new page
        if (index > 0 && index % 5 === 0) {
          doc.addPage();
        }

        doc.fontSize(11)
          .fillColor('#1a1a1a')
          .text(`Incident ${index + 1}`, { underline: true });

        doc.fontSize(9)
          .fillColor('#333333');

        const alertId = incident.alertId;
        doc.text(`ID: ${incident._id.toString()}`);
        doc.text(`Type: ${incident.type || alertId?.type || 'Unknown'}`);
        doc.text(`Severity: ${incident.severity || alertId?.severity || 'Unknown'}`);
        doc.text(`Source: ${incident.source || 'Unknown'}`);
        doc.text(`Status: ${incident.status || alertId?.status || 'Unknown'}`);
        doc.text(`Date: ${new Date(incident.createdAt).toLocaleString()}`);

        if (alertId?.title) {
          doc.text(`Title: ${alertId.title}`);
        }
        if (alertId?.description) {
          doc.text(`Description: ${alertId.description.substring(0, 100)}${alertId.description.length > 100 ? '...' : ''}`);
        }
        if (incident.affectedUsers && incident.affectedUsers.length > 0) {
          doc.text(`Affected Users: ${incident.affectedUsers.length}`);
        }

        doc.moveDown(0.5);
      });
    } else {
      doc.fontSize(10)
        .fillColor('#666666')
        .text('No incidents found for the selected criteria.');
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be fully generated
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
  } catch (error) {
    logger.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Create historical incident
 * POST /api/incidents/historical
 */
export const createHistoricalIncident = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admins can create historical incidents
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only admins can create historical incidents'
      });
    }

    const {
      type,
      severity,
      historicalDate,
      location,
      title,
      description,
      impact,
      response,
      historicalDetails,
      affectedUsers,
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !severity || !historicalDate || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, severity, historicalDate, and title are required'
      });
    }

    // Get institution ID
    const institutionId = user.institutionId || req.body.institutionId;
    if (!institutionId) {
      return res.status(400).json({
        success: false,
        message: 'Institution ID is required'
      });
    }

    // Create historical incident
    const historicalIncident = new AlertLog({
      alertId: null, // Historical incidents don't have an associated Alert
      source: 'historical',
      severity,
      type,
      institutionId,
      isHistorical: true,
      historicalDate: new Date(historicalDate),
      addedBy: user._id,
      addedAt: new Date(),
      location: location || { type: 'Point', coordinates: [0, 0] },
      impact: impact || {},
      response: response || {},
      historicalDetails: historicalDetails || {},
      affectedUsers: affectedUsers || [],
      metadata: {
        ...(metadata || {}),
        title: title,
        description: description || ''
      },
      status: 'resolved', // Historical incidents are typically resolved
      resolvedAt: historicalDate ? new Date(historicalDate) : new Date()
    });

    // Log the creation action
    historicalIncident.actions.push({
      userId: user._id,
      action: 'created',
      timestamp: new Date(),
      details: { isHistorical: true }
    });

    await historicalIncident.save();

    // Populate fields for response
    await historicalIncident.populate([
      { path: 'institutionId', select: 'name address' },
      { path: 'addedBy', select: 'name email' },
      { path: 'affectedUsers', select: 'name email role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Historical incident created successfully',
      data: historicalIncident
    });
  } catch (error) {
    logger.error('Error creating historical incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create historical incident',
      error: error.message
    });
  }
};

/**
 * Get historical incidents
 * GET /api/incidents/historical
 */
export const getHistoricalIncidents = async (req, res) => {
  try {
    const { institutionId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const user = req.user;

    // Build query
    const query = {
      isHistorical: true
    };

    // Filter by institution
    if (user.role === 'admin' && institutionId) {
      query.institutionId = institutionId;
    } else {
      query.institutionId = user.institutionId;
    }

    // Filter by historical date range
    if (startDate || endDate) {
      query.historicalDate = {};
      if (startDate) {
        query.historicalDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.historicalDate.$lte = new Date(endDate);
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get historical incidents
    const incidents = await AlertLog.find(query)
      .populate('institutionId', 'name address')
      .populate('addedBy', 'name email')
      .populate('affectedUsers', 'name email role')
      .populate('actions.userId', 'name email')
      .sort({ historicalDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await AlertLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        incidents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching historical incidents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical incidents',
      error: error.message
    });
  }
};

/**
 * Update historical incident
 * PUT /api/incidents/historical/:id
 */
export const updateHistoricalIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only admins can update historical incidents
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only admins can update historical incidents'
      });
    }

    const incident = await AlertLog.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Historical incident not found'
      });
    }

    if (!incident.isHistorical) {
      return res.status(400).json({
        success: false,
        message: 'This is not a historical incident'
      });
    }

    // Update fields
    const updateFields = [
      'type', 'severity', 'historicalDate', 'title', 'description',
      'location', 'impact', 'response', 'historicalDetails', 'metadata'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'historicalDate') {
          incident[field] = new Date(req.body[field]);
        } else {
          incident[field] = req.body[field];
        }
      }
    });

    // Log the update action
    incident.actions.push({
      userId: user._id,
      action: 'status_updated',
      timestamp: new Date(),
      details: { updatedFields: Object.keys(req.body) }
    });

    await incident.save();

    // Populate fields for response
    await incident.populate([
      { path: 'institutionId', select: 'name address' },
      { path: 'addedBy', select: 'name email' },
      { path: 'affectedUsers', select: 'name email role' }
    ]);

    res.json({
      success: true,
      message: 'Historical incident updated successfully',
      data: incident
    });
  } catch (error) {
    logger.error('Error updating historical incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update historical incident',
      error: error.message
    });
  }
};

/**
 * Delete historical incident
 * DELETE /api/incidents/historical/:id
 */
export const deleteHistoricalIncident = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only admins can delete historical incidents
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Only admins can delete historical incidents'
      });
    }

    const incident = await AlertLog.findById(id);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Historical incident not found'
      });
    }

    if (!incident.isHistorical) {
      return res.status(400).json({
        success: false,
        message: 'This is not a historical incident'
      });
    }

    await AlertLog.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Historical incident deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting historical incident:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete historical incident',
      error: error.message
    });
  }
};

/**
 * Get historical incident statistics
 * GET /api/incidents/historical/stats
 */
export const getHistoricalIncidentStats = async (req, res) => {
  try {
    const { institutionId, startDate, endDate } = req.query;
    const user = req.user;

    const query = {
      isHistorical: true
    };

    // Filter by institution
    if (user.role === 'admin' && institutionId) {
      query.institutionId = institutionId;
    } else {
      query.institutionId = user.institutionId;
    }

    // Filter by historical date range
    if (startDate || endDate) {
      query.historicalDate = {};
      if (startDate) {
        query.historicalDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.historicalDate.$lte = new Date(endDate);
      }
    }

    // Aggregate statistics
    const stats = await AlertLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byType: { $push: '$type' },
          bySeverity: { $push: '$severity' },
          bySource: { $push: '$historicalDetails.originalSource' }
        }
      }
    ]);

    const result = {
      total: stats[0]?.total || 0,
      byType: {},
      bySeverity: {},
      bySource: {}
    };

    if (stats[0]) {
      // Count by type
      stats[0].byType.forEach(type => {
        result.byType[type] = (result.byType[type] || 0) + 1;
      });

      // Count by severity
      stats[0].bySeverity.forEach(severity => {
        result.bySeverity[severity] = (result.bySeverity[severity] || 0) + 1;
      });

      // Count by source
      stats[0].bySource.forEach(source => {
        if (source) {
          result.bySource[source] = (result.bySource[source] || 0) + 1;
        }
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching historical incident stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical incident statistics',
      error: error.message
    });
  }
};

