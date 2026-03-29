/**
 * Parent Service
 * Handles all parent-related business logic
 * Parent Monitoring System - Phase 1
 */

import User from '../models/User.js';
import Class from '../models/Class.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import DrillLog from '../models/DrillLog.js';
import Attendance from '../models/Attendance.js';
import logger from '../config/logger.js';

/**
 * Get quick stats for a child (for dashboard display)
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} Quick stats object
 */
const getChildQuickStats = async (studentId) => {
  try {
    const student = await User.findById(studentId)
      .select('progress lastLogin updatedAt safetyStatus lastSeen')
      .lean();
    
    if (!student) {
      return {
        preparednessScore: 0,
        modulesCompleted: 0,
        lastActivity: null,
        loginStreak: 0,
        status: 'unknown'
      };
    }

    const progress = student.progress || {};
    const completedModules = progress.completedModules || [];
    
    return {
      preparednessScore: progress.preparednessScore || 0,
      modulesCompleted: completedModules.length,
      lastActivity: student.lastLogin || student.updatedAt || new Date(),
      loginStreak: progress.loginStreak || 0,
      status: student.safetyStatus || 'safe'
    };
  } catch (error) {
    logger.error('Get child quick stats error:', error);
    return {
      preparednessScore: 0,
      modulesCompleted: 0,
      lastActivity: null,
      loginStreak: 0,
      status: 'unknown'
    };
  }
};

/**
 * Get all children linked to a parent with quick stats
 * @param {string} parentId - Parent user ID
 * @returns {Promise<Array>} Array of student objects with stats
 */
export const getParentChildren = async (parentId) => {
  try {
    // Verify parent exists
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Parent not found');
    }

    // Get all verified relationships
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const relationships = await ParentStudentRel.findVerifiedByParent(parentId);

    // Extract student IDs and populate full student data
    const studentIds = relationships.map(rel => rel.studentId);
    const students = await User.find({ _id: { $in: studentIds } })
      .select('name email grade section classId institutionId qrCode qrBadgeId progress lastLogin safetyStatus lastSeen')
      .populate('classId', 'grade section classCode')
      .populate('institutionId', 'name')
      .lean();

    // Get quick stats for each child
    const childrenWithStats = await Promise.all(
      students.map(async (student) => {
        const relationship = relationships.find(rel => rel.studentId.toString() === student._id.toString());
        const stats = await getChildQuickStats(student._id);
        
        return {
          ...student,
          relationship: relationship?.relationship || 'other',
          isPrimary: relationship?.isPrimary || false,
          relationshipId: relationship?._id,
          stats // Add quick stats for dashboard
        };
      })
    );

    return childrenWithStats;
  } catch (error) {
    logger.error('Get parent children error:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific child
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} Complete child profile and progress
 */
export const getChildDetails = async (parentId, studentId) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Verify relationship
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    // Get student data
    const student = await User.findById(studentId)
      .select('name email role grade section classId institutionId qrCode qrBadgeId progress phone parentName parentPhone')
      .populate('classId', 'grade section classCode teacherId')
      .populate('institutionId', 'name address phone')
      .lean();

    if (!student) {
      throw new Error('Student not found');
    }

    // Verify it's actually a student (additional safety check)
    if (student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Get relationship details
    const relationship = await ParentStudentRel.findOne({ parentId, studentId })
      .populate('verifiedBy', 'name email role')
      .lean();

    // Get progress data
    const progress = await getChildProgressData(studentId);

    return {
      student: {
        ...student,
        relationship: relationship?.relationship || 'other',
        isPrimary: relationship?.isPrimary || false
      },
      relationship,
      progress
    };
  } catch (error) {
    logger.error('Get child details error:', error);
    throw error;
  }
};

/**
 * Get child's academic progress
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @param {Object} dateRange - Optional date range {start, end}
 * @returns {Promise<Object>} Progress metrics
 */
export const getChildProgress = async (parentId, studentId, dateRange = null) => {
  try {
    // Verify relationship
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    return await getChildProgressData(studentId, dateRange);
  } catch (error) {
    logger.error('Get child progress error:', error);
    throw error;
  }
};

