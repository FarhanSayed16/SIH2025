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

    // Drop existing qrCode index
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

    // Create sparse unique index
    await collection.createIndex(
      { qrCode: 1 },
      { unique: true, sparse: true, name: 'qrCode_1' }
    );
    logger.info('✅ Created sparse unique index on qrCode');

    // Same for qrBadgeId
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

    await collection.createIndex(
      { qrBadgeId: 1 },
      { unique: true, sparse: true, name: 'qrBadgeId_1' }
    );
    logger.info('✅ Created sparse unique index on qrBadgeId');

    logger.info('✅ Index fix complete!');
  } catch (error) {
    logger.error('❌ Error fixing indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

fixQRCodeIndex();

