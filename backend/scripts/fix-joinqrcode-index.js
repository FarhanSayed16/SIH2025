/**
 * Fix joinQRCode Index
 * 
 * This script fixes the joinQRCode unique index to allow multiple nulls
 * by ensuring it's sparse.
 * 
 * Run: node scripts/fix-joinqrcode-index.js
 */

import mongoose from 'mongoose';
import '../src/config/env-loader.js';
import connectDB from '../src/config/database.js';

async function fixIndex() {
  try {
    await connectDB();
    const db = mongoose.connection.db;
    
    console.log('🔧 Fixing joinQRCode index...');
    
    // Try to drop existing index
    try {
      await db.collection('classes').dropIndex('joinQRCode_1');
      console.log('✅ Dropped existing joinQRCode index');
    } catch (error) {
      if (error.codeName === 'IndexNotFound') {
        console.log('ℹ️ Index does not exist - will create new one');
      } else {
        console.log('⚠️ Could not drop index:', error.message);
      }
    }
    
    // Recreate with sparse (allows multiple nulls)
    await db.collection('classes').createIndex(
      { joinQRCode: 1 },
      { unique: true, sparse: true, name: 'joinQRCode_1' }
    );
    console.log('✅ Created sparse joinQRCode index (allows multiple nulls)');
    
    // Verify the index
    const indexes = await db.collection('classes').indexes();
    const joinQRIndex = indexes.find(idx => idx.name === 'joinQRCode_1');
    
    if (joinQRIndex) {
      console.log('✅ Index verified:', {
        name: joinQRIndex.name,
        unique: joinQRIndex.unique,
        sparse: joinQRIndex.sparse
      });
    }
    
    console.log('✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing index:', error);
    process.exit(1);
  }
}

fixIndex();

