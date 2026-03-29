/**
 * Parent QR Code Service
 * Generates and manages QR codes for parent-student relationships
 * Used for teacher verification of parent identity (especially in kidnapping scenarios)
 * Phase 1: Backend Foundation
 */

import ParentQRCode from '../models/ParentQRCode.js';
import ParentStudentRelationship from '../models/ParentStudentRelationship.js';
import User from '../models/User.js';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/encryption.util.js';
import { getSocketIO } from '../config/socket.js';
import { SERVER_EVENTS, createQRCodeScannedEvent } from '../socket/events.js';
import { sendQRCodeScannedNotification, sendParentVerificationApprovedNotification } from './fcm.service.js';
import logger from '../config/logger.js';

// QR code expiration time (24 hours in milliseconds)
const QR_CODE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * Generate HMAC signature for QR code data
 * @param {Object} data - Data to sign
 * @returns {string} HMAC signature
 */
const generateSignature = (data) => {
  const secret = process.env.QR_CODE_SECRET || process.env.JWT_SECRET || 'default-secret';
  const dataString = JSON.stringify(data);
  return crypto.createHmac('sha256', secret).update(dataString).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {Object} data - Data to verify
 * @param {string} signature - Signature to verify against
 * @returns {boolean} True if signature is valid
 */
const verifySignature = (data, signature) => {
  const expectedSignature = generateSignature(data);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Generate QR code for parent-student relationship
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} QR code data with image
 */
export const generateParentQRCode = async (parentId, studentId) => {
  try {
    // Verify parent exists
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Parent not found');
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Verify relationship exists and is verified
    const relationship = await ParentStudentRelationship.findOne({
      parentId,
      studentId,
      verified: true
    });

    if (!relationship) {
      throw new Error('Verified parent-student relationship not found');
    }

    // Deactivate any existing active QR codes for this relationship
    await ParentQRCode.updateMany(
      {
        parentId,
        studentId,
        isActive: true
      },
      {
        isActive: false
      }
    );

    // Create QR code data structure
    const qrData = {
      parentId: parentId.toString(),
      studentId: studentId.toString(),
      relationshipId: relationship._id.toString(),
      timestamp: Date.now(),
      signature: '' // Will be added after creation
    };

    // Generate signature
    const signature = generateSignature({
      parentId: qrData.parentId,
      studentId: qrData.studentId,
      relationshipId: qrData.relationshipId,
      timestamp: qrData.timestamp
    });
    qrData.signature = signature;

    // Encrypt QR code data
    const encryptedData = encrypt(JSON.stringify(qrData));

    // Generate unique QR code string (for database lookup)
    const qrCodeString = crypto
      .createHash('sha256')
      .update(encryptedData + Date.now().toString())
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + QR_CODE_EXPIRATION_MS);

    // Create ParentQRCode document
    const parentQRCode = await ParentQRCode.create({
      parentId,
      studentId,
      relationshipId: relationship._id,
      qrCode: qrCodeString,
      encryptedData,
      expiresAt,
      scanCount: 0,
      isActive: true
    });

    // Update relationship with QR code ID
    relationship.qrCodeId = parentQRCode._id;
    await relationship.save();

    // Generate QR code image (base64 data URL)
    const qrImage = await QRCode.toDataURL(encryptedData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    logger.info(`QR code generated for parent ${parentId} - student ${studentId} relationship`);

    return {
      qrCodeId: parentQRCode._id,
      qrCode: qrCodeString,
      qrImage,
      encryptedData,
      expiresAt,
      parent: {
        _id: parent._id,
        name: parent.name,
        email: parent.email,
        phone: parent.phone || parent.parentProfile?.phoneNumber
      },
      student: {
        _id: student._id,
        name: student.name,
        grade: student.grade,
        section: student.section
      },
      relationship: {
        _id: relationship._id,
        relationship: relationship.relationship,
        verified: relationship.verified
      }
    };
  } catch (error) {
    logger.error('Error generating parent QR code:', error);
    throw error;
  }
};

/**
 * Verify QR code (when teacher scans it)
 * @param {string} qrCodeData - Encrypted QR code data from scan
 * @param {string} scannedBy - Teacher/Admin user ID who scanned
 * @param {Object} location - Optional location data {lat, lng}
 * @returns {Promise<Object>} Verification result with parent/student details
 */
export const verifyQRCode = async (qrCodeData, scannedBy, location = null) => {
  try {
    // Decrypt QR code data
    let decryptedData;
    try {
      const decryptedString = decrypt(qrCodeData);
      decryptedData = JSON.parse(decryptedString);
    } catch (error) {
      throw new Error('Invalid QR code data - decryption failed');
    }

    // Verify signature
    const { signature, ...dataToVerify } = decryptedData;
    if (!verifySignature(dataToVerify, signature)) {
      throw new Error('Invalid QR code - signature verification failed');
    }

    // Check expiration (allow 5 minute grace period)
    const now = Date.now();
    const timestamp = decryptedData.timestamp;
    const expirationTime = timestamp + QR_CODE_EXPIRATION_MS;
    if (now > expirationTime + 5 * 60 * 1000) {
      throw new Error('QR code has expired');
    }

    // Find QR code in database
    const parentQRCode = await ParentQRCode.findOne({
      parentId: decryptedData.parentId,
      studentId: decryptedData.studentId,
      relationshipId: decryptedData.relationshipId,
      isActive: true
    })
      .populate('parent', 'name email phone parentProfile')
      .populate('student', 'name email grade section classId institutionId')
      .populate('relationship', 'relationship verified verifiedAt verifiedBy');

    if (!parentQRCode) {
      throw new Error('QR code not found or inactive');
    }

    // Verify QR code is not expired
    if (parentQRCode.isExpired()) {
      throw new Error('QR code has expired');
    }

    // Log the scan
    await parentQRCode.logScan(scannedBy, location, true);

    // Get scanner details
    const scanner = await User.findById(scannedBy).select('name email role');

    logger.info(`QR code scanned by ${scanner?.name} (${scanner?.role}) for parent ${decryptedData.parentId} - student ${decryptedData.studentId}`);

    // Phase 3: Broadcast QR code scan event via Socket.io
    try {
      const io = getSocketIO();
      if (io) {
        const qrScanEvent = createQRCodeScannedEvent(
          parentQRCode._id,
          scannedBy,
          decryptedData.parentId,
          decryptedData.studentId,
          true
        );

        // Notify parent
        io.to(`user:${decryptedData.parentId}`).emit(SERVER_EVENTS.QR_CODE_SCANNED, qrScanEvent);

        // Notify teacher (scanner)
        io.to(`user:${scannedBy}`).emit(SERVER_EVENTS.QR_CODE_SCANNED, qrScanEvent);
      }
    } catch (error) {
      logger.warn('Failed to broadcast QR code scan event:', error);
    }

    // Phase 3: Send FCM notification to parent
    try {
      await sendQRCodeScannedNotification(decryptedData.parentId, {
        qrCodeId: parentQRCode._id,
        scannedBy,
        studentId: decryptedData.studentId,
        verified: true
      });
    } catch (error) {
      logger.warn('Failed to send QR code scanned FCM notification:', error);
    }

    return {
      success: true,
      parent: {
        _id: parentQRCode.parent._id,
        name: parentQRCode.parent.name,
        email: parentQRCode.parent.email,
        phone: parentQRCode.parent.phone || parentQRCode.parent.parentProfile?.phoneNumber,
        parentProfile: parentQRCode.parent.parentProfile
      },
      student: {
        _id: parentQRCode.student._id,
        name: parentQRCode.student.name,
        email: parentQRCode.student.email,
        grade: parentQRCode.student.grade,
        section: parentQRCode.student.section,
        classId: parentQRCode.student.classId,
        institutionId: parentQRCode.student.institutionId
      },
      relationship: {
        _id: parentQRCode.relationship._id,
        relationship: parentQRCode.relationship.relationship,
        verified: parentQRCode.relationship.verified,
        verifiedAt: parentQRCode.relationship.verifiedAt,
        verifiedBy: parentQRCode.relationship.verifiedBy
      },
      qrCode: {
        _id: parentQRCode._id,
        scanCount: parentQRCode.scanCount,
        lastScannedAt: parentQRCode.lastScannedAt,
        expiresAt: parentQRCode.expiresAt
      },
      scanner: {
        _id: scanner._id,
        name: scanner.name,
        email: scanner.email,
        role: scanner.role
      },
      verificationStatus: 'verified'
    };
  } catch (error) {
    logger.error('Error verifying QR code:', error);
    throw error;
  }
};

/**
 * Refresh QR code (generate new one before expiration)
 * @param {string} qrCodeId - QR code ID to refresh
 * @returns {Promise<Object>} New QR code data
 */
export const refreshQRCode = async (qrCodeId) => {
  try {
    const parentQRCode = await ParentQRCode.findById(qrCodeId)
      .populate('parent', 'name email')
      .populate('student', 'name email');

    if (!parentQRCode) {
      throw new Error('QR code not found');
    }

    // Deactivate old QR code
    await parentQRCode.deactivate();

    // Generate new QR code
    return await generateParentQRCode(parentQRCode.parentId, parentQRCode.studentId);
  } catch (error) {
    logger.error('Error refreshing QR code:', error);
    throw error;
  }
};

/**
 * Get QR codes for a student's parents
 * @param {string} studentId - Student user ID
 * @returns {Promise<Array>} Array of active QR codes
 */
export const getQRCodesForStudent = async (studentId) => {
  try {
    const qrCodes = await ParentQRCode.findActiveByStudent(studentId);

    // Generate QR images for each
    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qrCode) => {
        const qrImage = await QRCode.toDataURL(qrCode.encryptedData, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2
        });

        return {
          _id: qrCode._id,
          qrCode: qrCode.qrCode,
          qrImage,
          expiresAt: qrCode.expiresAt,
          scanCount: qrCode.scanCount,
          parent: qrCode.parent,
          relationship: qrCode.relationship
        };
      })
    );

    return qrCodesWithImages;
  } catch (error) {
    logger.error('Error getting QR codes for student:', error);
    throw error;
  }
};

