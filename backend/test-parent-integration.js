/**
 * Parent API Integration Test
 * Tests parent endpoints with mock authentication
 * Parent Monitoring System - Phase 1-3 Testing
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from './src/models/User.js';
import ParentStudentRelationship from './src/models/ParentStudentRelationship.js';
import { parentApi } from './src/services/parent.service.js';

let mongoServer;
let parentUser;
let studentUser;

async function setupTestDatabase() {
  console.log('📦 Setting up test database...');
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  console.log('✅ Test database connected');
}

async function createTestUsers() {
  console.log('👥 Creating test users...');
  
  // Create parent user
  parentUser = await User.create({
    name: 'Test Parent',
    email: 'parent@test.com',
    password: 'hashedpassword',
    role: 'parent',
    institutionId: new mongoose.Types.ObjectId(),
    isActive: true,
    parentProfile: {
      phoneNumber: '1234567890',
      relationship: 'father',
      verified: true
    }
  });
  console.log(`✅ Created parent user: ${parentUser._id}`);

  // Create student user
  studentUser = await User.create({
    name: 'Test Student',
    email: 'student@test.com',
    password: 'hashedpassword',
    role: 'student',
    grade: '5',
    section: 'A',
    institutionId: parentUser.institutionId,
    classId: new mongoose.Types.ObjectId(),
    isActive: true,
    qrCode: 'TEST_QR_CODE_123'
  });
  console.log(`✅ Created student user: ${studentUser._id}`);

  // Create relationship
  const relationship = await ParentStudentRelationship.create({
    parentId: parentUser._id,
    studentId: studentUser._id,
    relationship: 'father',
    verified: true,
    verifiedBy: parentUser._id,
    verifiedAt: new Date()
  });
  console.log(`✅ Created relationship: ${relationship._id}`);
}

async function testGetParentChildren() {
  console.log('\n🧪 Testing: getParentChildren');
  try {
    const children = await parentApi.getParentChildren(parentUser._id.toString());
    console.log(`✅ Success: Found ${children.length} children`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testGetChildDetails() {
  console.log('\n🧪 Testing: getChildDetails');
  try {
    const details = await parentApi.getChildDetails(
      parentUser._id.toString(),
      studentUser._id.toString()
    );
    console.log(`✅ Success: Child details retrieved`);
    console.log(`   Student: ${details.student.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function testVerifyStudentQR() {
  console.log('\n🧪 Testing: verifyStudentQR');
  try {
    const result = await parentApi.verifyStudentQR(
      parentUser._id.toString(),
      'TEST_QR_CODE_123'
    );
    if (result.verified) {
      console.log(`✅ Success: QR verified for ${result.student?.name}`);
    } else {
      console.log(`⚠️  QR not verified: ${result.message}`);
    }
    return true;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up...');
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  console.log('✅ Cleanup complete');
}

async function runTests() {
  console.log('========================================');
  console.log('Parent API Integration Tests');
  console.log('========================================\n');

  let passed = 0;
  let total = 0;

  try {
    await setupTestDatabase();
    await createTestUsers();

    // Run tests
    total++;
    if (await testGetParentChildren()) passed++;

    total++;
    if (await testGetChildDetails()) passed++;

    total++;
    if (await testVerifyStudentQR()) passed++;

    // Summary
    console.log('\n========================================');
    console.log('Test Summary');
    console.log('========================================');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    
    if (passed === total) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed');
    }

  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    await cleanup();
  }
}

// Run tests
runTests().catch(console.error);

