/**
 * Phase 3.4.5: Attendance Service
 * Handles attendance marking and retrieval
 */

import Attendance from '../models/Attendance.js';
import Class from '../models/Class.js';
import logger from '../config/logger.js';

/**
 * Mark attendance for a class
 * @param {string} classId - Class ID
 * @param {string} teacherId - Teacher ID
 * @param {Date} date - Attendance date
 * @param {Array} records - Attendance records
 * @returns {Promise<Object>} Created attendance record
 */
export const markAttendance = async (classId, teacherId, date, records) => {
  try {
    // Verify teacher owns class
    const classData = await Class.findById(classId);
    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.teacherId.toString() !== teacherId) {
      throw new Error('Unauthorized: Teacher does not own this class');
    }

    // Normalize date to start of day
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists for this date
    let attendance = await Attendance.findOne({
      classId,
      date: attendanceDate
    });

    if (attendance) {
      // Update existing attendance
      attendance.records = records;
      attendance.markedBy = teacherId;
      await attendance.save();
    } else {
      // Create new attendance
      attendance = await Attendance.create({
        classId,
        institutionId: classData.institutionId,
        date: attendanceDate,
        markedBy: teacherId,
        records
      });
    }

    logger.info(`Attendance marked for class ${classId} on ${attendanceDate.toISOString()}`);

    return {
      success: true,
      attendance
    };
  } catch (error) {
    logger.error('Mark attendance error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get attendance for a class
 * @param {string} classId - Class ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Array>} Attendance records
 */
export const getClassAttendance = async (classId, startDate, endDate) => {
  try {
    const query = { classId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const attendance = await Attendance.find(query)
      .populate('markedBy', 'name email')
      .populate('records.studentId', 'name email grade section')
      .sort({ date: -1 });

    return {
      success: true,
      attendance
    };
  } catch (error) {
    logger.error('Get class attendance error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get student attendance statistics
 * @param {string} studentId - Student ID
 * @param {string} classId - Class ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Attendance statistics
 */
export const getStudentAttendanceStats = async (studentId, classId, startDate, endDate) => {
  try {
    const query = { classId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const attendance = await Attendance.find(query);
    
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;
    let total = 0;

    attendance.forEach(record => {
      const studentRecord = record.records.find(r => r.studentId.toString() === studentId);
      if (studentRecord) {
        total++;
        switch (studentRecord.status) {
          case 'present':
            present++;
            break;
          case 'absent':
            absent++;
            break;
          case 'late':
            late++;
            break;
          case 'excused':
            excused++;
            break;
        }
      }
    });

    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return {
      success: true,
      stats: {
        total,
        present,
        absent,
        late,
        excused,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    };
  } catch (error) {
    logger.error('Get student attendance stats error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  markAttendance,
  getClassAttendance,
  getStudentAttendanceStats
};

