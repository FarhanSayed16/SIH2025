/**
 * Script to check Class collection indexes
 */
import mongoose from 'mongoose';
import connectDB from '../src/config/database.js';

const checkIndexes = async () => {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('classes');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current Indexes on "classes" collection:');
    console.log(JSON.stringify(indexes, null, 2));

    // Count documents
    const count = await collection.countDocuments();
    console.log(`\n📊 Total documents: ${count}`);

    // Check for documents with missing academicYear
    const missingAcademicYear = await collection.countDocuments({
      $or: [
        { academicYear: { $exists: false } },
        { academicYear: null }
      ]
    });
    console.log(`\n⚠️  Documents with missing/null academicYear: ${missingAcademicYear}`);

    // Check for potential duplicates (same institutionId, grade, section, but missing academicYear)
    const duplicates = await collection.aggregate([
      {
        $match: {
          $or: [
            { academicYear: { $exists: false } },
            { academicYear: null }
          ]
        }
      },
      {
        $group: {
          _id: {
            institutionId: '$institutionId',
            grade: '$grade',
            section: '$section'
          },
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log('\n🔴 Potential duplicate groups (same institutionId, grade, section, missing academicYear):');
      duplicates.forEach(dup => {
        console.log(`  - ${dup._id.grade}-${dup._id.section} at institution ${dup._id.institutionId}: ${dup.count} documents`);
        console.log(`    Document IDs: ${dup.docs.map(d => d.toString()).join(', ')}`);
      });
    } else {
      console.log('\n✅ No duplicate groups found');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkIndexes();

