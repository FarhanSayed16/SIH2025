/**
 * Verify Backend Setup
 * Checks if backend is properly configured and seeded
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import School from '../src/models/School.js';

dotenv.config();

console.log('🔍 Verifying Backend Setup...\n');
console.log('=' .repeat(50));
console.log('');

let issues = [];

// Test 1: MongoDB Connection
console.log('📋 Testing MongoDB Connection...');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected');
  
  // Test 2: Check for Admin User
  console.log('\n📋 Checking Seed Data...');
  const adminUser = await User.findOne({ email: 'admin@school.com' });
  if (adminUser) {
    console.log('✅ Admin user exists');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser._id}`);
  } else {
    console.log('⚠️  Admin user not found');
    issues.push('Admin user not found - run: npm run seed');
  }
  
  // Test 3: Check for Schools
  const schools = await School.find();
  if (schools.length > 0) {
    console.log(`✅ Schools found: ${schools.length}`);
    schools.forEach(school => {
      console.log(`   - ${school.name} (ID: ${school._id})`);
    });
  } else {
    console.log('⚠️  No schools found');
    issues.push('No schools found - run: npm run seed');
  }
  
  // Test 4: Check for Students
  const students = await User.find({ role: 'student' });
  if (students.length > 0) {
    console.log(`✅ Students found: ${students.length}`);
  } else {
    console.log('⚠️  No students found');
    issues.push('No students found - run: npm run seed');
  }
  
  await mongoose.connection.close();
  
} catch (error) {
  console.error('❌ MongoDB Connection Failed:', error.message);
  issues.push('MongoDB connection failed');
}

console.log('');
console.log('=' .repeat(50));
console.log('');

if (issues.length === 0) {
  console.log('✅ Backend setup is correct!');
  console.log('\n💡 To test login:');
  console.log('   Email: admin@school.com');
  console.log('   Password: (check seed.js for actual password)');
  process.exit(0);
} else {
  console.log('⚠️  Issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('\n💡 Run: npm run seed');
  process.exit(1);
}

