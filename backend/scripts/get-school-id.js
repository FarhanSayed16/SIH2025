/**
 * Quick script to get school/institution ID
 * Usage: node scripts/get-school-id.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const School = (await import('../src/models/School.js')).default;

async function getSchoolId() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const schools = await School.find({}).select('_id name address').limit(10);
    
    if (schools.length === 0) {
      console.log('❌ No schools found in database.');
      console.log('   Please create a school first via admin dashboard.\n');
    } else {
      console.log('📚 Schools found:\n');
      schools.forEach((school, index) => {
        console.log(`${index + 1}. Name: ${school.name}`);
        console.log(`   ID: ${school._id.toString()}`);
        console.log(`   Address: ${school.address || 'N/A'}`);
        console.log('');
      });
      
      if (schools.length === 1) {
        console.log(`✅ Using School ID: ${schools[0]._id.toString()}\n`);
      } else {
        console.log('⚠️  Multiple schools found. Use the ID from the school you want to use.\n');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

getSchoolId();

