import 'dotenv/config';
import mongoose from 'mongoose';
import Class from '../src/models/Class.js';

async function debugClassQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testInstitutionId = '6924de10a721bc018818253c';
    const testGrade = '1';
    const testSection = 'A';
    const testAcademicYear = '2025-2026';

    console.log('=== TESTING CLASS QUERIES ===\n');
    console.log(`InstitutionId: ${testInstitutionId} (type: ${typeof testInstitutionId})`);
    console.log(`Grade: ${testGrade}, Section: ${testSection}, AcademicYear: ${testAcademicYear}\n`);

    // Test 1: Find all classes for this institution
    console.log('1. Finding ALL classes for this institution...');
    const allClasses = await Class.find({ 
      institutionId: testInstitutionId 
    }).select('grade section institutionId academicYear classCode').lean();
    console.log(`   Found ${allClasses.length} classes:`);
    allClasses.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.grade}-${c.section}, academicYear: ${c.academicYear || 'NULL'}, classCode: ${c.classCode}`);
      console.log(`      institutionId type: ${typeof c.institutionId}, value: ${c.institutionId}`);
    });
    console.log('');

    // Test 2: Query with string (as frontend sends)
    console.log('2. Query with STRING institutionId + academicYear...');
    const query1 = await Class.findOne({
      institutionId: testInstitutionId,
      grade: testGrade,
      section: testSection,
      academicYear: testAcademicYear
    });
    console.log(`   Result: ${query1 ? `FOUND: ${query1.classCode}` : 'NOT FOUND'}`);
    console.log('');

    // Test 3: Query with ObjectId
    console.log('3. Query with ObjectId institutionId + academicYear...');
    const normalizedId = new mongoose.Types.ObjectId(testInstitutionId);
    const query2 = await Class.findOne({
      institutionId: normalizedId,
      grade: testGrade,
      section: testSection,
      academicYear: testAcademicYear
    });
    console.log(`   Result: ${query2 ? `FOUND: ${query2.classCode}` : 'NOT FOUND'}`);
    console.log('');

    // Test 4: Query without academicYear (legacy)
    console.log('4. Query with ObjectId institutionId WITHOUT academicYear...');
    const query3 = await Class.findOne({
      institutionId: normalizedId,
      grade: testGrade,
      section: testSection
    });
    console.log(`   Result: ${query3 ? `FOUND: ${query3.classCode}, academicYear: ${query3.academicYear || 'NULL'}` : 'NOT FOUND'}`);
    console.log('');

    // Test 5: Check unique index
    console.log('5. Checking unique index...');
    const indexes = await Class.collection.getIndexes();
    console.log('   Indexes:', JSON.stringify(indexes, null, 2));
    console.log('');

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

debugClassQuery();

