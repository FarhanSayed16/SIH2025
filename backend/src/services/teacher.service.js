import Class from '../models/Class.js';
import User from '../models/User.js';
import Drill from '../models/Drill.js';
import QuizResult from '../models/QuizResult.js';
import GameScore from '../models/GameScore.js';
import Module from '../models/Module.js';
import ClassroomJoinRequest from '../models/ClassroomJoinRequest.js';
import ParentStudentRelationship from '../models/ParentStudentRelationship.js';
import ParentQRCode from '../models/ParentQRCode.js';
import logger from '../config/logger.js';

/**
 * Get all classes for a teacher
 * @param {string} teacherId - Teacher user ID
 * @returns {Array} Array of classes
 */
export const getTeacherClasses = async (teacherId) => {
  try {
    // PHASE 1.1: Consistent query - only active classes assigned to this teacher
    const classes = await Class.find({ 
      teacherId: teacherId, // Explicit match
      isActive: true 
    })
      .populate('studentIds', 'name grade section email qrCode qrBadgeId')
      .populate('deviceIds', 'deviceName deviceType')
      .populate('institutionId', 'name')
      .populate('teacherId', 'name email') // Populate teacher for consistency
      .sort({ grade: 1, section: 1 });

    logger.info(`Retrieved ${classes.length} classes for teacher ${teacherId} - query: { teacherId: ${teacherId}, isActive: true }`);
    return classes;
  } catch (error) {
    logger.error('Get teacher classes error:', error);
    throw error;
  }
};

/**
 * Get students in a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Class with students
 */
export const getClassStudents = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId)
      .populate('studentIds', 'name grade section email qrCode qrBadgeId accessLevel canUseApp')
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name');

    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId._id.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    logger.info(`Retrieved ${classData.studentIds.length} students for class ${classId}`);
    return classData;
  } catch (error) {
    logger.error('Get class students error:', error);
    throw error;
  }
};

/**
 * PHASE 2: Get pending students for a class (using ClassroomJoinRequest)
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Array} Array of pending students
 */
export const getPendingStudents = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId)
      .populate('teacherId', 'name email');

    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId._id.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // PHASE 2: Query ClassroomJoinRequest instead of User.approvalStatus
    const pendingRequests = await ClassroomJoinRequest.find({
      classId: classId,
      status: 'pending',
      expiresAt: { $gt: new Date() } // Not expired
    })
      .populate('studentId', 'name email grade section phone createdAt')
      .sort({ requestedAt: -1 });

    // Format response
    const pendingStudents = pendingRequests.map(req => ({
      id: req.studentId._id,
      name: req.studentId.name,
      email: req.studentId.email,
      grade: req.studentId.grade,
      section: req.studentId.section,
      phone: req.studentId.phone,
      createdAt: req.studentId.createdAt,
      requestedAt: req.requestedAt,
      joinMethod: req.joinMethod || 'classCode'
    }));

    logger.info(`Retrieved ${pendingStudents.length} pending students for class ${classId}`);
    return pendingStudents;
  } catch (error) {
    logger.error('Get pending students error:', error);
    throw error;
  }
};

/**
 * PHASE 2: Approve a student (using ClassroomJoinRequest)
 * @param {string} classId - Class ID
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {string} notes - Optional notes
 * @returns {Object} Updated student
 */
