/**
 * Fix Institution IDs Script
 * 
 * This script helps fix users (teachers/admins) who don't have institutionId assigned.
 * 
 * Usage:
 *   node backend/scripts/fix-institution-ids.js
 * 
 * This will:
 * 1. List all teachers/admins without institutionId
 * 2. Show available schools
 * 3. Allow manual assignment via MongoDB
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
import School from '../src/models/School.js';

async function fixInstitutionIds() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Find all schools
    const schools = await School.find({ isActive: true }).select('_id name address');
    console.log(`\n📚 Available Schools (${schools.length}):`);
    schools.forEach((school, index) => {
      console.log(`  ${index + 1}. ${school.name} (ID: ${school._id})`);
    });

    // Find teachers without institutionId
    const teachersWithoutInstitution = await User.find({
      role: 'teacher',
      $or: [
        { institutionId: { $exists: false } },
        { institutionId: null }
      ]
    }).select('_id name email role');

    console.log(`\n👨‍🏫 Teachers without Institution (${teachersWithoutInstitution.length}):`);
    teachersWithoutInstitution.forEach((teacher, index) => {
      console.log(`  ${index + 1}. ${teacher.name} (${teacher.email}) - ID: ${teacher._id}`);
    });

    // Find admins without institutionId
    const adminsWithoutInstitution = await User.find({
      role: 'admin',
      $or: [
        { institutionId: { $exists: false } },
        { institutionId: null }
      ]
    }).select('_id name email role');

    console.log(`\n👨‍💼 Admins without Institution (${adminsWithoutInstitution.length}):`);
    adminsWithoutInstitution.forEach((admin, index) => {
      console.log(`  ${index + 1}. ${admin.name} (${admin.email}) - ID: ${admin._id}`);
    });

    console.log(`\n📝 To assign institutionId, use MongoDB shell or update via API:`);
    console.log(`\nExample MongoDB command:`);
    if (schools.length > 0 && (teachersWithoutInstitution.length > 0 || adminsWithoutInstitution.length > 0)) {
      const firstSchoolId = schools[0]._id;
      const firstUser = teachersWithoutInstitution[0] || adminsWithoutInstitution[0];
      if (firstUser) {
        console.log(`\n  db.users.updateOne(`);
        console.log(`    { _id: ObjectId("${firstUser._id}") },`);
        console.log(`    { $set: { institutionId: ObjectId("${firstSchoolId}") } }`);
        console.log(`  )`);
      }
    }

    console.log(`\n✅ Script completed. Review the list above and assign institutionIds as needed.`);
    console.log(`\n💡 Tip: You can also use the web UI to edit user profiles and assign institutionId.`);

    // Disconnect
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Script error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run script
fixInstitutionIds();