/**
 * Helper function to get child progress data
 * @param {string} studentId - Student user ID
 * @param {Object} dateRange - Optional date range
 * @returns {Promise<Object>} Progress data
 */
const getChildProgressData = async (studentId, dateRange = null) => {
  const student = await User.findById(studentId)
    .select('role progress lastLogin updatedAt')
    .lean();
  if (!student || student.role !== 'student') {
    throw new Error('Student not found');
  }

  // Build date query
  const dateQuery = dateRange ? {
    completedAt: {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    }
  } : {};

  // Get quiz results
  const quizResults = await QuizResult.find({
    userId: studentId,
    ...dateQuery
  })
    .populate('moduleId', 'title category')
    .sort({ completedAt: -1 })
    .lean();

  // Get game scores
  const gameScores = await GameScore.find({
    userId: studentId,
    ...dateQuery
  })
    .sort({ completedAt: -1 })
    .lean();

  // Calculate statistics
  const totalQuizzes = quizResults.length;
  const avgQuizScore = totalQuizzes > 0
    ? quizResults.reduce((sum, q) => sum + (q.score || 0), 0) / totalQuizzes
    : 0;
  const passedQuizzes = quizResults.filter(q => q.passed).length;
  const passRate = totalQuizzes > 0 ? (passedQuizzes / totalQuizzes) * 100 : 0;

  const totalGames = gameScores.length;
  const totalXP = gameScores.reduce((sum, g) => sum + (g.xpEarned || 0), 0);
  const avgGameScore = totalGames > 0
    ? gameScores.reduce((sum, g) => sum + (g.score || 0), 0) / totalGames
    : 0;

  // Get module completion
  const completedModules = student.progress?.completedModules || [];
  const totalModules = completedModules.length;

  return {
    modules: {
      completed: totalModules,
      total: totalModules, // Will be updated when module system provides total count
      inProgress: 0 // Can be calculated from student progress
    },
    quiz: {
      totalQuizzes,
      avgScore: Math.round(avgQuizScore),
      passRate: Math.round(passRate),
      recentQuizzes: quizResults.slice(0, 10)
    },
    games: {
      totalGames,
      totalXP,
      avgScore: Math.round(avgGameScore),
      recentGames: gameScores.slice(0, 10)
    },
    progress: {
      preparednessScore: student.progress?.preparednessScore || 0,
      loginStreak: student.progress?.loginStreak || 0,
      badges: student.progress?.badges?.length || 0
    },
    lastActivity: student.lastLogin || student.updatedAt
  };
};

/**
 * Get child's current location (during drills/emergencies)
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} Location data
 */
export const getChildLocation = async (parentId, studentId) => {
  try {
    // Verify relationship
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    const student = await User.findById(studentId)
      .select('currentLocation lastLogin')
      .lean();

    if (!student) {
      throw new Error('Student not found');
    }

    // Check if student is in an active drill
    const activeDrill = await DrillLog.findOne({
      userId: studentId,
      status: { $in: ['in_progress', 'active'] }
    })
      .populate('drillId', 'type status')
      .sort({ createdAt: -1 })
      .lean();

    return {
      latitude: student.currentLocation?.coordinates?.[1] || null,
      longitude: student.currentLocation?.coordinates?.[0] || null,
      accuracy: student.currentLocation?.accuracy || null,
      timestamp: student.currentLocation?.timestamp || null,
      status: activeDrill ? 'in_drill' : (student.currentLocation ? 'safe' : 'unknown'),
      lastSeen: student.lastLogin || student.updatedAt,
      activeDrill: activeDrill ? {
        drillId: activeDrill.drillId?._id,
        drillType: activeDrill.drillId?.type,
        status: activeDrill.status
      } : null
    };
  } catch (error) {
    logger.error('Get child location error:', error);
    throw error;
  }
};

/**
 * Get child's drill participation history
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Array>} Drill participation records
 */
