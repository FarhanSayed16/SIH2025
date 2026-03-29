/**
 * Phase 3.3.4: PDF Certificate Generation Service
 * Generates shareable PDF certificates for student achievements
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import Module from '../models/Module.js';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create certificates directory if it doesn't exist
const CERTIFICATES_DIR = path.join(__dirname, '../../uploads/certificates');
try {
  if (!fs.existsSync(CERTIFICATES_DIR)) {
    fs.mkdirSync(CERTIFICATES_DIR, { recursive: true });
  }
} catch (err) {
  logger.warn('Certificate directory creation failed:', err.message);
}

/**
 * Generate a PDF certificate
 * @param {Object} options - Certificate options
 * @param {string} options.userId - User ID
 * @param {string} options.certificateType - Type of certificate
 * @param {string} options.achievement - Achievement description
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<Object>} Certificate data with PDF path
 */
export const generateCertificate = async ({
  userId,
  certificateType,
  achievement,
  metadata = {}
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if certificate already exists
    const existingCertificate = await Certificate.findOne({
      userId,
      certificateType,
      achievement
    });

    if (existingCertificate && existingCertificate.pdfUrl) {
      logger.info(`Certificate already exists for user ${userId}: ${certificateType}`);
      return {
        certificate: existingCertificate,
        isNew: false
      };
    }

    // Generate PDF
    const pdfFileName = `certificate_${userId}_${Date.now()}.pdf`;
    const pdfPath = path.join(CERTIFICATES_DIR, pdfFileName);
    const pdfUrl = `/uploads/certificates/${pdfFileName}`;

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER', // 8.5 x 11 inches
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Pipe PDF to file
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Certificate Design
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background decoration
    doc.rect(0, 0, pageWidth, pageHeight)
      .fillColor('#f5f5f5')
      .fill();

    // Border
    doc.strokeColor('#d4af37') // Gold color
      .lineWidth(8)
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .stroke();

    // Inner border
    doc.strokeColor('#b8860b')
      .lineWidth(2)
      .rect(40, 40, pageWidth - 80, pageHeight - 80)
      .stroke();

    // Title
    doc.fontSize(42)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('CERTIFICATE OF ACHIEVEMENT', {
        align: 'center',
        y: pageHeight * 0.15
      });

    // Subtitle
    doc.fontSize(18)
      .fillColor('#7f8c8d')
      .font('Helvetica')
      .text('This is to certify that', {
        align: 'center',
        y: pageHeight * 0.28
      });

    // Student Name
    doc.fontSize(36)
      .fillColor('#1a1a1a')
      .font('Helvetica-Bold')
      .text(user.name.toUpperCase(), {
        align: 'center',
        y: pageHeight * 0.35
      });

    // Achievement Text
    doc.fontSize(20)
      .fillColor('#34495e')
      .font('Helvetica')
      .text('has successfully completed', {
        align: 'center',
        y: pageHeight * 0.48
      });

    // Achievement Description
    doc.fontSize(24)
      .fillColor('#e74c3c')
      .font('Helvetica-Bold')
      .text(achievement, {
        align: 'center',
        y: pageHeight * 0.55,
        width: pageWidth - 200,
        ellipsis: true
      });

    // Date
    const dateString = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(14)
      .fillColor('#7f8c8d')
      .font('Helvetica')
      .text(`Date: ${dateString}`, {
        align: 'center',
        y: pageHeight * 0.70
      });

    // Stamp/Signature section
    doc.fontSize(12)
      .fillColor('#7f8c8d')
      .font('Helvetica') // Use regular Helvetica instead of Italic
      .text('Kavach Safety Education Platform', {
        align: 'center',
        y: pageHeight * 0.80
      });

    // Certificate ID
    const certId = `KAVACH-${Date.now().toString(36).toUpperCase()}-${userId.toString().substring(0, 8).toUpperCase()}`;
    doc.fontSize(10)
      .fillColor('#95a5a6')
      .font('Helvetica')
      .text(`Certificate ID: ${certId}`, {
        align: 'center',
        y: pageHeight * 0.90
      });

    // Finalize PDF
    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Save certificate to database
    const certificate = await Certificate.findOneAndUpdate(
      { userId, certificateType, achievement },
      {
        userId,
        certificateType,
        achievement,
        metadata,
        pdfUrl,
        issuedAt: new Date()
      },
      { upsert: true, new: true }
    );

    logger.info(`Certificate generated for user ${userId}: ${pdfUrl}`);

    return {
      certificate,
      isNew: true,
      pdfPath,
      pdfUrl,
      certificateId: certId
    };
  } catch (error) {
    logger.error('Certificate generation error:', error);
    throw error;
  }
};

