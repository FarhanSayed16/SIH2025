/**
 * RBAC Refinement: Roster Management Service
 * Handles KG-4th grade students (roster records) who don't have individual logins
 */

import Class from '../models/Class.js';
import User from '../models/User.js';
import Drill from '../models/Drill.js';
import logger from '../config/logger.js';

/**
 * Create a roster record (KG-4th grade student)
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {Object} studentInfo - Student information
 * @returns {Object} Created roster record
 */
export const createRosterRecord = async (classId, teacherId, studentInfo) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Verify grade is KG-4th
    const grade = classData.grade;
    const gradeNum = grade === 'KG' ? 0 : parseInt(grade) || 0;
    
    // Only allow KG (0) and grades 1-4
    if (gradeNum < 0 || gradeNum > 4) {
      throw new Error('Roster records can only be created for KG-4th grade classes');
    }

    // Check if student already exists
    const existingStudent = await User.findOne({
      name: studentInfo.name,
      classId: classId,
      role: 'student',
      userType: 'roster_record'
    });

    if (existingStudent) {
      throw new Error('Student with this name already exists in this class');
    }

    // Create roster record (no email/password)
    const rosterRecord = await User.create({
      name: studentInfo.name,
      role: 'student',
      institutionId: classData.institutionId,
      grade: classData.grade,
      section: classData.section,
      classId: classId,
      userType: 'roster_record',
      approvalStatus: 'approved', // Roster records are auto-approved
      parentId: studentInfo.parentId || null,
      // Optional fields
      ...(studentInfo.parentName && { parentName: studentInfo.parentName }),
      ...(studentInfo.parentPhone && { parentPhone: studentInfo.parentPhone }),
      ...(studentInfo.notes && { notes: studentInfo.notes })
    });

    // Add to class
    await classData.addStudent(rosterRecord._id);

    logger.info(`Roster record created: ${rosterRecord.name} in class ${classData.classCode}`);

    return {
      student: {
        id: rosterRecord._id,
        name: rosterRecord.name,
        grade: rosterRecord.grade,
        section: rosterRecord.section,
        userType: rosterRecord.userType
      },
      class: {
        id: classData._id,
        classCode: classData.classCode
      }
    };
  } catch (error) {
    logger.error('Create roster record error:', error);
    throw error;
  }
};

/**
 * Update a roster record
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated roster record
 */
export const updateRosterRecord = async (studentId, teacherId, updates) => {
  try {
    const student = await User.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.role !== 'student' || student.userType !== 'roster_record') {
      throw new Error('This is not a roster record');
    }

    // Verify teacher owns the class
    const classData = await Class.findById(student.classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Update allowed fields
    const allowedFields = ['name', 'parentName', 'parentPhone', 'parentId', 'notes'];
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        student[field] = updates[field];
      }
    });

    await student.save();

    logger.info(`Roster record updated: ${student.name} by teacher ${teacherId}`);

    return {
      student: {
        id: student._id,
        name: student.name,
        grade: student.grade,
        section: student.section,
        userType: student.userType
      }
    };
  } catch (error) {
    logger.error('Update roster record error:', error);
    throw error;
  }
};

/**
 * Get class roster (all students: account users + roster records)
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Class with all students
 */
export const getClassRoster = async (classId, teacherId) => {
  try {
    const classData = await Class.findById(classId)
      .populate('studentIds', 'name grade section email userType approvalStatus qrCode qrBadgeId parentName parentPhone')
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name');

    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId._id.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Separate account users and roster records
    const accountUsers = classData.studentIds.filter(s => s.userType === 'account_user');
    const rosterRecords = classData.studentIds.filter(s => s.userType === 'roster_record');

    logger.info(`Roster retrieved for class ${classData.classCode}: ${accountUsers.length} account users, ${rosterRecords.length} roster records`);

    return {
      class: {
        id: classData._id,
        classCode: classData.classCode,
        grade: classData.grade,
        section: classData.section,
        teacher: classData.teacherId,
        school: classData.institutionId
      },
      students: {
        accountUsers: accountUsers.map(s => ({
          id: s._id,
          name: s.name,
          email: s.email,
          grade: s.grade,
          section: s.section,
          approvalStatus: s.approvalStatus,
          qrCode: s.qrCode,
          qrBadgeId: s.qrBadgeId
        })),
        rosterRecords: rosterRecords.map(s => ({
          id: s._id,
          name: s.name,
          grade: s.grade,
          section: s.section,
          parentName: s.parentName,
          parentPhone: s.parentPhone
        }))
      },
      summary: {
        total: classData.studentIds.length,
        accountUsers: accountUsers.length,
        rosterRecords: rosterRecords.length
      }
    };
  } catch (error) {
    logger.error('Get class roster error:', error);
    throw error;
  }
};

