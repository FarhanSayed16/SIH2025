/**
 * Phase 3.3.4: Certificate Controller
 * Handles certificate generation and retrieval
 */

import { successResponse, errorResponse } from '../utils/response.js';
import {
  generateCertificate,
  getUserCertificates,
  getCertificateById,
  checkAndGenerateCertificates
} from '../services/certificate.service.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a certificate
 * POST /api/certificates/generate
 */
export const generateCertificateController = async (req, res) => {
  try {
    const { certificateType, achievement, metadata = {} } = req.body;
    const userId = req.userId;

    if (!certificateType || !achievement) {
      return errorResponse(res, 'certificateType and achievement are required', 400);
    }

    const validTypes = ['module_completion', 'score_milestone', 'badge_achievement', 'all_modules_completed'];
    if (!validTypes.includes(certificateType)) {
      return errorResponse(res, 'Invalid certificate type', 400);
    }

    const result = await generateCertificate({
      userId,
      certificateType,
      achievement,
      metadata
    });

    return successResponse(res, {
      certificate: result.certificate,
      isNew: result.isNew,
      pdfUrl: result.pdfUrl,
      message: result.isNew ? 'Certificate generated successfully' : 'Certificate already exists'
    }, 201);
  } catch (error) {
    logger.error('Generate certificate controller error:', error);
    return errorResponse(res, error.message || 'Failed to generate certificate', 500);
  }
};

/**
 * Get user's certificates
 * GET /api/certificates/my-certificates
 */
export const getMyCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    const certificates = await getUserCertificates(userId);

    return successResponse(res, {
      certificates,
      count: certificates.length
    });
  } catch (error) {
    logger.error('Get my certificates controller error:', error);
    return errorResponse(res, error.message || 'Failed to get certificates', 500);
  }
};

/**
 * Get certificate by ID
 * GET /api/certificates/:id
 */
export const getCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const certificate = await getCertificateById(id);

    // Check if user owns this certificate
    if (certificate.userId._id.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized to access this certificate', 403);
    }

    return successResponse(res, { certificate });
  } catch (error) {
    logger.error('Get certificate controller error:', error);
    if (error.message === 'Certificate not found') {
      return errorResponse(res, 'Certificate not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to get certificate', 500);
  }
};

/**
 * Download certificate PDF
 * GET /api/certificates/:id/download
 */
export const downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const certificate = await getCertificateById(id);

    // Check if user owns this certificate
    if (certificate.userId._id.toString() !== userId.toString()) {
      return errorResponse(res, 'Unauthorized to access this certificate', 403);
    }

    if (!certificate.pdfUrl) {
      return errorResponse(res, 'Certificate PDF not found', 404);
    }

    // Construct file path
    const filePath = path.join(__dirname, '../../', certificate.pdfUrl);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return errorResponse(res, 'Certificate PDF file not found', 404);
    }

    // Set headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="certificate_${certificate._id}.pdf"`
    );

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Update sharedAt timestamp
    certificate.sharedAt = new Date();
    certificate.save().catch(err => {
      logger.warn('Failed to update sharedAt timestamp:', err);
    });
  } catch (error) {
    logger.error('Download certificate controller error:', error);
    if (error.message === 'Certificate not found') {
      return errorResponse(res, 'Certificate not found', 404);
    }
    return errorResponse(res, error.message || 'Failed to download certificate', 500);
  }
};

/**
 * Check and generate certificates for achievements
 * POST /api/certificates/check
 */
export const checkCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    const { triggerType, triggerData = {} } = req.body;

    const newCertificates = await checkAndGenerateCertificates(userId, triggerType, triggerData);

    return successResponse(res, {
      newCertificates,
      count: newCertificates.length,
      message: newCertificates.length > 0
        ? `${newCertificates.length} new certificate(s) generated`
        : 'No new certificates to generate'
    });
  } catch (error) {
    logger.error('Check certificates controller error:', error);
    return errorResponse(res, error.message || 'Failed to check certificates', 500);
  }
};

