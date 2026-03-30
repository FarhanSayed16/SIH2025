/**
 * Student Service
 * Handles student-specific operations like joining/leaving classes
 * PHASE 2: Updated to use ClassroomJoinRequest for class membership tracking
 */

import User from '../models/User.js';
import Class from '../models/Class.js';
import ClassroomJoinRequest from '../models/ClassroomJoinRequest.js';
import logger from '../config/logger.js';

/**
 * Join a class using classCode OR classId
 * @param {string} studentId - Student user ID
 * @param {string} classCode - Class code to join (optional)
 * @param {string} classId - Class ID to join (optional)
 * @returns {Object} Updated student object
 */
export const joinClassByCodeOrId = async (studentId, classCode, classId) => {
  try {
    let classData;

    // 1. Find class by ID or code
    if (classId) {
      classData = await Class.findById(classId);
      if (!classData) {
        throw new Error('Invalid class ID. Please check and try again.');
      }
      if (!classData.isActive) {
        throw new Error('This class is no longer active.');
      }
    } else if (classCode) {
      classData = await Class.findOne({ 
        classCode: classCode.trim(),
        isActive: true 
      });
      if (!classData) {
        throw new Error('Invalid class code. Please check and try again.');
      }
    } else {
      throw new Error('Class code or class ID is required');
    }

    // 2. Get student
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // 3. Verify student role
    if (student.role !== 'student') {
      throw new Error('Only students can join classes');
    }

    // 4. Verify student is account_user (not roster_record)
    if (student.userType !== 'account_user') {
      throw new Error('Roster records cannot join classes. Please contact your teacher.');
    }

    // 5. Check if student already has a classId
    if (student.classId) {
      const currentClass = await Class.findById(student.classId);
      
      // If already in the same class
      if (currentClass && currentClass._id.toString() === classData._id.toString()) {
        // Check ClassroomJoinRequest status
        const existingRequest = await ClassroomJoinRequest.findOne({
          classId: classData._id,
          studentId: student._id,
          status: { $in: ['pending', 'approved'] }
        });
        
        if (existingRequest) {
          if (existingRequest.status === 'approved') {
            throw new Error('You are already a member of this class.');
          } else if (existingRequest.status === 'pending') {
            throw new Error('You are already waiting for approval for this class.');
          }
        }
      } else {
        // In a different class
        throw new Error('You are already in a class. Please leave your current class first before joining a new one.');
      }
    }

    // 6. Verify institution compatibility
    // If student has institutionId, it should match class's institutionId
    if (student.institutionId) {
      if (student.institutionId.toString() !== classData.institutionId.toString()) {
        throw new Error('You cannot join a class from a different school.');
      }
    }

    // 7. PHASE 2: Check if ClassroomJoinRequest already exists
    const existingRequest = await ClassroomJoinRequest.findOne({
      classId: classData._id,
      studentId: student._id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        throw new Error('You are already a member of this class.');
      } else if (existingRequest.status === 'pending') {
        throw new Error('You already have a pending request for this class.');
      }
    }

    // 8. PHASE 2: Create ClassroomJoinRequest entry
    const joinMethod = classId ? 'qr' : 'classCode'; // Use 'qr' (not 'qrCode') to match enum
    const qrCodeValue = classId 
      ? `QR-${classData.classCode}-${Date.now()}` 
      : `CLASSCODE-${classData.classCode}-${Date.now()}`;

    const joinRequest = await ClassroomJoinRequest.create({
      studentId: student._id,
      classId: classData._id,
      teacherId: classData.teacherId,
      qrCode: qrCodeValue,
      joinMethod: joinMethod,
      status: 'pending',
      studentInfo: {
        name: student.name,
        email: student.email,
        phone: student.phone
      }
    });

    // 9. Update student with class info (for quick lookup)
    student.classId = classData._id;
    student.institutionId = classData.institutionId;
    student.grade = classData.grade;
    student.section = classData.section;
    // DO NOT change approvalStatus - it's for account approval, not class membership
    await student.save();

    // 10. Add student to class.studentIds array (if not already there)
    await classData.addStudent(studentId);

    const joinMethodText = classId ? 'QR code' : classCode;
    logger.info(`Student ${student.email} sent join request to class ${classData.classCode} via ${joinMethodText} (pending teacher approval)`);

    // Return updated student (without password)
    const studentObj = student.toJSON();
    return studentObj;
  } catch (error) {
    logger.error('Join class by code or ID error:', error);
    throw error;
  }
};

/**
 * Join a class using classCode (backward compatibility)
 * @param {string} studentId - Student user ID
 * @param {string} classCode - Class code to join
 * @returns {Object} Updated student object
 */
export const joinClassByCode = async (studentId, classCode) => {
  return joinClassByCodeOrId(studentId, classCode, null);
};

/**
 * Leave current class
 * @param {string} studentId - Student user ID
 * @returns {Object} Updated student object
 */
export const leaveClass = async (studentId) => {
  try {
    // 1. Get student
    const student = await User.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // 2. Verify student has a class
    if (!student.classId) {
      throw new Error('You are not currently in any class.');
    }

    // 3. Get class
    const classData = await Class.findById(student.classId);
    if (!classData) {
      // Class doesn't exist, just clear student's classId
      student.classId = undefined;
      student.grade = undefined;
      student.section = undefined;
      student.approvalStatus = 'approved'; // Reset to approved
      await student.save();
      return student.toJSON();
    }

    // 4. PHASE 2: Update or remove ClassroomJoinRequest
    const joinRequest = await ClassroomJoinRequest.findOne({
      classId: student.classId,
      studentId: student._id
    });

    if (joinRequest) {
      // Mark as removed/expired instead of deleting (for audit trail)
      joinRequest.status = 'expired';
      await joinRequest.save();
    }

    // 5. Remove student from class.studentIds array
    await classData.removeStudent(studentId);

    // 6. Clear student's class-related fields
    student.classId = undefined;
    student.grade = undefined;
    student.section = undefined;
    // DO NOT change approvalStatus - it's for account approval, not class membership
    // Keep institutionId (student still belongs to school)
    await student.save();

    logger.info(`Student ${student.email} left class ${classData.classCode}`);

    // Return updated student (without password)
    const studentObj = student.toJSON();
    return studentObj;
  } catch (error) {
    logger.error('Leave class error:', error);
    throw error;
  }
};