export const getChildDrills = async (parentId, studentId) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Verify relationship
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    const drillLogs = await DrillLog.find({ userId: studentId })
      .populate('drillId', 'type status createdAt')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return drillLogs.map(log => ({
      drillId: log.drillId?._id,
      drillType: log.drillId?.type,
      startTime: log.createdAt,
      endTime: log.completedAt,
      status: log.status,
      completionTime: log.completionTime,
      location: log.location ? {
        latitude: log.location.coordinates?.[1],
        longitude: log.location.coordinates?.[0]
      } : null
    }));
  } catch (error) {
    logger.error('Get child drills error:', error);
    throw error;
  }
};

/**
 * Get child's attendance records
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @param {string} startDate - Start date (ISO string)
 * @param {string} endDate - End date (ISO string)
 * @returns {Promise<Object>} Attendance data
 */
export const getChildAttendance = async (parentId, studentId, startDate, endDate) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Verify relationship
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    // Get student's class
    const student = await User.findById(studentId).select('classId').lean();
    if (!student || !student.classId) {
      return {
        records: [],
        statistics: {
          totalDays: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0
        }
      };
    }

    // Build date query
    const dateQuery = {};
    if (startDate) {
      dateQuery.date = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateQuery.date = { ...dateQuery.date, $lte: new Date(endDate) };
    }

    // Get attendance records
    // Find attendance records for the class and date range
    const attendanceDocs = await Attendance.find({
      classId: student.classId,
      ...dateQuery
    })
      .sort({ date: -1 })
      .lean();

    // Extract student-specific records from the attendance documents
    const attendanceRecords = [];
    for (const attendanceDoc of attendanceDocs) {
      const studentRecord = attendanceDoc.records?.find(
        r => r.studentId?.toString() === studentId.toString()
      );
      if (studentRecord) {
        attendanceRecords.push({
          _id: attendanceDoc._id,
          date: attendanceDoc.date,
          status: studentRecord.status,
          remarks: studentRecord.remarks,
          markedAt: studentRecord.markedAt || attendanceDoc.createdAt
        });
      }
    }

    // Calculate statistics
    const totalDays = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.status === 'present').length;
    const absent = attendanceRecords.filter(r => r.status === 'absent').length;
    const late = attendanceRecords.filter(r => r.status === 'late').length;
    const excused = attendanceRecords.filter(r => r.status === 'excused').length;
    const attendanceRate = totalDays > 0 ? (present / totalDays) * 100 : 0;

    return {
      records: attendanceRecords,
      statistics: {
        totalDays,
        present,
        absent,
        late,
        excused,
        attendanceRate: Math.round(attendanceRate)
      }
    };
  } catch (error) {
    logger.error('Get child attendance error:', error);
    throw error;
  }
};

/**
 * Verify student QR code and return student info if relationship exists
 * @param {string} parentId - Parent user ID
 * @param {string} qrCode - Student QR code
 * @returns {Promise<Object>} Student information if verified
 */
export const verifyStudentQR = async (parentId, qrCode) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Find student by QR code
    const student = await User.findOne({ qrCode, role: 'student', isActive: true })
      .select('name email grade section classId institutionId qrCode qrBadgeId')
      .populate('classId', 'grade section classCode')
      .populate('institutionId', 'name address phone')
      .lean();

    if (!student) {
      throw new Error('Invalid QR code or student not found');
    }

    // Check if parent is linked to this student
    const isVerified = await ParentStudentRel.isVerified(parentId, student._id);

    if (!isVerified) {
      // Return minimal info for security (don't reveal student details)
      return {
        verified: false,
        message: 'This student is not linked to your account. Please contact the school to link your account.'
      };
    }

    // Get relationship details
    const relationship = await ParentStudentRel.findOne({ parentId, studentId: student._id })
      .lean();

    // Return full student info
    return {
      verified: true,
      student: {
        ...student,
        relationship: relationship?.relationship || 'other',
        isPrimary: relationship?.isPrimary || false
      },
      relationship
    };
  } catch (error) {
    logger.error('Verify student QR error:', error);
    throw error;
  }
};

/**
 * Quick link: Link student to parent via QR code with auto-verification
 * @param {string} parentId - Parent user ID
 * @param {string} qrCode - Student QR code
 * @param {string} relationship - Relationship type
 * @returns {Promise<Object>} Link result (auto-verified or pending)
 */
