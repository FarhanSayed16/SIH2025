import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import logger from '../src/config/logger.js';

dotenv.config();

const fixQRCodeIndex = async () => {
  try {
    await connectDB();
    logger.info('✅ MongoDB Connected');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Step 1: Drop existing qrCode index if it exists
    try {
      await collection.dropIndex('qrCode_1');
      logger.info('✅ Dropped existing qrCode index');
    } catch (e) {
      if (e.code === 27) {
        logger.info('ℹ️  qrCode index does not exist, will create new one');
      } else {
        throw e;
      }
    }

    // Step 2: Check for duplicate non-null qrCode values
    const duplicates = await collection.aggregate([
      { $match: { qrCode: { $ne: null } } },
      { $group: { _id: '$qrCode', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length > 0) {
      logger.warn(`⚠️  Found ${duplicates.length} duplicate qrCode values. Clearing them...`);
      // Clear duplicate qrCode values (set to null)
      for (const dup of duplicates) {
        await collection.updateMany(
          { qrCode: dup._id },
          { $set: { qrCode: null } },
          { skip: 1 } // Keep one, clear the rest
        );
      }
      logger.info('✅ Cleared duplicate qrCode values');
    }

    // Step 3: Create non-unique sparse index first (allows multiple nulls)
    try {
      await collection.createIndex(
        { qrCode: 1 },
        { sparse: true, name: 'qrCode_1' }
      );
      logger.info('✅ Created non-unique sparse index on qrCode');
    } catch (e) {
      logger.error('❌ Error creating non-unique index:', e);
      throw e;
    }

    // Step 4: Now create unique sparse index (will replace the non-unique one)
    try {
      await collection.dropIndex('qrCode_1');
      await collection.createIndex(
        { qrCode: 1 },
        { unique: true, sparse: true, name: 'qrCode_1' }
      );
      logger.info('✅ Created unique sparse index on qrCode');
    } catch (e) {
      logger.error('❌ Error creating unique index:', e);
      // If unique index fails, keep the non-unique one
      logger.warn('⚠️  Keeping non-unique index due to duplicate values');
    }

    // Step 5: Same for qrBadgeId
    try {
      await collection.dropIndex('qrBadgeId_1');
      logger.info('✅ Dropped existing qrBadgeId index');
    } catch (e) {
      if (e.code === 27) {
        logger.info('ℹ️  qrBadgeId index does not exist, will create new one');
      } else {
        throw e;
      }
    }

    // Check for duplicate non-null qrBadgeId values
    const badgeDuplicates = await collection.aggregate([
      { $match: { qrBadgeId: { $ne: null } } },
      { $group: { _id: '$qrBadgeId', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (badgeDuplicates.length > 0) {
      logger.warn(`⚠️  Found ${badgeDuplicates.length} duplicate qrBadgeId values. Clearing them...`);
      for (const dup of badgeDuplicates) {
        await collection.updateMany(
          { qrBadgeId: dup._id },
          { $set: { qrBadgeId: null } },
          { skip: 1 }
        );
      }
      logger.info('✅ Cleared duplicate qrBadgeId values');
    }

    // Create non-unique sparse index first
    await collection.createIndex(
      { qrBadgeId: 1 },
      { sparse: true, name: 'qrBadgeId_1' }
    );
    logger.info('✅ Created non-unique sparse index on qrBadgeId');

    // Then create unique sparse index
    try {
      await collection.dropIndex('qrBadgeId_1');
      await collection.createIndex(
        { qrBadgeId: 1 },
        { unique: true, sparse: true, name: 'qrBadgeId_1' }
      );
      logger.info('✅ Created unique sparse index on qrBadgeId');
    } catch (e) {
      logger.warn('⚠️  Keeping non-unique qrBadgeId index due to duplicate values');
    }

    logger.info('✅ Index fix complete!');
  } catch (error) {
    logger.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

fixQRCodeIndex();

