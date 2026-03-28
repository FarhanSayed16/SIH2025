/**
 * RBAC Refinement: Classroom Join Service
 * Handles classroom QR code generation, scanning, and join request management
 */

import Class from '../models/Class.js';
import User from '../models/User.js';
import ClassroomJoinRequest from '../models/ClassroomJoinRequest.js';
import crypto from 'crypto';
import QRCode from 'qrcode';
import logger from '../config/logger.js';

/**
 * Generate QR code for a classroom (for student joining)
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} QR code data and image
 */
export const generateClassroomQR = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class (or class has no teacher assigned yet)
    if (classData.teacherId) {
      if (classData.teacherId.toString() !== teacherId) {
        throw new Error('Unauthorized: Teacher does not own this class');
      }
    } else {
      // Class has no teacher assigned - allow admin to generate QR, but not teachers
      // Teachers should only generate QR for classes they own
      throw new Error('Class does not have a teacher assigned. Please assign a teacher first.');
    }

    // Generate unique QR code data as JSON string (REQUIREMENT: Must be JSON, not hash)
    const qrData = {
      type: 'classroom_join',
      classId: classData._id.toString(),
      teacherId: teacherId,
      classCode: classData.classCode,
      year: new Date().getFullYear().toString(),
      timestamp: Date.now()
    };

    // REQUIREMENT: QR code MUST be JSON string, not hash
    // This allows mobile app to parse and extract classId directly
    const qrString = JSON.stringify(qrData);

    // Set expiration (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store both the JSON string and a hash for lookup
    // Hash is used for database lookup (indexed), JSON is what gets encoded in QR
    const qrHash = crypto
      .createHash('sha256')
      .update(qrString)
      .digest('hex')
      .substring(0, 32)
      .toUpperCase();

    // Update class with QR code hash (for lookup) and store JSON separately
    classData.joinQRCode = qrHash; // Store hash for indexed lookup
    classData.joinQRExpiresAt = expiresAt;
    await classData.save();

    // Generate QR image (data URL) - encode the JSON string, not the hash
    const qrImage = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });

    logger.info(`Classroom QR generated for class: ${classData.classCode} by teacher ${teacherId}`);

    return {
      qrCode: qrHash, // Return hash for API response (used for lookup)
      qrString: qrString, // Return JSON string for direct use
      qrImage,
      expiresAt,
      class: {
        id: classData._id,
        classCode: classData.classCode,
        grade: classData.grade,
        section: classData.section
      }
    };
  } catch (error) {
    logger.error('Classroom QR generation error:', error);
    throw error;
  }
};

/**
 * Scan classroom QR code and create join request
 * @param {string} qrCode - QR code string
 * @param {Object} studentInfo - Student information
 * @returns {Object} Join request data
 */
export const scanClassroomQR = async (qrCode, studentInfo) => {
  try {
    // QR code can be either:
    // 1. JSON string (from mobile scanner) - parse and extract classId
    // 2. Hash (from database lookup) - find by hash
    
    let classData;
    let parsedQR;
    
    // Try to parse as JSON first (REQUIREMENT: QR must be JSON)
    try {
      parsedQR = JSON.parse(qrCode);
      if (parsedQR.type === 'classroom_join' && parsedQR.classId) {
        // Valid JSON QR code - find class by classId
        classData = await Class.findById(parsedQR.classId)
          .populate('teacherId', 'name email');
      } else {
        throw new Error('Invalid QR code format');
      }
    } catch (parseError) {
      // Not JSON, try hash lookup (backward compatibility)
      const qrHash = crypto
        .createHash('sha256')
        .update(qrCode)
        .digest('hex')
        .substring(0, 32)
        .toUpperCase();
      
      classData = await Class.findOne({ 
        joinQRCode: qrHash,
        isActive: true
      }).populate('teacherId', 'name email');
    }

    if (!classData) {
      throw new Error('Invalid or expired classroom QR code');
    }

    // Check if QR code is expired
    if (classData.joinQRExpiresAt && classData.joinQRExpiresAt < new Date()) {
      throw new Error('Classroom QR code has expired');
    }

    // Check if student already exists
    const existingStudent = await User.findOne({
      email: studentInfo.email,
      role: 'student'
    });

    // If student exists and is already in this class, reject
    if (existingStudent && existingStudent.classId?.toString() === classData._id.toString()) {
      throw new Error('Student is already in this class');
    }
    
    // If student exists but is in a different class, allow them to request joining this class
    // (They might want to switch classes or join multiple classes)

    // Check if there's already a pending request for this student
    const existingRequest = await ClassroomJoinRequest.findOne({
      'studentInfo.email': studentInfo.email,
      classId: classData._id,
      status: 'pending'
    });

    if (existingRequest) {
      throw new Error('You already have a pending request for this class');
    }

    // Create or find student user account
    let student;
    if (existingStudent) {
      student = existingStudent;
    } else {
      // CRITICAL REFACTOR: Classroom join creates account_user if credentials provided
      // If student provides email/password, they are account_user (can login)
      const hasCredentials = !!(studentInfo.email && studentInfo.password);
      const userType = hasCredentials ? 'account_user' : 'roster_record';
      
      const studentDataToCreate = {
        name: studentInfo.name,
        role: 'student',
        institutionId: classData.institutionId,
        grade: classData.grade, // Grade is purely informational
        section: classData.section,
        classId: classData._id,
        userType: userType,
        approvalStatus: hasCredentials ? 'pending' : 'approved'
      };
      
      // Add credentials only if provided
      if (hasCredentials) {
        studentDataToCreate.email = studentInfo.email;
        studentDataToCreate.password = studentInfo.password;
      }
      
      // Add phone if provided (required for account_user, optional for roster_record)
      if (studentInfo.phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (phoneRegex.test(studentInfo.phone.trim())) {
          studentDataToCreate.phone = studentInfo.phone.trim();
        }
      }
      
      student = await User.create(studentDataToCreate);
    }

    // Create join request
    const joinRequest = await ClassroomJoinRequest.create({
      studentId: student._id,
      classId: classData._id,
      teacherId: classData.teacherId._id,
      qrCode: qrCode,
      status: 'pending',
      studentInfo: {
        name: studentInfo.name,
        email: studentInfo.email,
        phone: studentInfo.phone || null,
        parentName: studentInfo.parentName || null,
        parentPhone: studentInfo.parentPhone || null
      }
    });

    // Link request to student
    student.joinRequestId = joinRequest._id;
    await student.save();

    // Add request to class pending list
    if (!classData.pendingJoinRequests.includes(joinRequest._id)) {
      classData.pendingJoinRequests.push(joinRequest._id);
      await classData.save();
    }

    logger.info(`Join request created: Student ${studentInfo.name} -> Class ${classData.classCode}`);

    return {
      requestId: joinRequest._id,
      status: 'pending',
      message: 'Join request submitted. Waiting for teacher approval.',
      student: {
        id: student._id,
        name: student.name,
        email: student.email
      },
      class: {
        id: classData._id,
        classCode: classData.classCode,
        grade: classData.grade,
        section: classData.section
      },
      teacher: {
        id: classData.teacherId._id,
        name: classData.teacherId.name,
        email: classData.teacherId.email
      }
    };
  } catch (error) {
    logger.error('Classroom QR scan error:', error);
    throw error;
  }
};

