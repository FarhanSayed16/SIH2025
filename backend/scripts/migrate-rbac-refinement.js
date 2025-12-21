/**
 * RBAC Refinement Migration Script
 * 
 * This script migrates existing users to the new RBAC system:
 * 1. Sets userType for all existing users (account_user by default)
 * 2. Sets approvalStatus to 'approved' for all existing students
 * 3. Ensures backward compatibility
 * 
 * Run with: node scripts/migrate-rbac-refinement.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import logger from '../src/config/logger.js';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate\n`);

    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const user of users) {
      try {
        let needsUpdate = false;
        const updates = {};

        // Set userType if not set
        if (!user.userType) {
          if (user.role === 'student') {
            const gradeNum = parseInt(user.grade) || 0;
            if (gradeNum <= 4 || user.grade === 'KG') {
              updates.userType = 'roster_record';
            } else {
              updates.userType = 'account_user';
            }
          } else {
            updates.userType = 'account_user';
          }
          needsUpdate = true;
        }

        // Set approvalStatus for students if not set
        if (user.role === 'student' && !user.approvalStatus) {
          // All existing students are auto-approved
          updates.approvalStatus = 'approved';
          updates.approvedAt = user.createdAt || new Date();
          needsUpdate = true;
        }

        // For non-students, ensure approvalStatus is set
        if (user.role !== 'student' && !user.approvalStatus) {
          updates.approvalStatus = 'approved';
          needsUpdate = true;
        }

        if (needsUpdate) {
          await User.findByIdAndUpdate(user._id, { $set: updates });
          updated++;
          console.log(`✅ Updated user: ${user.name} (${user.role}) - userType: ${updates.userType || user.userType}, approvalStatus: ${updates.approvalStatus || user.approvalStatus}`);
        } else {
          skipped++;
        }
      } catch (error) {
        errors.push({ userId: user._id, name: user.name, error: error.message });
        console.error(`❌ Error updating user ${user.name}:`, error.message);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Updated: ${updated} users`);
    console.log(`⏭️  Skipped: ${skipped} users (already migrated)`);
    console.log(`❌ Errors: ${errors.length} users`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      errors.forEach(err => {
        console.log(`  - ${err.name} (${err.userId}): ${err.error}`);
      });
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrate();

