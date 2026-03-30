import User from '../models/User.js';
import Class from '../models/Class.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import logger from '../config/logger.js';

/**
 * Generate QR code for a student
 * @param {string} studentId - Student user ID
 * @returns {Object} QR code data and image
 */
export const generateQRForStudent = async (studentId) => {
  try {
    const user = await User.findById(studentId);
    
    if (!user) {
      throw new Error('Student not found');
    }

    if (user.role !== 'student') {
      throw new Error('Only students can have QR codes');
    }

    // Generate unique QR code data
    const qrData = {
      studentId: user._id.toString(),
      classId: user.classId?.toString() || '',
      schoolId: user.institutionId?.toString() || '',
      timestamp: Date.now()
    };

    // Create hash-based QR string
    const qrString = crypto
      .createHash('sha256')
      .update(JSON.stringify(qrData))
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Generate badge ID
    const badgeId = `KAVACH-${user.grade || 'XX'}-${user.section || 'X'}-${qrString.substring(0, 6)}`;

    // Store QR code in user
    user.qrCode = qrString;
    user.qrBadgeId = badgeId;
    await user.save();

    // Generate QR image (data URL)
    const qrImage = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    logger.info(`QR generated for student: ${user.name} (${badgeId})`);

    return {
      qrCode: qrString,
      qrBadgeId: badgeId,
      qrImage,
      student: {
        id: user._id,
        name: user.name,
        grade: user.grade,
        section: user.section,
        email: user.email
      },
      class: user.classId ? {
        id: user.classId,
        classCode: (await Class.findById(user.classId))?.classCode
      } : null
    };
  } catch (error) {
    logger.error('QR generation error:', error);
    throw error;
  }
};

/**
 * Bulk generate QR codes for all students in a class
 * @param {string} classId - Class ID
 * @returns {Array} Array of QR code data
 */
export const generateQRForClass = async (classId) => {
  try {
    const classData = await Class.findById(classId).populate('studentIds');
    
    if (!classData) {
      throw new Error('Class not found');
    }

    const qrResults = [];

    for (const student of classData.studentIds) {
      try {
        const qrData = await generateQRForStudent(student._id);
        qrResults.push(qrData);
      } catch (error) {
        logger.warn(`Failed to generate QR for student ${student._id}:`, error.message);
        qrResults.push({
          error: error.message,
          student: {
            id: student._id,
            name: student.name
          }
        });
      }
    }

    logger.info(`Bulk QR generation completed for class ${classData.classCode}: ${qrResults.length} students`);

    return {
      classId: classData._id,
      classCode: classData.classCode,
      totalStudents: classData.studentIds.length,
      qrCodes: qrResults
    };
  } catch (error) {
    logger.error('Bulk QR generation error:', error);
    throw error;
  }
};

/**
 * Regenerate QR code for a student (if lost)
 * @param {string} studentId - Student user ID
 * @returns {Object} New QR code data
 */
export const regenerateQRForStudent = async (studentId) => {
  try {
    const user = await User.findById(studentId);
    
    if (!user) {
      throw new Error('Student not found');
    }

    // Clear existing QR
    user.qrCode = null;
    user.qrBadgeId = null;
    await user.save();

    // Generate new QR
    return await generateQRForStudent(studentId);
  } catch (error) {
    logger.error('QR regeneration error:', error);
    throw error;
  }
};

