/**
 * Phase 3.4.1: Report Generation Controller
 */

import {
  generatePDFReport,
  generateExcelReport,
  generateCSVReport
} from '../services/reportGeneration.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Generate PDF report
 * POST /analytics/reports/pdf
 */
export const generatePDF = async (req, res) => {
  try {
    const { reportType, institutionId, startDate, endDate, filters = {} } = req.body;

    if (!reportType) {
      return errorResponse(res, 'Report type is required', 400);
    }

    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;

    const report = await generatePDFReport({
      reportType,
      institutionId: targetInstitutionId,
      dateRange,
      filters
    });

    return successResponse(res, report, 'PDF report generated successfully');
  } catch (error) {
    logger.error('Generate PDF report error:', error);
    return errorResponse(res, error.message || 'Failed to generate PDF report', 500);
  }
};

/**
 * Generate Excel report
 * POST /analytics/reports/excel
 */
export const generateExcel = async (req, res) => {
  try {
    const { reportType, institutionId, startDate, endDate, filters = {} } = req.body;

    if (!reportType) {
      return errorResponse(res, 'Report type is required', 400);
    }

    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;

    const report = await generateExcelReport({
      reportType,
      institutionId: targetInstitutionId,
      dateRange,
      filters
    });

    return successResponse(res, report, 'Excel report generated successfully');
  } catch (error) {
    logger.error('Generate Excel report error:', error);
    return errorResponse(res, error.message || 'Failed to generate Excel report', 500);
  }
};

/**
 * Generate CSV report
 * POST /analytics/reports/csv
 */
export const generateCSV = async (req, res) => {
  try {
    const { reportType, institutionId, startDate, endDate, filters = {} } = req.body;

    if (!reportType) {
      return errorResponse(res, 'Report type is required', 400);
    }

    const dateRange = (startDate && endDate) ? {
      start: new Date(startDate),
      end: new Date(endDate)
    } : null;

    const userInstitutionId = req.user?.institutionId?.toString() || req.institutionId;
    const targetInstitutionId = institutionId || userInstitutionId;

    const report = await generateCSVReport({
      reportType,
      institutionId: targetInstitutionId,
      dateRange,
      filters
    });

    return successResponse(res, report, 'CSV report generated successfully');
  } catch (error) {
    logger.error('Generate CSV report error:', error);
    return errorResponse(res, error.message || 'Failed to generate CSV report', 500);
  }
};

/**
 * Download report file
 * GET /analytics/reports/:filename
 */
export const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;
    const fs = (await import('fs')).default;
    const path = (await import('path')).default;
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const filepath = path.join(__dirname, '../../uploads/reports', filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return errorResponse(res, 'Report file not found', 404);
    }

    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.xlsx') contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (ext === '.csv') contentType = 'text/csv';

    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Download report error:', error);
    return errorResponse(res, error.message || 'Failed to download report', 500);
  }
};

