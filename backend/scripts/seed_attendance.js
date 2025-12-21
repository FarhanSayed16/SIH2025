/**
 * Seed Attendance Data
 * Generates dummy attendance records for all students for the last 30 days
 * Parent Monitoring System - Issue 3 Fix
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Attendance from '../src/models/Attendance.js';
import logger from '../src/config/logger.js';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB Connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const generateAttendanceRecords = async () => {
  try {
    await connectDB();

    // Find all students
    const students = await User.find({ role: 'student', isActive: true })
      .select('_id name institutionId classId');

    if (students.length === 0) {
      logger.info('No students found. Please create students first.');
      process.exit(0);
    }

    logger.info(`Found ${students.length} students. Generating attendance records...`);

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Status options with weights (more present than absent)
    const statusOptions = [
      { status: 'present', weight: 0.85 },
      { status: 'absent', weight: 0.10 },
      { status: 'late', weight: 0.05 }
    ];

    // Helper to get weighted random status
    const getRandomStatus = () => {
      const random = Math.random();
      let cumulative = 0;
      for (const option of statusOptions) {
        cumulative += option.weight;
        if (random <= cumulative) {
          return option.status;
        }
      }
      return 'present';
    };

    let totalRecords = 0;
    let skippedRecords = 0;

    // Generate records for each student
    for (const student of students) {
      // Generate records for each day in the range
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Skip weekends (Saturday = 6, Sunday = 0)
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }

        // Check if attendance record exists for this class and date
        const dateStart = new Date(currentDate);
        dateStart.setHours(0, 0, 0, 0);
        const dateEnd = new Date(currentDate);
        dateEnd.setHours(23, 59, 59, 999);

        const existingAttendance = await Attendance.findOne({
          classId: student.classId,
          date: {
            $gte: dateStart,
            $lte: dateEnd
          }
        });

        if (existingAttendance) {
          // Check if student record already exists in this attendance
          const studentRecordExists = existingAttendance.records.some(
            r => r.studentId.toString() === student._id.toString()
          );

          if (studentRecordExists) {
            skippedRecords++;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
          }

          // Add student record to existing attendance
          existingAttendance.records.push({
            studentId: student._id,
            status: getRandomStatus(),
            remarks: 'System generated',
            markedAt: new Date()
          });
          await existingAttendance.save();
          totalRecords++;
        } else {
          // Create new attendance record for the class
          const attendanceRecord = new Attendance({
            classId: student.classId,
            institutionId: student.institutionId,
            date: new Date(currentDate),
            markedBy: student.institutionId, // System-generated
            records: [{
              studentId: student._id,
              status: getRandomStatus(),
              remarks: 'System generated',
              markedAt: new Date()
            }]
          });

          await attendanceRecord.save();
          totalRecords++;
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    logger.info(`✅ Attendance seeding complete!`);
    logger.info(`   Total records created: ${totalRecords}`);
    logger.info(`   Records skipped (already exist): ${skippedRecords}`);
    logger.info(`   Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding attendance:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the seed
generateAttendanceRecords();

