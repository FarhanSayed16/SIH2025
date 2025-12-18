/**
 * Create Test Parent and Student Script
 * Creates test data for parent monitoring system testing
 * Run with: node scripts/create-test-parent.js
 */

// CRITICAL: Load environment variables FIRST
// Use the same env loader as the server
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

// Load .env file
dotenv.config({ path: envPath });

import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import ParentStudentRelationship from '../src/models/ParentStudentRelationship.js';
import School from '../src/models/School.js';
import Class from '../src/models/Class.js';
// Note: Password hashing is handled by User model pre-save hook

async function createTestData() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Connected to database');

    // Step 1: Get or create institution
    let institution = await School.findOne({ name: 'Test School' });
    if (!institution) {
      institution = await School.create({
        name: 'Test School',
        address: '123 Test Street',
        phone: '1234567890',
        email: 'test@school.com',
        isActive: true
      });
      console.log('✅ Created test institution:', institution._id);
    } else {
      console.log('✅ Using existing institution:', institution._id);
    }

    // Step 2: Get or create class
    let testClass = await Class.findOne({ 
      institutionId: institution._id,
      grade: '5',
      section: 'A'
    });
    if (!testClass) {
      testClass = await Class.create({
        institutionId: institution._id,
        grade: '5',
        section: 'A',
        classCode: '5A',
        isActive: true
      });
      console.log('✅ Created test class:', testClass._id);
    } else {
      console.log('✅ Using existing class:', testClass._id);
    }

    // Step 3: Create or get parent user (delete and recreate to ensure correct password)
    let parent = await User.findOne({ email: 'parent@test.com' });
    if (parent) {
      // Delete existing parent to recreate with correct password
      await User.deleteOne({ _id: parent._id });
      console.log('🔄 Deleted existing parent user to recreate with correct password');
    }
    
    // Don't hash password - User model pre-save hook will handle it
    parent = await User.create({
      name: 'Test Parent',
      email: 'parent@test.com',
      password: 'test123', // Will be hashed by pre-save hook
      role: 'parent',
      institutionId: institution._id,
      phone: '1234567890',
      isActive: true,
      approvalStatus: 'approved',
      parentProfile: {
        phoneNumber: '1234567890',
        relationship: 'father',
        verified: true,
        emergencyContact: true
      }
    });
    console.log('✅ Created parent user:', parent._id);
    console.log('   Email: parent@test.com');
    console.log('   Password: test123');

    // Step 4: Create or get student user (delete and recreate to ensure correct password)
    let student = await User.findOne({ email: 'student@test.com' });
    if (student) {
      // Delete existing student to recreate with correct password
      await User.deleteOne({ _id: student._id });
      console.log('🔄 Deleted existing student user to recreate with correct password');
    }
    
    // Don't hash password - User model pre-save hook will handle it
    const qrCode = `QR_TEST_${Date.now()}`;
    student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'test123', // Will be hashed by pre-save hook
      role: 'student',
      institutionId: institution._id,
      classId: testClass._id,
      grade: '5',
      section: 'A',
      qrCode: qrCode,
      isActive: true,
      approvalStatus: 'approved',
      accessLevel: 'teacher_led',
      canUseApp: false,
      requiresTeacherAuth: true
    });
    console.log('✅ Created student user:', student._id);
    console.log('   Email: student@test.com');
    console.log('   Password: test123');
    console.log('   QR Code:', qrCode);

    // Step 5: Create or verify relationship
    let relationship = await ParentStudentRelationship.findOne({
      parentId: parent._id,
      studentId: student._id
    });
    if (!relationship) {
      relationship = await ParentStudentRelationship.create({
        parentId: parent._id,
        studentId: student._id,
        relationship: 'father',
        isPrimary: true,
        verified: true,
        verifiedBy: parent._id, // Self-verified for testing
        verifiedAt: new Date()
      });
      console.log('✅ Created parent-student relationship:', relationship._id);
    } else {
      console.log('✅ Using existing relationship:', relationship._id);
    }

    // Step 6: Update parent's childrenIds array
    if (!parent.childrenIds.includes(student._id)) {
      parent.childrenIds.push(student._id);
      await parent.save();
      console.log('✅ Updated parent childrenIds array');
    }

    // Step 7: Update student's parentId
    if (!student.parentId || student.parentId.toString() !== parent._id.toString()) {
      student.parentId = parent._id;
      await student.save();
      console.log('✅ Updated student parentId');
    }

    // Summary
    console.log('\n========================================');
    console.log('✅ Test Data Created Successfully!');
    console.log('========================================\n');
    console.log('Parent Credentials:');
    console.log('  Email: parent@test.com');
    console.log('  Password: test123');
    console.log('  ID:', parent._id);
    console.log('\nStudent Credentials:');
    console.log('  Email: student@test.com');
    console.log('  Password: test123');
    console.log('  ID:', student._id);
    console.log('  QR Code:', student.qrCode);
    console.log('\nRelationship:');
    console.log('  ID:', relationship._id);
    console.log('  Verified:', relationship.verified);
    console.log('\nYou can now:');
    console.log('  1. Login as parent at http://localhost:3001/login');
    console.log('  2. Test parent endpoints with authentication token');
    console.log('  3. Test QR verification with QR code:', student.qrCode);
    console.log('\n========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run script
createTestData();

