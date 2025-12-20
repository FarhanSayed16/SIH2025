import 'dotenv/config';
import mongoose from 'mongoose';
import Class from '../src/models/Class.js';

async function debugClassQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testInstitutionId = '6924de10a721bc018818253c';

    console.log('=== FINDING ALL CLASSES ===\n');
    
    // Find ALL classes (no filter)
    const allClasses = await Class.find({}).lean();
    console.log(`Total classes in database: ${allClasses.length}\n`);
    
    allClasses.forEach((c, i) => {
      console.log(`${i+1}. Class Details:`);
      console.log(`   _id: ${c._id}`);
      console.log(`   grade: "${c.grade}" (type: ${typeof c.grade})`);
      console.log(`   section: "${c.section}" (type: ${typeof c.section})`);
      console.log(`   academicYear: "${c.academicYear || 'NULL'}" (type: ${typeof c.academicYear})`);
      console.log(`   institutionId: ${c.institutionId} (type: ${typeof c.institutionId}, isObjectId: ${c.institutionId instanceof mongoose.Types.ObjectId})`);
      console.log(`   classCode: ${c.classCode}`);
      console.log('');
    });

    // Now test specific queries
    console.log('\n=== TESTING SPECIFIC QUERIES ===\n');
    
    const testCases = [
      { grade: '1', section: 'A', academicYear: '2025-2026' },
      { grade: '2', section: 'A', academicYear: '2025-2026' },
      { grade: '10', section: 'A', academicYear: '2025-2026' },
    ];

    for (const testCase of testCases) {
      console.log(`Testing: Grade ${testCase.grade}, Section ${testCase.section}, AcademicYear ${testCase.academicYear}`);
      
      // Test 1: String institutionId
      const query1 = await Class.findOne({
        institutionId: testInstitutionId,
        grade: testCase.grade,
        section: testCase.section,
        academicYear: testCase.academicYear
      });
      console.log(`  String ID: ${query1 ? `FOUND (${query1.classCode})` : 'NOT FOUND'}`);
      
      // Test 2: ObjectId institutionId
      const normalizedId = new mongoose.Types.ObjectId(testInstitutionId);
      const query2 = await Class.findOne({
        institutionId: normalizedId,
        grade: testCase.grade,
        section: testCase.section,
        academicYear: testCase.academicYear
      });
      console.log(`  ObjectId ID: ${query2 ? `FOUND (${query2.classCode})` : 'NOT FOUND'}`);
      
      // Test 3: Without academicYear
      const query3 = await Class.findOne({
        institutionId: normalizedId,
        grade: testCase.grade,
        section: testCase.section
      });
      console.log(`  Without academicYear: ${query3 ? `FOUND (${query3.classCode}, academicYear: ${query3.academicYear || 'NULL'})` : 'NOT FOUND'}`);
      console.log('');
    }

    // Check for classes with this institutionId
    console.log('\n=== CLASSES FOR THIS INSTITUTION ===\n');
    const institutionClasses = await Class.find({
      institutionId: testInstitutionId
    }).lean();
    console.log(`Found ${institutionClasses.length} classes for institution ${testInstitutionId}:`);
    institutionClasses.forEach((c, i) => {
      console.log(`  ${i+1}. ${c.grade}-${c.section} (academicYear: ${c.academicYear || 'NULL'})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

debugClassQuery();

