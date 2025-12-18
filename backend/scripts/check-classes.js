import 'dotenv/config';
import mongoose from 'mongoose';
import Class from '../src/models/Class.js';

async function checkClasses() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const allClasses = await Class.find({}).select('grade section institutionId academicYear classCode').lean();
    
    console.log('=== ALL CLASSES IN DATABASE ===\n');
    allClasses.forEach((c, i) => {
      console.log(`${i+1}. Class: ${c.grade}-${c.section}`);
      console.log(`   ID: ${c._id}`);
      console.log(`   InstitutionId: ${c.institutionId} (type: ${typeof c.institutionId})`);
      console.log(`   InstitutionId toString: ${c.institutionId?.toString()}`);
      console.log(`   AcademicYear: ${c.academicYear || 'NULL'}`);
      console.log(`   ClassCode: ${c.classCode}`);
      console.log('');
    });

    // Test query with string
    const testInstitutionId = '6924de10a721bc018818253c';
    console.log(`\n=== TESTING QUERY WITH STRING: ${testInstitutionId} ===`);
    const testClass1 = await Class.findOne({
      institutionId: testInstitutionId,
      grade: '5',
      section: 'A'
    });
    console.log('Result with string:', testClass1 ? `Found: ${testClass1.classCode}` : 'NOT FOUND');

    // Test query with ObjectId
    const testInstitutionIdObj = new mongoose.Types.ObjectId(testInstitutionId);
    console.log(`\n=== TESTING QUERY WITH ObjectId: ${testInstitutionIdObj} ===`);
    const testClass2 = await Class.findOne({
      institutionId: testInstitutionIdObj,
      grade: '5',
      section: 'A'
    });
    console.log('Result with ObjectId:', testClass2 ? `Found: ${testClass2.classCode}` : 'NOT FOUND');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkClasses();