export const linkStudentByQR = async (parentId, qrCode, relationship = 'other') => {
  try {
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const ParentChildLinkRequest = (await import('../models/ParentChildLinkRequest.js')).default;
    
    // Find student by QR code
    const student = await User.findOne({ qrCode, role: 'student', isActive: true })
      .select('name email grade section classId institutionId qrCode parentPhone phone')
      .populate('classId', 'grade section classCode')
      .populate('institutionId', 'name')
      .lean();

    if (!student) {
      throw new Error('Invalid QR code or student not found');
    }

    // Check if already linked
    const existing = await ParentStudentRel.findOne({ parentId, studentId: student._id });
    if (existing && existing.verified) {
      return {
        success: true,
        autoVerified: true,
        message: 'Child is already linked to your account',
        relationship: existing,
        student
      };
    }

    // Get parent info for auto-verification
    const parent = await User.findById(parentId).select('email phone institutionId').lean();
    
    // Auto-verification conditions
    const shouldAutoVerify = await checkAutoVerification(parent, student);
    
    if (shouldAutoVerify) {
      // Create verified relationship directly
      const relationshipDoc = existing || await ParentStudentRel.create({
        parentId,
        studentId: student._id,
        relationship,
        verified: true,
        verifiedBy: parentId, // Self-verified via auto-verification
        verifiedAt: new Date()
      });

      if (!existing) {
        // Update parent's childrenIds
        await User.findByIdAndUpdate(parentId, {
          $addToSet: { childrenIds: student._id }
        });
      }

      logger.info(`Child ${student._id} auto-linked to parent ${parentId} via QR`);
      
      return {
        success: true,
        autoVerified: true,
        message: 'Child linked successfully',
        relationship: relationshipDoc,
        student
      };
    }

    // Create pending request
    const existingRequest = await ParentChildLinkRequest.findOne({
      parentId,
      studentId: student._id,
      status: 'pending'
    });

    if (existingRequest) {
      return {
        success: true,
        autoVerified: false,
        message: 'Link request already pending approval',
        request: existingRequest,
        student: {
          name: student.name,
          grade: student.grade,
          section: student.section
        }
      };
    }

    const linkRequest = await ParentChildLinkRequest.create({
      parentId,
      studentId: student._id,
      requestMethod: 'qr_scan',
      relationship,
      status: 'pending',
      requestData: { qrCode }
    });

    logger.info(`Link request created: ${linkRequest._id} for parent ${parentId} and student ${student._id}`);

    return {
      success: true,
      autoVerified: false,
      message: 'Link request submitted. Awaiting approval.',
      request: linkRequest,
      student: {
        name: student.name,
        grade: student.grade,
        section: student.section
      }
    };
  } catch (error) {
    logger.error('Link student by QR error:', error);
    throw error;
  }
};

/**
 * Quick link: Link student to parent via student ID
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student ID (MongoDB ObjectId)
 * @param {string} relationship - Relationship type
 * @returns {Promise<Object>} Link result
 */
export const linkStudentById = async (parentId, studentId, relationship = 'other') => {
  try {
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const ParentChildLinkRequest = (await import('../models/ParentChildLinkRequest.js')).default;
    
    // Find student
    const student = await User.findById(studentId)
      .select('name email grade section classId institutionId parentPhone phone')
      .populate('classId', 'grade section classCode')
      .populate('institutionId', 'name')
      .lean();

    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Check if already linked
    const existing = await ParentStudentRel.findOne({ parentId, studentId });
    if (existing && existing.verified) {
      return {
        success: true,
        autoVerified: true,
        message: 'Child is already linked to your account',
        relationship: existing,
        student
      };
    }

    // Get parent info for auto-verification
    const parent = await User.findById(parentId).select('email phone institutionId').lean();
    
    // Auto-verification
    const shouldAutoVerify = await checkAutoVerification(parent, student);
    
    if (shouldAutoVerify) {
      const relationshipDoc = existing || await ParentStudentRel.create({
        parentId,
        studentId,
        relationship,
        verified: true,
        verifiedBy: parentId,
        verifiedAt: new Date()
      });

      if (!existing) {
        await User.findByIdAndUpdate(parentId, {
          $addToSet: { childrenIds: studentId }
        });
      }

      return {
        success: true,
        autoVerified: true,
        message: 'Child linked successfully',
        relationship: relationshipDoc,
        student
      };
    }

    // Create pending request
    const existingRequest = await ParentChildLinkRequest.findOne({
      parentId,
      studentId,
      status: 'pending'
    });

    if (existingRequest) {
      return {
        success: true,
        autoVerified: false,
        message: 'Link request already pending',
        request: existingRequest,
        student: {
          name: student.name,
          grade: student.grade,
          section: student.section
        }
      };
    }

    const linkRequest = await ParentChildLinkRequest.create({
      parentId,
      studentId,
      requestMethod: 'student_id',
      relationship,
      status: 'pending',
      requestData: { studentId }
    });

    return {
      success: true,
      autoVerified: false,
      message: 'Link request submitted. Awaiting approval.',
      request: linkRequest,
      student: {
        name: student.name,
        grade: student.grade,
        section: student.section
      }
    };
  } catch (error) {
    logger.error('Link student by ID error:', error);
    throw error;
  }
};

