/**
 * Database Migrations Utility
 * Handles one-time data migrations for schema updates
 */

import Class from '../models/Class.js';
import mongoose from 'mongoose';
import logger from '../config/logger.js';

/**
 * Get current academic year based on date
 */
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  // Academic year typically starts in June/July
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Migration: Drop the old unique index that doesn't include academicYear
 * This allows same grade/section in different academic years
 */
export const dropOldClassIndex = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('classes');
    
    // Check if the old index exists
    const indexes = await collection.indexes();
    const oldIndex = indexes.find(idx => idx.name === 'institutionId_1_grade_1_section_1');
    
    if (oldIndex) {
      await collection.dropIndex('institutionId_1_grade_1_section_1');
      logger.info('Migration: Dropped old index institutionId_1_grade_1_section_1');
      return { dropped: true };
    } else {
      logger.info('Migration: Old index already removed');
      return { dropped: false };
    }
  } catch (error) {
    if (error.codeName === 'IndexNotFound') {
      logger.info('Migration: Old index not found (already removed)');
      return { dropped: false };
    }
    logger.error('Migration error (dropOldClassIndex):', error);
    throw error;
  }
};

/**
 * Migration: Add academicYear to classes that don't have it
 * This fixes legacy classes created before academicYear was added
 */
export const migrateClassesAcademicYear = async () => {
  try {
    const currentAcademicYear = getCurrentAcademicYear();
    
    // Find all classes without academicYear
    const classesWithoutYear = await Class.find({
      $or: [
        { academicYear: { $exists: false } },
        { academicYear: null },
        { academicYear: '' }
      ]
    });

    if (classesWithoutYear.length === 0) {
      logger.info('Migration: All classes already have academicYear field');
      return { migrated: 0, total: 0 };
    }

    logger.info(`Migration: Found ${classesWithoutYear.length} classes without academicYear, updating...`);

    // Update each class
    let migratedCount = 0;
    for (const classDoc of classesWithoutYear) {
      classDoc.academicYear = currentAcademicYear;
      await classDoc.save();
      migratedCount++;
      logger.info(`Migration: Updated class ${classDoc.classCode} with academicYear: ${currentAcademicYear}`);
    }

    logger.info(`Migration: Successfully updated ${migratedCount} classes with academicYear`);
    return { migrated: migratedCount, total: classesWithoutYear.length };
  } catch (error) {
    logger.error('Migration error (academicYear):', error);
    throw error;
  }
};

/**
 * Run all pending migrations
 */
export const runMigrations = async () => {
  logger.info('Running database migrations...');
  
  try {
    // Migration 0: Drop old index (run first!)
    await dropOldClassIndex();
    
    // Migration 1: Add academicYear to classes
    const result = await migrateClassesAcademicYear();
    
    logger.info('All migrations completed successfully');
    return { academicYear: result };
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  }
};

export default { runMigrations, migrateClassesAcademicYear, dropOldClassIndex };