export const approveStudent = async (classId, studentId, teacherId, notes = null) => {
  try {
    const classData = await Class.findById(classId);

    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // PHASE 2: Find ClassroomJoinRequest instead of checking User.approvalStatus
    const joinRequest = await ClassroomJoinRequest.findOne({
      classId: classId,
      studentId: studentId,
      status: 'pending'
    });

    if (!joinRequest) {
      throw new Error('Student has not requested to join this class or request is already processed');
    }

    // Verify teacher owns this class (double check)
    if (joinRequest.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // PHASE 2: Approve the ClassroomJoinRequest
    await joinRequest.approve(teacherId, notes);

    // Find student for response
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Update student's classId if not already set (should already be set during join)
    if (!student.classId || student.classId.toString() !== classId) {
      student.classId = classId;
      student.institutionId = classData.institutionId;
      student.grade = classData.grade;
      student.section = classData.section;
      await student.save();
    }

    // DO NOT change User.approvalStatus - it's for account approval, not class membership

    logger.info(`Student ${student.email} approved by teacher ${teacherId} for class ${classId}`);
    
    // Return updated student (without password)
    const studentObj = student.toJSON();
    return studentObj;
  } catch (error) {
    logger.error('Approve student error:', error);
    throw error;
  }
};

/**
 * PHASE 2: Reject a student (using ClassroomJoinRequest)
 * @param {string} classId - Class ID
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {string} reason - Optional rejection reason
 * @returns {Object} Updated student
 */
export const rejectStudent = async (classId, studentId, teacherId, reason = null) => {
  try {
    const classData = await Class.findById(classId);

    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // PHASE 2: Find ClassroomJoinRequest instead of checking User.approvalStatus
    const joinRequest = await ClassroomJoinRequest.findOne({
      classId: classId,
      studentId: studentId,
      status: 'pending'
    });

    if (!joinRequest) {
      throw new Error('Student has not requested to join this class or request is already processed');
    }

    // Verify teacher owns this class (double check)
    if (joinRequest.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // PHASE 2: Reject the ClassroomJoinRequest
    await joinRequest.reject(teacherId, reason || 'Rejected by teacher');

    // Find student for response
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Remove student from class if they were added
    if (student.classId?.toString() === classId) {
      // Remove from class.studentIds array
      classData.studentIds = classData.studentIds.filter(
        id => id.toString() !== studentId
      );
      await classData.save();

      // Clear student's class-related fields
      student.classId = undefined;
      student.grade = undefined;
      student.section = undefined;
      await student.save();
    }

    // DO NOT change User.approvalStatus - it's for account approval, not class membership

    logger.info(`Student ${student.email} rejected by teacher ${teacherId} for class ${classId}`);
    
    // Return updated student (without password)
    const studentObj = student.toJSON();
    return studentObj;
  } catch (error) {
    logger.error('Reject student error:', error);
    throw error;
  }
};

/**
 * Start a drill for a class
 * Phase 1: Enhanced with proper drill service, notifications, and real-time updates
 * @param {string} classId - Class ID
 * @param {string} drillType - Type of drill
 * @param {string} teacherId - Teacher ID
 * @returns {Object} Created and triggered drill
 */
export const startClassDrill = async (classId, drillType, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Phase 1: Use drill service to schedule and trigger drill properly
    const { scheduleDrill, triggerDrill } = await import('./drill.service.js');
    
    // Schedule drill for immediate start
    const scheduledDrill = await scheduleDrill({
      institutionId: classData.institutionId,
      type: drillType,
      scheduledAt: new Date(), // Immediate
      duration: 10, // Default 10 minutes
      participantSelection: {
        type: 'class',
        classIds: [classId]
      },
      triggeredBy: teacherId
    });

    // Immediately trigger the drill
    const drill = await triggerDrill(scheduledDrill._id, teacherId);

    logger.info(`Drill started for class ${classId} by teacher ${teacherId} - Drill ID: ${drill._id}`);

    // Phase 1: Broadcast drill start via Socket.io
    try {
      const { broadcastDrillStart } = await import('./crisisAlert.service.js');
      await broadcastDrillStart(drill);
    } catch (error) {
      logger.warn('Failed to broadcast drill start:', error);
      // Don't fail the request if broadcast fails
    }

    // Phase 1: Send FCM push notifications
    try {
      const { sendDrillStartNotification } = await import('./fcm.service.js');
      await sendDrillStartNotification(drill);
    } catch (error) {
      logger.warn('Failed to send drill start push notification:', error);
      // Don't fail the request if push notification fails
    }

    return drill;
  } catch (error) {
    logger.error('Start class drill error:', error);
    throw error;
  }
};

/**
 * Mark student participation in a drill/activity
 * @param {string} classId - Class ID
 * @param {string} studentId - Student ID
 * @param {boolean} participated - Whether student participated
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Updated participation record
 */
export const markParticipation = async (classId, studentId, participated, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Verify student is in class
    if (!classData.studentIds.includes(studentId)) {
      throw new Error('Student is not in this class');
    }

    // This would typically update a participation record
    // For now, we'll just log it
    logger.info(`Participation marked: Student ${studentId} in class ${classId} - ${participated ? 'Participated' : 'Did not participate'}`);

    return {
      classId,
      studentId,
      participated,
      markedBy: teacherId,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Mark participation error:', error);
    throw error;
  }
};

/**
 * Get class analytics
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Class analytics
 */
export const getClassAnalytics = async (classId, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Get recent drills for this class
    const recentDrills = await Drill.find({
      classId,
      status: 'completed'
    })
      .sort({ createdAt: -1 })
      .limit(10);

    // Calculate statistics
    const totalDrills = recentDrills.length;
    const avgParticipation = recentDrills.length > 0
      ? recentDrills.reduce((sum, drill) => {
          const participants = drill.participants || [];
          const participated = participants.filter(p => p.status === 'completed').length;
          return sum + (participated / participants.length || 0);
        }, 0) / recentDrills.length
      : 0;

    return {
      classId,
      totalStudents: classData.studentIds.length,
      totalDrills,
      avgParticipation: Math.round(avgParticipation * 100),
      recentDrills: recentDrills.map(drill => ({
        id: drill._id,
        type: drill.type,
        date: drill.createdAt,
        participation: drill.results?.participationRate || 0
      }))
    };
  } catch (error) {
    logger.error('Get class analytics error:', error);
    throw error;
  }
};