/**
 * Check if parent-student link should be auto-verified
 * @param {Object} parent - Parent user object
 * @param {Object} student - Student user object
 * @returns {Promise<boolean>} True if should auto-verify
 */
const checkAutoVerification = async (parent, student) => {
  // Condition 1: Phone number match
  if (parent.phone && student.parentPhone && parent.phone === student.parentPhone) {
    return true;
  }

  // Condition 2: Same institution (if both have institutionId)
  if (parent.institutionId && student.institutionId) {
    const parentInst = parent.institutionId.toString();
    const studentInst = student.institutionId.toString();
    if (parentInst === studentInst) {
      // Same institution - auto-verify (can be made configurable)
      return true;
    }
  }

  // Condition 3: Email domain match (if student has parent email stored)
  if (parent.email && student.email) {
    const parentDomain = parent.email.split('@')[1];
    const studentDomain = student.email.split('@')[1];
    if (parentDomain === studentDomain) {
      return true;
    }
  }

  return false;
};

/**
 * Get pending link requests for a parent
 * @param {string} parentId - Parent user ID
 * @returns {Promise<Array>} Array of pending requests
 */
export const getPendingLinkRequests = async (parentId) => {
  try {
    const ParentChildLinkRequest = (await import('../models/ParentChildLinkRequest.js')).default;
    const requests = await ParentChildLinkRequest.findPendingByParent(parentId);
    return requests;
  } catch (error) {
    logger.error('Get pending link requests error:', error);
    throw error;
  }
};

/**
 * Cancel a pending link request
 * @param {string} requestId - Request ID
 * @param {string} parentId - Parent user ID
 * @returns {Promise<Object>} Cancelled request
 */
export const cancelLinkRequest = async (requestId, parentId) => {
  try {
    const ParentChildLinkRequest = (await import('../models/ParentChildLinkRequest.js')).default;
    const request = await ParentChildLinkRequest.findOne({
      _id: requestId,
      parentId,
      status: 'pending'
    });

    if (!request) {
      throw new Error('Request not found or cannot be cancelled');
    }

    await ParentChildLinkRequest.findByIdAndDelete(requestId);
    logger.info(`Link request ${requestId} cancelled by parent ${parentId}`);
    
    return { success: true, message: 'Request cancelled successfully' };
  } catch (error) {
    logger.error('Cancel link request error:', error);
    throw error;
  }
};

/**
 * Link a child to a parent (requires admin/teacher verification)
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @param {string} relationship - Relationship type
 * @param {string} verifiedBy - Admin/Teacher ID who verifies
 * @returns {Promise<Object>} Created relationship
 */
