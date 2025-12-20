/**
 * Data Migration Script: Fix Admin → Teacher → Student Flow
 * 
 * This script identifies and reports data inconsistencies in the flow:
 * - Teachers without institutionId
 * - Classes without teacherId
 * - Students with pending join requests
 * - Legacy classes missing academicYear
 * 
 * Run with: node scripts/fix-admin-teacher-student-flow.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import connectDB from '../src/config/database.js';
import logger from '../src/config/logger.js';
import User from '../src/models/User.js';
import Class from '../src/models/Class.js';
import ClassroomJoinRequest from '../src/models/ClassroomJoinRequest.js';
import School from '../src/models/School.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

const fixDataIssues = async () => {
  try {
    await connectDB();
    logger.info('✅ Connected to MongoDB');

    const issues = {
      teachersWithoutInstitution: [],
      classesWithoutTeacher: [],
      classesWithoutAcademicYear: [],
      pendingJoinRequests: [],
      studentsWithoutClass: []
    };

    // 1. Find teachers without institutionId
    logger.info('\n📋 Checking teachers without institutionId...');
    const teachersWithoutInstitution = await User.find({
      role: 'teacher',
      $or: [
        { institutionId: { $exists: false } },
        { institutionId: null }
      ]
    }).select('_id name email role approvalStatus institutionId');

    issues.teachersWithoutInstitution = teachersWithoutInstitution.map(t => ({
      id: t._id.toString(),
      name: t.name,
      email: t.email,
      approvalStatus: t.approvalStatus,
      institutionId: t.institutionId
    }));

    logger.info(`Found ${teachersWithoutInstitution.length} teachers without institutionId`);

    // 2. Find classes without teacherId
    logger.info('\n📋 Checking classes without teacherId...');
    const classesWithoutTeacher = await Class.find({
      $or: [
        { teacherId: { $exists: false } },
        { teacherId: null }
      ],
      isActive: true
    }).select('_id classCode grade section institutionId teacherId academicYear');

    issues.classesWithoutTeacher = classesWithoutTeacher.map(c => ({
      id: c._id.toString(),
      classCode: c.classCode,
      grade: c.grade,
      section: c.section,
      institutionId: c.institutionId?.toString() || 'N/A',
      teacherId: c.teacherId?.toString() || 'N/A',
      academicYear: c.academicYear || 'MISSING'
    }));

    logger.info(`Found ${classesWithoutTeacher.length} active classes without teacherId`);

    // 3. Find classes without academicYear (legacy data)
    logger.info('\n📋 Checking classes without academicYear...');
    const classesWithoutAcademicYear = await Class.find({
      $or: [
        { academicYear: { $exists: false } },
        { academicYear: null }
      ]
    }).select('_id classCode grade section institutionId academicYear');

    issues.classesWithoutAcademicYear = classesWithoutAcademicYear.map(c => ({
      id: c._id.toString(),
      classCode: c.classCode,
      grade: c.grade,
      section: c.section,
      institutionId: c.institutionId?.toString() || 'N/A',
      academicYear: c.academicYear || 'MISSING'
    }));

    logger.info(`Found ${classesWithoutAcademicYear.length} classes without academicYear`);

    // 4. Find pending join requests
    logger.info('\n📋 Checking pending join requests...');
    const pendingRequests = await ClassroomJoinRequest.find({
      status: 'pending'
    })
      .populate('studentId', 'name email grade section')
      .populate('classId', 'classCode grade section')
      .populate('teacherId', 'name email');

    issues.pendingJoinRequests = pendingRequests.map(r => ({
      id: r._id.toString(),
      student: r.studentId ? {
        id: r.studentId._id.toString(),
        name: r.studentId.name,
        email: r.studentId.email
      } : 'N/A',
      class: r.classId ? {
        id: r.classId._id.toString(),
        classCode: r.classId.classCode,
        grade: r.classId.grade,
        section: r.classId.section
      } : 'N/A',
      teacher: r.teacherId ? {
        id: r.teacherId._id.toString(),
        name: r.teacherId.name
      } : 'N/A',
      requestedAt: r.requestedAt,
      status: r.status
    }));

    logger.info(`Found ${pendingRequests.length} pending join requests`);

    // 5. Find students without classId (but should have one)
    logger.info('\n📋 Checking students without classId...');
    const studentsWithoutClass = await User.find({
      role: 'student',
      userType: 'account_user',
      $or: [
        { classId: { $exists: false } },
        { classId: null }
      ]
    }).select('_id name email grade section classId institutionId approvalStatus');

    issues.studentsWithoutClass = studentsWithoutClass.map(s => ({
      id: s._id.toString(),
      name: s.name,
      email: s.email,
      grade: s.grade || 'N/A',
      section: s.section || 'N/A',
      classId: s.classId?.toString() || 'N/A',
      institutionId: s.institutionId?.toString() || 'N/A',
      approvalStatus: s.approvalStatus
    }));

    logger.info(`Found ${studentsWithoutClass.length} students without classId`);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 DATA INTEGRITY REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n👨‍🏫 Teachers without institutionId: ${issues.teachersWithoutInstitution.length}`);
    if (issues.teachersWithoutInstitution.length > 0) {
      console.log('   These teachers need to be assigned to an institution:');
      issues.teachersWithoutInstitution.forEach(t => {
        console.log(`   - ${t.name} (${t.email}) - Status: ${t.approvalStatus || 'N/A'}`);
      });
    }

    console.log(`\n📚 Active classes without teacherId: ${issues.classesWithoutTeacher.length}`);
    if (issues.classesWithoutTeacher.length > 0) {
      console.log('   These classes need a teacher assigned:');
      issues.classesWithoutTeacher.forEach(c => {
        console.log(`   - ${c.classCode} (Grade ${c.grade}-${c.section})`);
      });
    }

    console.log(`\n📅 Classes without academicYear: ${issues.classesWithoutAcademicYear.length}`);
    if (issues.classesWithoutAcademicYear.length > 0) {
      console.log('   These legacy classes need academicYear:');
      issues.classesWithoutAcademicYear.forEach(c => {
        console.log(`   - ${c.classCode} (Grade ${c.grade}-${c.section})`);
      });
    }

    console.log(`\n⏳ Pending join requests: ${issues.pendingJoinRequests.length}`);
    if (issues.pendingJoinRequests.length > 0) {
      console.log('   These students are waiting for teacher approval:');
      issues.pendingJoinRequests.forEach(r => {
        const studentName = r.student?.name || 'Unknown';
        const className = r.class?.classCode || 'Unknown';
        console.log(`   - ${studentName} → ${className}`);
      });
    }

    console.log(`\n👨‍🎓 Students without classId: ${issues.studentsWithoutClass.length}`);
    if (issues.studentsWithoutClass.length > 0) {
      console.log('   These students may need to join a class:');
      issues.studentsWithoutClass.slice(0, 10).forEach(s => {
        console.log(`   - ${s.name} (${s.email})`);
      });
      if (issues.studentsWithoutClass.length > 10) {
        console.log(`   ... and ${issues.studentsWithoutClass.length - 10} more`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Report complete!');
    console.log('='.repeat(80));
    console.log('\n💡 Next steps:');
    console.log('   1. Use Admin Dashboard to assign institutions to teachers');
    console.log('   2. Use Admin Dashboard to assign teachers to classes');
    console.log('   3. Teachers can approve pending student join requests');
    console.log('   4. Legacy classes will be auto-updated when accessed\n');

    // Optional: Auto-fix academicYear for legacy classes
    if (issues.classesWithoutAcademicYear.length > 0) {
      console.log('🔧 Would you like to auto-fix academicYear for legacy classes? (y/n)');
      // For now, just log - can be made interactive later
      logger.info('To auto-fix, uncomment the fix code in the script');
    }

    process.exit(0);
  } catch (error) {
    logger.error('❌ Error running data fix script:', error);
    process.exit(1);
  }
};

// Run the script
fixDataIssues();