/**
 * Get student progress overview for a class
 * Phase 3.4.5: Enhanced student progress tracking
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Student progress data
 */
export const getStudentProgress = async (classId, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId)
      .populate('studentIds', 'name email grade section progress');
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    const studentIds = classData.studentIds.map(s => s._id);

    // Get quiz results for all students
    const quizResults = await QuizResult.find({
      userId: { $in: studentIds },
      institutionId: classData.institutionId
    })
      .populate('moduleId', 'title')
      .sort({ completedAt: -1 });

    // Get game scores for all students
    const gameScores = await GameScore.find({
      userId: { $in: studentIds },
      institutionId: classData.institutionId
    })
      .sort({ completedAt: -1 });

    // Aggregate progress by student
    const progressByStudent = {};

    classData.studentIds.forEach(student => {
      progressByStudent[student._id] = {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          grade: student.grade,
          section: student.section
        },
        modules: {
          completed: 0,
          inProgress: 0,
          total: 0,
          averageScore: 0
        },
        games: {
          played: 0,
          totalXP: 0,
          averageScore: 0
        },
        preparednessScore: student.progress?.preparednessScore || 0,
        badges: student.progress?.badges?.length || 0
      };
    });

    // Process quiz results
    quizResults.forEach(result => {
      const studentId = result.userId.toString();
      if (progressByStudent[studentId]) {
        progressByStudent[studentId].modules.completed++;
        progressByStudent[studentId].modules.total++;
      }
    });

    // Process game scores
    const studentXP = {};
    const studentGameScores = {};
    gameScores.forEach(score => {
      const studentId = score.userId.toString();
      if (progressByStudent[studentId]) {
        progressByStudent[studentId].games.played++;
        progressByStudent[studentId].games.totalXP += score.xpEarned || 0;
        
        if (!studentGameScores[studentId]) {
          studentGameScores[studentId] = [];
        }
        studentGameScores[studentId].push(score.score);
      }
    });

    // Calculate averages
    Object.keys(progressByStudent).forEach(studentId => {
      const progress = progressByStudent[studentId];
      
      // Calculate average game score
      if (studentGameScores[studentId] && studentGameScores[studentId].length > 0) {
        const scores = studentGameScores[studentId];
        progress.games.averageScore = Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        );
      }
    });

    return {
      classId,
      totalStudents: classData.studentIds.length,
      students: Object.values(progressByStudent)
    };
  } catch (error) {
    logger.error('Get student progress error:', error);
    throw error;
  }
};

/**
 * Phase 1: Get all parents for a specific student
 * @param {string} studentId - Student user ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Promise<Array>} Array of parent objects with relationship details
 */