export const linkChildToParent = async (parentId, studentId, relationship, verifiedBy) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
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

    // Check if relationship already exists
    const existing = await ParentStudentRel.findOne({ parentId, studentId });
    if (existing) {
      // Update existing relationship
      existing.relationship = relationship;
      existing.verified = true;
      existing.verifiedBy = verifiedBy;
      existing.verifiedAt = new Date();
      await existing.save();

      // Update parent's childrenIds array
      if (!parent.childrenIds.includes(studentId)) {
        parent.childrenIds.push(studentId);
        await parent.save();
      }

      return existing;
    }

    // Create new relationship
    const newRelationship = await ParentStudentRel.create({
      parentId,
      studentId,
      relationship,
      verified: true,
      verifiedBy,
      verifiedAt: new Date()
    });

    // Update parent's childrenIds array
    if (!parent.childrenIds.includes(studentId)) {
      parent.childrenIds.push(studentId);
      await parent.save();
    }

    // Update student's parentId (for backward compatibility)
    if (!student.parentId) {
      student.parentId = parentId;
      await student.save();
    }

    logger.info(`Child ${studentId} linked to parent ${parentId} by ${verifiedBy}`);
    return newRelationship;
  } catch (error) {
    logger.error('Link child to parent error:', error);
    throw error;
  }
};

/**
 * Unlink a child from a parent
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} Unlink result
 */
export const unlinkChildFromParent = async (parentId, studentId) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Verify relationship exists
    const relationship = await ParentStudentRel.findOne({ parentId, studentId });
    if (!relationship) {
      throw new Error('Relationship not found');
    }

    // Remove relationship
    await ParentStudentRel.deleteOne({ _id: relationship._id });

    // Remove from parent's childrenIds array
    await User.findByIdAndUpdate(parentId, {
      $pull: { childrenIds: studentId }
    });

    logger.info(`Child ${studentId} unlinked from parent ${parentId}`);
    
    return {
      success: true,
      message: 'Child unlinked successfully'
    };
  } catch (error) {
    logger.error('Unlink child error:', error);
    throw error;
  }
};

/**
 * Update relationship type between parent and child
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @param {string} relationship - New relationship type (father, mother, guardian, other)
 * @returns {Promise<Object>} Updated relationship
 */
export const updateRelationship = async (parentId, studentId, relationship) => {
  try {
    // Dynamic import to avoid circular dependencies
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    
    // Validate relationship type
    const validRelationships = ['father', 'mother', 'guardian', 'other'];
    if (!validRelationships.includes(relationship)) {
      throw new Error('Invalid relationship type');
    }

    // Find and update relationship
    const rel = await ParentStudentRel.findOneAndUpdate(
      { parentId, studentId },
      { relationship },
      { new: true }
    );

    if (!rel) {
      throw new Error('Relationship not found');
    }

    logger.info(`Relationship updated for parent ${parentId} and child ${studentId} to ${relationship}`);
    
    return {
      success: true,
      relationship: rel,
      message: 'Relationship updated successfully'
    };
  } catch (error) {
    logger.error('Update relationship error:', error);
    throw error;
  }
};

/**
 * Get real-time status of a child
 * @param {string} parentId - Parent user ID
 * @param {string} studentId - Student user ID
 * @returns {Promise<Object>} Child status information
 */
export const getChildRealTimeStatus = async (parentId, studentId) => {
  try {
    // Verify relationship
    const ParentStudentRel = (await import('../models/ParentStudentRelationship.js')).default;
    const isVerified = await ParentStudentRel.isVerified(parentId, studentId);
    if (!isVerified) {
      throw new Error('Unauthorized: You are not linked to this student');
    }

    // Get student with location and status
    const student = await User.findById(studentId)
      .select('name safetyStatus lastSeen currentLocation')
      .lean();

    if (!student) {
      throw new Error('Student not found');
    }

    // Get active drill if any
    const Drill = (await import('../models/Drill.js')).default;
    const activeDrill = await Drill.findOne({
      'participants.userId': studentId,
      status: { $in: ['active', 'in_progress'] }
    })
      .select('drillType status startTime')
      .lean();

    return {
      status: student.safetyStatus || 'safe',
      lastSeen: student.lastSeen || new Date(),
      location: student.currentLocation || null,
      activeDrill: activeDrill || null
    };
  } catch (error) {
    logger.error('Get child real-time status error:', error);
    throw error;
  }
};

/**
 * Get dashboard summary for all children
 * @param {string} parentId - Parent user ID
 * @returns {Promise<Object>} Dashboard summary
 */