/**
 * Mark roster attendance during a drill
 * @param {string} classId - Class ID
 * @param {string} drillId - Drill ID
 * @param {Array} studentIds - Array of student IDs to mark
 * @param {string} status - Status: 'safe', 'missing', 'at_risk', 'evacuating'
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Updated drill participation
 */
export const markRosterAttendance = async (classId, drillId, studentIds, status, teacherId) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    const drill = await Drill.findById(drillId);

    if (!drill) {
      throw new Error('Drill not found');
    }

    if (drill.classId?.toString() !== classId) {
      throw new Error('Drill does not belong to this class');
    }

    // Update participation for each student
    const updated = [];
    for (const studentId of studentIds) {
      const participant = drill.participants.find(
        p => p.userId.toString() === studentId.toString()
      );

      if (participant) {
        participant.status = status;
        participant.acknowledgedAt = new Date();
        updated.push({
          studentId,
          status,
          acknowledgedAt: participant.acknowledgedAt
        });
      } else {
        // Add new participant if not exists
        drill.participants.push({
          userId: studentId,
          status: status,
          acknowledgedAt: new Date()
        });
        updated.push({
          studentId,
          status,
          acknowledgedAt: new Date()
        });
      }
    }

    await drill.save();

    logger.info(`Roster attendance marked: ${updated.length} students in drill ${drillId}`);

    return {
      drill: {
        id: drill._id,
        type: drill.type,
        status: drill.status
      },
      updated: updated,
      totalParticipants: drill.participants.length
    };
  } catch (error) {
    logger.error('Mark roster attendance error:', error);
    throw error;
  }
};

/**
 * Bulk check-in during drill (mark all as safe)
 * @param {string} classId - Class ID
 * @param {string} drillId - Drill ID
 * @param {Array} studentIds - Array of student IDs (optional, if not provided, all roster records)
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Bulk check-in results
 */
export const bulkCheckIn = async (classId, drillId, studentIds = null, teacherId) => {
  try {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }

    // Verify teacher owns this class
    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // If studentIds not provided, get all roster records in class
    let targetStudentIds = studentIds;
    if (!targetStudentIds || targetStudentIds.length === 0) {
      const rosterRecords = await User.find({
        classId: classId,
        role: 'student',
        userType: 'roster_record'
      });
      targetStudentIds = rosterRecords.map(s => s._id);
    }

    // Mark all as safe
    return await markRosterAttendance(classId, drillId, targetStudentIds, 'safe', teacherId);
  } catch (error) {
    logger.error('Bulk check-in error:', error);
    throw error;
  }
};

/**
 * Delete a roster record
 * @param {string} studentId - Student ID
 * @param {string} teacherId - Teacher ID (for verification)
 * @returns {Object} Deletion result
 */
export const deleteRosterRecord = async (studentId, teacherId) => {
  try {
    const student = await User.findById(studentId);

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.role !== 'student' || student.userType !== 'roster_record') {
      throw new Error('This is not a roster record');
    }

    // Verify teacher owns the class
    const classData = await Class.findById(student.classId);
    if (!classData || classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Remove from class
    await classData.removeStudent(studentId);

    // Delete student record
    await User.findByIdAndDelete(studentId);

    logger.info(`Roster record deleted: ${student.name} by teacher ${teacherId}`);

    return {
      success: true,
      message: 'Roster record deleted successfully'
    };
  } catch (error) {
    logger.error('Delete roster record error:', error);
    throw error;
  }
};