export const getStudentParents = async (studentId, teacherId) => {
  try {
    // Verify student exists and get their class
    const student = await User.findById(studentId)
      .populate('classId', 'teacherId grade section');
    
    if (!student || student.role !== 'student') {
      throw new Error('Student not found');
    }

    // Verify teacher has access to this student (either owns the class or is admin)
    if (student.classId) {
      const classData = await Class.findById(student.classId);
      if (classData && classData.teacherId.toString() !== teacherId) {
        // Check if teacher is admin
        const teacher = await User.findById(teacherId);
        if (!teacher || (teacher.role !== 'admin' && teacher.role !== 'SYSTEM_ADMIN')) {
          throw new Error('Unauthorized: Teacher does not have access to this student');
        }
      }
    } else {
      // Student has no class - only admin can access
      const teacher = await User.findById(teacherId);
      if (!teacher || (teacher.role !== 'admin' && teacher.role !== 'SYSTEM_ADMIN')) {
        throw new Error('Unauthorized: Student has no class assigned');
      }
    }

    // Get all verified parent relationships for this student
    const relationships = await ParentStudentRelationship.find({
      studentId,
      verified: true
    })
      .populate('parentId', 'name email phone parentProfile')
      .populate('verifiedBy', 'name email role')
      .populate('qrCodeId')
      .sort({ isPrimary: -1, createdAt: 1 });

    // Format response
    const parents = await Promise.all(
      relationships.map(async (rel) => {
        const parent = rel.parentId;
        let qrCode = null;

        // Get active QR code if exists
        if (rel.qrCodeId) {
          try {
            const qrCodeDoc = await ParentQRCode.findById(rel.qrCodeId);
            if (qrCodeDoc && qrCodeDoc.isValid()) {
              qrCode = {
                _id: qrCodeDoc._id,
                expiresAt: qrCodeDoc.expiresAt,
                scanCount: qrCodeDoc.scanCount,
                lastScannedAt: qrCodeDoc.lastScannedAt
              };
            }
          } catch (error) {
            logger.warn(`Error fetching QR code for relationship ${rel._id}:`, error);
          }
        }

        return {
          _id: parent._id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone || parent.parentProfile?.phoneNumber,
          parentProfile: {
            relationship: parent.parentProfile?.relationship || rel.relationship,
            verified: parent.parentProfile?.verified || rel.verified,
            emergencyContact: parent.parentProfile?.emergencyContact || true
          },
          relationship: {
            _id: rel._id,
            relationship: rel.relationship,
            isPrimary: rel.isPrimary,
            verified: rel.verified,
            verifiedAt: rel.verifiedAt,
            verifiedBy: rel.verifiedBy ? {
              _id: rel.verifiedBy._id,
              name: rel.verifiedBy.name,
              email: rel.verifiedBy.email,
              role: rel.verifiedBy.role
            } : null,
            verificationMethod: rel.verificationMethod || 'manual',
            lastVerifiedAt: rel.lastVerifiedAt,
            qrCode
          }
        };
      })
    );

    logger.info(`Retrieved ${parents.length} parents for student ${studentId}`);
    return parents;
  } catch (error) {
    logger.error('Get student parents error:', error);
    throw error;
  }
};

/**
 * Phase 1: Get all parents for all students in a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Promise<Object>} Object with parents array and summary
 */
