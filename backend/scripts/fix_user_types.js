/**
 * Migration Script: Fix userType for existing users
 * 
 * This script fixes users who have email/password but are incorrectly marked as roster_record
 * due to the old grade-based logic.
 * 
 * Run with: node scripts/fix_user_types.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import User from '../src/models/User.js';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
const envPath = resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';

async function fixUserTypes() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find users who have credentials but are roster_record
    const usersToFix = await User.find({
      userType: 'roster_record',
      email: { $exists: true, $ne: null },
      password: { $exists: true, $ne: null }
    }).select('_id name email role grade userType');

    console.log(`📋 Found ${usersToFix.length} users to fix:\n`);

    if (usersToFix.length === 0) {
      console.log('✅ No users need fixing. All users have correct userType.');
      await mongoose.disconnect();
      return;
    }

    // Show users that will be fixed
    usersToFix.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Grade: ${user.grade || 'N/A'}`);
    });

    console.log('\n🔄 Updating userType to account_user...\n');

    // Update userType to account_user
    const result = await User.updateMany(
      {
        userType: 'roster_record',
        email: { $exists: true, $ne: null },
        password: { $exists: true, $ne: null }
      },
      {
        $set: {
          userType: 'account_user',
          // Set approvalStatus to approved for existing users (they've been using the system)
          approvalStatus: 'approved'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} users from roster_record to account_user`);
    console.log(`   Matched: ${result.matchedCount} users`);
    
    // Verify the fix
    const remainingRosterWithCredentials = await User.countDocuments({
      userType: 'roster_record',
      email: { $exists: true, $ne: null },
      password: { $exists: true, $ne: null }
    });

    if (remainingRosterWithCredentials > 0) {
      console.log(`\n⚠️  Warning: ${remainingRosterWithCredentials} users still have roster_record with credentials.`);
      console.log('   This might indicate password field is stored differently. Please check manually.');
    } else {
      console.log('\n✅ All users with credentials are now account_user');
    }

    // Show summary
    const accountUsers = await User.countDocuments({ userType: 'account_user' });
    const rosterRecords = await User.countDocuments({ userType: 'roster_record' });
    
    console.log('\n📊 Final Summary:');
    console.log(`   account_user: ${accountUsers}`);
    console.log(`   roster_record: ${rosterRecords}`);

    await mongoose.disconnect();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run migration
fixUserTypes();