/**
 * Get all certificates for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of certificates
 */
export const getUserCertificates = async (userId) => {
  try {
    const certificates = await Certificate.find({ userId, isActive: true })
      .sort({ issuedAt: -1 })
      .populate('userId', 'name email');

    return certificates;
  } catch (error) {
    logger.error('Get user certificates error:', error);
    throw error;
  }
};

/**
 * Get certificate by ID
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Object>} Certificate
 */
export const getCertificateById = async (certificateId) => {
  try {
    const certificate = await Certificate.findById(certificateId)
      .populate('userId', 'name email');

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    return certificate;
  } catch (error) {
    logger.error('Get certificate by ID error:', error);
    throw error;
  }
};

/**
 * Check and generate certificates for achievements
 * @param {string} userId - User ID
 * @param {string} triggerType - Type of trigger (module_complete, score_update, badge_earned)
 * @param {Object} triggerData - Data related to the trigger
 * @returns {Promise<Array>} Newly generated certificates
 */
export const checkAndGenerateCertificates = async (userId, triggerType, triggerData = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user || user.role !== 'student') {
      return []; // Only students get certificates
    }

    const newCertificates = [];

    // Check for module completion certificate
    if (triggerType === 'module_complete') {
      const totalModules = await Module.countDocuments({ isActive: true });
      const completedModules = user.progress?.completedModules?.length || 0;

      // Generate certificate if all modules completed
      if (completedModules >= totalModules && totalModules > 0) {
        try {
          const cert = await generateCertificate({
            userId,
            certificateType: 'all_modules_completed',
            achievement: 'All Safety Learning Modules',
            metadata: {
              totalModules,
              completedModules,
              completedAt: new Date()
            }
          });

          if (cert.isNew) {
            newCertificates.push(cert.certificate);
            logger.info(`Generated "All Modules Completed" certificate for user ${userId}`);
          }
        } catch (err) {
          logger.warn(`Failed to generate module completion certificate: ${err.message}`);
        }
      }
    }

    // Check for preparedness score milestone certificates
    if (triggerType === 'score_update') {
      const score = user.progress?.preparednessScore || 0;

      // 80% milestone - Safety Champion
      if (score >= 80 && score < 95) {
        const existingCert = await Certificate.findOne({
          userId,
          certificateType: 'score_milestone',
          'metadata.milestone': 80
        });

        if (!existingCert) {
          try {
            const cert = await generateCertificate({
              userId,
              certificateType: 'score_milestone',
              achievement: 'Safety Champion (80% Preparedness Score)',
              metadata: {
                milestone: 80,
                score,
                achievedAt: new Date()
              }
            });

            if (cert.isNew) {
              newCertificates.push(cert.certificate);
              logger.info(`Generated "Safety Champion" certificate for user ${userId}`);
            }
          } catch (err) {
            logger.warn(`Failed to generate score milestone certificate: ${err.message}`);
          }
        }
      }

      // 95% milestone - Safety Expert
      if (score >= 95) {
        const existingCert = await Certificate.findOne({
          userId,
          certificateType: 'score_milestone',
          'metadata.milestone': 95
        });

        if (!existingCert) {
          try {
            const cert = await generateCertificate({
              userId,
              certificateType: 'score_milestone',
              achievement: 'Safety Expert (95% Preparedness Score)',
              metadata: {
                milestone: 95,
                score,
                achievedAt: new Date()
              }
            });

            if (cert.isNew) {
              newCertificates.push(cert.certificate);
              logger.info(`Generated "Safety Expert" certificate for user ${userId}`);
            }
          } catch (err) {
            logger.warn(`Failed to generate score milestone certificate: ${err.message}`);
          }
        }
      }
    }

    return newCertificates;
  } catch (error) {
    logger.error('Check and generate certificates error:', error);
    return [];
  }
};