/**
 * Get pending join requests for a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Array} Array of pending requests
 */
export const getPendingRequests = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    const requests = await ClassroomJoinRequest.findPendingByClass(classId);

    return requests.map(req => ({
      id: req._id,
      student: {
        id: req.studentId._id,
        name: req.studentId.name,
        email: req.studentId.email,
        grade: req.studentId.grade,
        section: req.studentId.section
      },
      studentInfo: req.studentInfo,
      requestedAt: req.requestedAt,
      expiresAt: req.expiresAt,
      status: req.status
    }));
  } catch (error) {
    logger.error('Get pending requests error:', error);
    throw error;
  }
};

/**
 * Approve a join request
 * @param {string} requestId - Join request ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {string} notes - Optional notes
 * @returns {Object} Updated request and student data
 */
export const approveJoinRequest = async (requestId, teacherId, notes = null) => {
  try {
    const request = await ClassroomJoinRequest.findById(requestId)
      .populate('classId')
      .populate('studentId');

    if (!request) {
      throw new Error('Join request not found');
    }

    // Verify teacher owns this class
    if (request.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    // Approve the request
    await request.approve(teacherId, notes);

    // Update student
    const student = request.studentId;
    student.approvalStatus = 'approved';
    student.approvedBy = teacherId;
    student.approvedAt = new Date();
    student.classId = request.classId._id;
    student.institutionId = request.classId.institutionId;
    student.grade = request.classId.grade;
    student.section = request.classId.section;
    
    // If student doesn't have email/password, they need to set it
    if (!student.email || !student.password) {
      // Keep pending until they set credentials
      // This will be handled in the registration flow
    }

    await student.save();

    // Add student to class
    await request.classId.addStudent(student._id);

    // Remove from pending list
    request.classId.pendingJoinRequests = request.classId.pendingJoinRequests.filter(
      id => id.toString() !== requestId.toString()
    );
    await request.classId.save();

    logger.info(`Join request approved: Student ${student.name} -> Class ${request.classId.classCode}`);

    return {
      request: {
        id: request._id,
        status: request.status,
        approvedAt: request.approvedAt
      },
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        approvalStatus: student.approvalStatus
      },
      class: {
        id: request.classId._id,
        classCode: request.classId.classCode
      }
    };
  } catch (error) {
    logger.error('Approve join request error:', error);
    throw error;
  }
};

/**
 * Reject a join request
 * @param {string} requestId - Join request ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {string} reason - Rejection reason
 * @returns {Object} Updated request data
 */
export const rejectJoinRequest = async (requestId, teacherId, reason = null) => {
  try {
    const request = await ClassroomJoinRequest.findById(requestId);

    if (!request) {
      throw new Error('Join request not found');
    }

    // Verify teacher owns this class
    if (request.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    if (request.status !== 'pending') {
      throw new Error(`Request is already ${request.status}`);
    }

    // Reject the request
    await request.reject(teacherId, reason);

    // Update student approval status
    const student = await User.findById(request.studentId);
    if (student) {
      student.approvalStatus = 'rejected';
      student.rejectionReason = reason;
      await student.save();
    }

    // Remove from pending list
    const classData = await Class.findById(request.classId);
    if (classData) {
      classData.pendingJoinRequests = classData.pendingJoinRequests.filter(
        id => id.toString() !== requestId.toString()
      );
      await classData.save();
    }

    logger.info(`Join request rejected: Request ${requestId} by teacher ${teacherId}`);

    return {
      request: {
        id: request._id,
        status: request.status,
        rejectedAt: request.rejectedAt,
        rejectionReason: request.rejectionReason
      }
    };
  } catch (error) {
    logger.error('Reject join request error:', error);
    throw error;
  }
};

/**
 * Expire a classroom QR code
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Updated class data
 */
export const expireClassroomQR = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    classData.joinQRCode = null;
    classData.joinQRExpiresAt = null;
    await classData.save();

    logger.info(`Classroom QR expired for class: ${classData.classCode}`);

    return {
      class: {
        id: classData._id,
        classCode: classData.classCode,
        joinQRCode: null
      }
    };
  } catch (error) {
    logger.error('Expire classroom QR error:', error);
    throw error;
  }
};