/**
 * Get QR codes for a parent's children
 * @param {string} parentId - Parent user ID
 * @returns {Promise<Array>} Array of active QR codes
 */
export const getQRCodesForParent = async (parentId) => {
  try {
    const qrCodes = await ParentQRCode.findActiveByParent(parentId);

    // Generate QR images for each
    const qrCodesWithImages = await Promise.all(
      qrCodes.map(async (qrCode) => {
        const qrImage = await QRCode.toDataURL(qrCode.encryptedData, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          width: 300,
          margin: 2
        });

        return {
          _id: qrCode._id,
          qrCode: qrCode.qrCode,
          qrImage,
          expiresAt: qrCode.expiresAt,
          scanCount: qrCode.scanCount,
          student: qrCode.student,
          relationship: qrCode.relationship
        };
      })
    );

    return qrCodesWithImages;
  } catch (error) {
    logger.error('Error getting QR codes for parent:', error);
    throw error;
  }
};

/**
 * Get QR code details by ID
 * @param {string} qrCodeId - QR code ID
 * @returns {Promise<Object>} QR code details
 */
export const getQRCodeDetails = async (qrCodeId) => {
  try {
    const qrCode = await ParentQRCode.findById(qrCodeId)
      .populate('parent', 'name email phone parentProfile')
      .populate('student', 'name email grade section classId institutionId')
      .populate('relationship', 'relationship verified verifiedAt verifiedBy')
      .populate('lastScannedBy', 'name email role');

    if (!qrCode) {
      throw new Error('QR code not found');
    }

    // Generate QR image
    const qrImage = await QRCode.toDataURL(qrCode.encryptedData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    return {
      ...qrCode.toObject(),
      qrImage
    };
  } catch (error) {
    logger.error('Error getting QR code details:', error);
    throw error;
  }
};

export default {
  generateParentQRCode,
  verifyQRCode,
  refreshQRCode,
  getQRCodesForStudent,
  getQRCodesForParent,
  getQRCodeDetails
};