export const getClassParents = async (classId, teacherId) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId)
      .populate('studentIds', 'name email grade section')
      .populate('teacherId', 'name email');

    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId._id.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    const studentIds = classData.studentIds.map(s => s._id);

    // Get all parent relationships for students in this class
    const relationships = await ParentStudentRelationship.find({
      studentId: { $in: studentIds },
      verified: true
    })
      .populate('parentId', 'name email phone parentProfile')
      .populate('studentId', 'name email grade section')
      .populate('verifiedBy', 'name email role')
      .populate('qrCodeId')
      .sort({ createdAt: 1 });

    // Group parents by parent ID (one parent can have multiple children)
    const parentMap = new Map();

    for (const rel of relationships) {
      const parentId = rel.parentId._id.toString();
      
      if (!parentMap.has(parentId)) {
        parentMap.set(parentId, {
          parent: {
            _id: rel.parentId._id,
            name: rel.parentId.name,
            email: rel.parentId.email,
            phone: rel.parentId.phone || rel.parentId.parentProfile?.phoneNumber,
            parentProfile: {
              relationship: rel.parentId.parentProfile?.relationship,
              verified: rel.parentId.parentProfile?.verified || rel.verified,
              emergencyContact: rel.parentId.parentProfile?.emergencyContact || true
            }
          },
          students: [],
          relationships: []
        });
      }

      const parentData = parentMap.get(parentId);
      
      // Add student to list if not already added
      const studentExists = parentData.students.some(
        s => s._id.toString() === rel.studentId._id.toString()
      );
      
      if (!studentExists) {
        parentData.students.push({
          _id: rel.studentId._id,
          name: rel.studentId.name,
          email: rel.studentId.email,
          grade: rel.studentId.grade,
          section: rel.studentId.section
        });
      }

      // Add relationship details
      let qrCode = null;
      if (rel.qrCodeId) {
        try {
          const qrCodeDoc = await ParentQRCode.findById(rel.qrCodeId);
          if (qrCodeDoc && qrCodeDoc.isValid()) {
            qrCode = {
              _id: qrCodeDoc._id,
              expiresAt: qrCodeDoc.expiresAt,
              scanCount: qrCodeDoc.scanCount
            };
          }
        } catch (error) {
          logger.warn(`Error fetching QR code for relationship ${rel._id}:`, error);
        }
      }

      parentData.relationships.push({
        _id: rel._id,
        studentId: rel.studentId._id,
        relationship: rel.relationship,
        isPrimary: rel.isPrimary,
        verified: rel.verified,
        verifiedAt: rel.verifiedAt,
        verifiedBy: rel.verifiedBy ? {
          _id: rel.verifiedBy._id,
          name: rel.verifiedBy.name,
          email: rel.verifiedBy.email,
          role: rel.verifiedBy.role
        } : null,
        verificationMethod: rel.verificationMethod || 'manual',
        qrCode
      });
    }

    const parents = Array.from(parentMap.values());

    // Calculate summary
    const summary = {
      totalParents: parents.length,
      verifiedParents: parents.filter(p => p.parent.parentProfile.verified).length,
      unverifiedParents: parents.filter(p => !p.parent.parentProfile.verified).length,
      totalRelationships: relationships.length,
      parentsWithMultipleChildren: parents.filter(p => p.students.length > 1).length
    };

    logger.info(`Retrieved ${parents.length} parents for class ${classId} (${summary.totalRelationships} relationships)`);

    return {
      classId,
      classCode: classData.classCode,
      grade: classData.grade,
      section: classData.section,
      parents,
      summary
    };
  } catch (error) {
    logger.error('Get class parents error:', error);
    throw error;
  }
};

/**
 * Phase 1: Verify parent by QR code scan
 * @param {string} qrCodeData - Encrypted QR code data
 * @param {string} teacherId - Teacher ID who scanned
 * @param {Object} location - Optional location data {lat, lng}
 * @returns {Promise<Object>} Verification result
 */
export const verifyParentByQR = async (qrCodeData, teacherId, location = null) => {
  try {
    // Verify teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'admin' && teacher.role !== 'SYSTEM_ADMIN')) {
      throw new Error('Unauthorized: Only teachers and admins can verify parents');
    }

    // Use QR code service to verify
    const { verifyQRCode } = await import('./parent-qr-code.service.js');
    const verificationResult = await verifyQRCode(qrCodeData, teacherId, location);

    // Update relationship verification history
    if (verificationResult.relationship._id) {
      const relationship = await ParentStudentRelationship.findById(verificationResult.relationship._id);
      if (relationship) {
        // Add to verification history
        relationship.verificationHistory.push({
          verifiedAt: new Date(),
          verifiedBy: teacherId,
          method: 'qr_scan',
          notes: 'Verified via QR code scan'
        });

        relationship.lastVerifiedAt = new Date();
        relationship.verificationMethod = 'qr_scan';
        
        await relationship.save();

        // Phase 3: Send verification approved notification to parent
        try {
          const { sendParentVerificationApprovedNotification } = await import('./fcm.service.js');
          await sendParentVerificationApprovedNotification(
            verificationResult.parent._id.toString(),
            {
              studentId: verificationResult.student._id,
              verifiedBy: teacherId,
              verificationMethod: 'qr_scan'
            }
          );
        } catch (error) {
          logger.warn('Failed to send verification approved notification:', error);
        }
      }
    }

    logger.info(`Parent verified via QR code by teacher ${teacherId}`);

    return verificationResult;
  } catch (error) {
    logger.error('Error verifying parent by QR code:', error);
    throw error;
  }
};