export const getDashboardSummary = async (parentId) => {
  try {
    const children = await getParentChildren(parentId);
    const studentIds = children.map(c => c._id || c.id);
    
    // Get notifications using the notification service (in-memory for now)
    const { getParentNotifications } = await import('./parent-notification.service.js');
    const allNotifications = await getParentNotifications(parentId);
    
    // Count active alerts (from notifications)
    const activeAlerts = allNotifications.filter(n => 
      !n.read && (n.type === 'alert' || n.type === 'emergency')
    ).length;

    // Count unread notifications
    const unreadNotifications = allNotifications.filter(n => !n.read).length;

    // Count pending drills (drills with status 'scheduled' that include these students)
    const Drill = (await import('../models/Drill.js')).default;
    const pendingDrills = await Drill.countDocuments({
      status: 'scheduled',
      'participants.userId': { $in: studentIds },
      scheduledAt: { $gte: new Date() }
    }).catch(() => 0); // Return 0 if Drill model doesn't exist or query fails

    // Count active drills (drills with status 'in_progress')
    const activeDrills = await Drill.countDocuments({
      status: 'in_progress',
      'participants.userId': { $in: studentIds }
    }).catch(() => 0); // Return 0 if Drill model doesn't exist or query fails
    
    const summary = {
      totalChildren: children.length,
      safeChildren: children.filter(c => (c.stats?.status || c.safetyStatus || 'safe') === 'safe').length,
      inDrillChildren: children.filter(c => (c.stats?.status || c.safetyStatus || 'safe') === 'in_drill').length,
      emergencyChildren: children.filter(c => (c.stats?.status || c.safetyStatus || 'safe') === 'emergency').length,
      activeAlerts,
      pendingDrills,
      activeDrills,
      averagePreparednessScore: 0,
      totalModulesCompleted: 0,
      unreadNotifications
    };

    // Calculate averages
    if (children.length > 0) {
      const totalScore = children.reduce((sum, c) => sum + (c.stats?.preparednessScore || 0), 0);
      summary.averagePreparednessScore = Math.round(totalScore / children.length);
      
      const totalModules = children.reduce((sum, c) => sum + (c.stats?.modulesCompleted || 0), 0);
      summary.totalModulesCompleted = totalModules;
    }

    return summary;
  } catch (error) {
    logger.error('Get dashboard summary error:', error);
    throw error;
  }
};

/**
 * Update parent profile
 * @param {string} parentId - Parent user ID
 * @param {Object} profileData - Profile data to update (name, email, phone, parentProfile)
 * @returns {Promise<Object>} Updated parent user
 */
export const updateParentProfile = async (parentId, profileData) => {
  try {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Parent not found');
    }

    // Allowed fields for update
    const allowedFields = ['name', 'email', 'phone', 'parentProfile'];
    const updates = {};

    for (const field of allowedFields) {
      if (profileData[field] !== undefined) {
        if (field === 'parentProfile' && typeof profileData[field] === 'object') {
          // Merge parentProfile object
          updates.parentProfile = {
            ...parent.parentProfile,
            ...profileData.parentProfile
          };
        } else {
          updates[field] = profileData[field];
        }
      }
    }

    // Update user
    const updatedParent = await User.findByIdAndUpdate(
      parentId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select('-password -refreshToken')
      .populate('institutionId', 'name');

    if (!updatedParent) {
      throw new Error('Failed to update profile');
    }

    logger.info(`Parent profile updated: ${parentId}`);
    return updatedParent;
  } catch (error) {
    logger.error('Update parent profile error:', error);
    throw error;
  }
};

/**
 * Change parent password
 * @param {string} parentId - Parent user ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Success result
 */
export const changeParentPassword = async (parentId, oldPassword, newPassword) => {
  try {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      throw new Error('Parent not found');
    }

    // Verify old password
    const bcrypt = (await import('bcrypt')).default;
    const isMatch = await bcrypt.compare(oldPassword, parent.password);
    if (!isMatch) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Update password (will be hashed by pre-save hook)
    parent.password = newPassword;
    await parent.save();

    logger.info(`Password changed for parent: ${parentId}`);
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    logger.error('Change parent password error:', error);
    throw error;
  }
};

