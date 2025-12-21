/**
 * PHASE 6: Migration Script - Convert User.approvalStatus to ClassroomJoinRequest
 * 
 * This script migrates existing class membership data from User.approvalStatus
 * to ClassroomJoinRequest model for proper separation of account approval and class membership.
 * 
 * Usage:
 *   node backend/scripts/migrate-class-membership.js
 * 
 * IMPORTANT: Run this on a development/staging database first!
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import User from '../src/models/User.js';
import Class from '../src/models/Class.js';
import ClassroomJoinRequest from '../src/models/ClassroomJoinRequest.js';

async function migrate() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find all students with classId set
    const students = await User.find({
      role: 'student',
      classId: { $exists: true, $ne: null },
      userType: 'account_user' // Only migrate account_user students
    });

    console.log(`\nFound ${students.length} students with class assignments to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const student of students) {
      try {
        const classData = await Class.findById(student.classId);
        if (!classData) {
          console.log(`⚠️  Skipping student ${student.email}: Class ${student.classId} not found`);
          skipped++;
          continue;
        }

        // Check if ClassroomJoinRequest already exists
        const existing = await ClassroomJoinRequest.findOne({
          classId: student.classId,
          studentId: student._id
        });

        if (existing) {
          console.log(`⏭️  Skipping student ${student.email}: ClassroomJoinRequest already exists`);
          skipped++;
          continue;
        }

        // Determine status based on current approvalStatus
        let status = 'pending';
        if (student.approvalStatus === 'approved') {
          status = 'approved';
        } else if (student.approvalStatus === 'rejected') {
          status = 'rejected';
        } else {
          status = 'pending';
        }

        // Create ClassroomJoinRequest entry
        await ClassroomJoinRequest.create({
          studentId: student._id,
          classId: student.classId,
          teacherId: classData.teacherId,
          qrCode: `MIGRATED-${student._id}-${Date.now()}`, // Generate unique code
          joinMethod: 'migrated',
          status: status,
          requestedAt: student.createdAt || new Date(),
          approvedAt: student.approvedAt || (status === 'approved' ? new Date() : null),
          rejectedAt: student.rejectedAt || (status === 'rejected' ? new Date() : null),
          rejectionReason: student.rejectionReason || null,
          studentInfo: {
            name: student.name,
            email: student.email,
            phone: student.phone
          }
        });

        // Set account approval to 'approved' (allow login)
        // This is safe because these are account_user students who should be able to log in
        if (student.approvalStatus !== 'approved') {
          student.approvalStatus = 'approved';
          await student.save();
          console.log(`✅ Migrated and approved student ${student.email} (was ${student.approvalStatus})`);
        } else {
          console.log(`✅ Migrated student ${student.email} (already approved)`);
        }

        migrated++;
      } catch (error) {
        console.error(`❌ Error migrating student ${student.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`✅ Migrated: ${migrated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`\n✅ Migration completed!`);

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run migration
migrate();

