/**
 * Class Management Controller
 * RBAC Refinement: Admin endpoints for class creation and management
 */

import Class from '../models/Class.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import mongoose from 'mongoose';

/**
 * Create a new class (Admin only)
 * POST /api/admin/classes
 */
// Helper function to get current academic year
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-11
  // Academic year typically starts in June/July, so if month >= 6, it's the new year
  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/**
 * Normalize institutionId to handle both string and ObjectId formats
 * This ensures consistent query behavior across all duplicate checks
 */
const normalizeInstitutionId = (id) => {
  if (!id) return null;
  
  // If it's already an ObjectId, return as-is
  if (id instanceof mongoose.Types.ObjectId) {
    return id;
  }
  
  // If it's a string and valid ObjectId, convert to ObjectId
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return new mongoose.Types.ObjectId(id);
  }
  
  // Fallback: return as-is (might be invalid, but let Mongoose handle it)
  return id;
};

export const createClass = async (req, res) => {
  // CRITICAL: Define variables in outer scope so E11000 handler can access them
  let normalizedInstitutionId;
  let grade;
  let section;
  let classAcademicYear;
  let classCode;
  
  try {
    const { institutionId, teacherId, roomNumber, capacity, academicYear } = req.body;
    grade = req.body.grade;
    section = req.body.section;

    // Validate required fields (teacherId is now optional)
    if (!institutionId || !grade || !section) {
      return errorResponse(res, 'institutionId, grade, and section are required', 400);
    }

    // Determine academic year (use provided or default to current)
    classAcademicYear = academicYear || getCurrentAcademicYear();

    // If teacherId is provided, verify teacher exists and is a teacher
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher) {
        return errorResponse(res, 'Teacher not found', 404);
      }
      if (teacher.role !== 'teacher') {
        return errorResponse(res, 'User is not a teacher', 400);
      }

      // Verify teacher belongs to the same institution
      if (teacher.institutionId?.toString() !== institutionId.toString()) {
        return errorResponse(res, 'Teacher does not belong to this institution', 400);
      }
    }

    // SIMPLIFIED APPROACH: Trust MongoDB's unique index and use atomic upsert
    // Remove all pre-save duplicate checks - they're causing false positives
    // MongoDB's unique index + findOneAndUpdate with upsert handles everything atomically
    
    normalizedInstitutionId = normalizeInstitutionId(institutionId);
    
    // Generate class code - include academicYear to make it unique per year
    // This prevents classCode conflicts for same grade/section in different years
    const baseClassCode = Class.generateClassCode(institutionId, grade, section);
    classCode = `${baseClassCode}-${classAcademicYear.replace('-', '')}`;
    
    logger.info(`[createClass] Creating/updating class: ${grade}-${section} for institution ${institutionId} (normalized: ${normalizedInstitutionId}), academicYear: ${classAcademicYear}, classCode: ${classCode}`);
    
    // PHASE 1: Pre-upsert check - find existing class BEFORE trying upsert
    // This prevents E11000 errors and ensures we return actual class data
    logger.info(`[createClass] Pre-check: Searching for existing class...`);
    const existingClassCheck = await Class.findOne({
      institutionId: normalizedInstitutionId,
      grade,
      section,
      academicYear: classAcademicYear
    })
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name');
    
    if (existingClassCheck) {
      // Class exists - update it and return
      logger.info(`[createClass] ✅ Class already exists: ${existingClassCheck.classCode} (${grade}-${section})`);
      
      // Update fields that can change
      let needsUpdate = false;
      if (teacherId && existingClassCheck.teacherId?.toString() !== teacherId.toString()) {
        existingClassCheck.teacherId = teacherId;
        needsUpdate = true;
      }
      if (roomNumber && existingClassCheck.roomNumber !== roomNumber) {
        existingClassCheck.roomNumber = roomNumber;
        needsUpdate = true;
      }
      if (capacity && existingClassCheck.capacity !== capacity) {
        existingClassCheck.capacity = capacity;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await existingClassCheck.save();
        // Re-populate after save
        const updatedClass = await Class.findById(existingClassCheck._id)
          .populate('teacherId', 'name email')
          .populate('institutionId', 'name');
        
        return successResponse(
          res,
          { class: updatedClass },
          `Class with grade ${grade} and section ${section} already exists for this institution in academic year ${classAcademicYear}. Updated and returned existing class.`,
          200
        );
      } else {
        // No updates needed - return as-is
        return successResponse(
          res,
          { class: existingClassCheck },
          `Class with grade ${grade} and section ${section} already exists for this institution in academic year ${classAcademicYear}. Returning existing class.`,
          200
        );
      }
    }
    
    logger.info(`[createClass] No existing class found - proceeding with upsert`);
    
    try {
      // Use findOneAndUpdate with upsert - this is atomic and handles duplicates gracefully
      const newClass = await Class.findOneAndUpdate(
        {
          institutionId: normalizedInstitutionId,
          grade,
          section,
          academicYear: classAcademicYear
        },
        {
          $setOnInsert: {
            // Only set on insert (not update)
            institutionId: normalizedInstitutionId,
            grade,
            section,
            academicYear: classAcademicYear,
            classCode,
            isActive: true,
            // CRITICAL: Don't set joinQRCode - let it default to null (sparse index allows multiple nulls)
          },
          $set: {
            // Always update (even if exists)
            teacherId: teacherId || null,
            roomNumber: roomNumber || null,
            capacity: capacity || 40,
            // CRITICAL: Don't set joinQRCode here either - let schema default handle it
          }
        },
        {
          upsert: true, // Create if doesn't exist
          new: true, // Return the updated document
          runValidators: true, // Run schema validators
          setDefaultsOnInsert: true // Apply default values on insert
        }
      )
        .populate('teacherId', 'name email')
        .populate('institutionId', 'name');

      // Check if this was a new creation by comparing createdAt with current time
      const createdAt = new Date(newClass.createdAt);
      const now = new Date();
      const timeDiff = now.getTime() - createdAt.getTime();
      const isNew = timeDiff < 3000; // Created within last 3 seconds = new
      
      if (isNew) {
        logger.info(`[createClass] ✅ Class created: ${newClass.classCode}${teacherId ? ` assigned to teacher` : ' (no teacher assigned yet)'}`);
        return successResponse(
          res,
          { class: newClass },
          'Class created successfully',
          201
        );
      } else {
        logger.info(`[createClass] ✅ Class already existed, returned existing: ${newClass.classCode}`);
        return successResponse(
          res,
          { class: newClass },
          `Class with grade ${grade} and section ${section} already exists for this institution in academic year ${classAcademicYear}. Returning existing class.`,
          200
        );
      }
    } catch (upsertError) {
      // If upsert fails, log the error and try to find the existing class
      logger.warn(`[createClass] ⚠️ Upsert failed:`, upsertError.message);
      logger.warn(`[createClass] Error code:`, upsertError.code);
      logger.warn(`[createClass] Error keyPattern:`, upsertError.keyPattern);
      logger.warn(`[createClass] Error keyValue:`, upsertError.keyValue);
      
      // If it's an E11000 error, handle it in the outer catch
      if (upsertError.code === 11000) {
        throw upsertError; // Let E11000 handler deal with it
      }
      
      // For other errors, try to find existing class
      const existingClass = await Class.findOne({
        institutionId: normalizedInstitutionId,
        grade,
        section,
        academicYear: classAcademicYear
      })
        .populate('teacherId', 'name email')
        .populate('institutionId', 'name');
      
      if (existingClass) {
        logger.info(`[createClass] ✅ Found existing class after upsert error: ${existingClass.classCode}`);
        return successResponse(
          res,
          { class: existingClass },
          `Class with grade ${grade} and section ${section} already exists for this institution in academic year ${classAcademicYear}. Returning existing class.`,
          200
        );
      }
      
      // If we still can't find it, re-throw the error
      throw upsertError;
    }
  } catch (error) {
    logger.error('Create class error:', error);
    logger.error('Error details:', {
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue,
      message: error.message
    });
    
    if (error.code === 11000) {
      // MongoDB unique index violation
      const keyPattern = error.keyPattern || {};
      
      // Check if it's a joinQRCode conflict (not a class duplicate)
      if (keyPattern.joinQRCode) {
        logger.warn(`[E11000] joinQRCode conflict detected. This is a schema/index issue, not a duplicate class.`);
        logger.warn(`[E11000] Attempting to create class without joinQRCode...`);
        
        // Try again without setting joinQRCode (let it default to null)
        // Use variables from req.body
        const retryInstitutionId = normalizeInstitutionId(req.body.institutionId);
        const retryGrade = req.body.grade;
        const retrySection = req.body.section;
        const retryAcademicYear = req.body.academicYear || getCurrentAcademicYear();
        const retryBaseClassCode = Class.generateClassCode(req.body.institutionId, retryGrade, retrySection);
        const retryClassCode = `${retryBaseClassCode}-${retryAcademicYear.replace('-', '')}`;
        
        try {
          // First, check if class already exists
          const existingCheck = await Class.findOne({
            institutionId: retryInstitutionId,
            grade: retryGrade,
            section: retrySection,
            academicYear: retryAcademicYear
          })
            .populate('teacherId', 'name email')
            .populate('institutionId', 'name');
          
          if (existingCheck) {
            logger.info(`[E11000] ✅ Class already exists: ${existingCheck.classCode}`);
            return successResponse(
              res,
              { class: existingCheck },
              `Class with grade ${retryGrade} and section ${retrySection} already exists for this institution in academic year ${retryAcademicYear}. Returning existing class.`,
              200
            );
          }
          
          // Class doesn't exist - create it using Class.create() instead of findOneAndUpdate
          // This avoids the joinQRCode issue in upsert
          // CRITICAL: Don't include joinQRCode at all - let schema default handle it
          // For sparse index to work, the field should be undefined, not null
          const newClassData = {
            institutionId: retryInstitutionId,
            grade: retryGrade,
            section: retrySection,
            academicYear: retryAcademicYear,
            classCode: retryClassCode,
            isActive: true,
            teacherId: req.body.teacherId || null,
            roomNumber: req.body.roomNumber || null,
            capacity: req.body.capacity || 40,
            // joinQRCode is NOT included - will be undefined, not null
          };
          
          const newClass = await Class.create(newClassData);
          
          const populatedClass = await Class.findById(newClass._id)
            .populate('teacherId', 'name email')
            .populate('institutionId', 'name');
          
          logger.info(`[E11000] ✅ Class created successfully after joinQRCode fix: ${populatedClass.classCode}`);
          return successResponse(
            res,
            { class: populatedClass },
            'Class created successfully',
            201
          );
        } catch (retryError) {
          logger.error(`[E11000] ❌ Retry also failed:`, retryError.message);
          logger.error(`[E11000] Retry error code:`, retryError.code);
          logger.error(`[E11000] Retry error keyPattern:`, retryError.keyPattern);
          
          // If retry also fails with E11000, it might be a class duplicate
          // Check if it's a class duplicate (institutionId+grade+section+academicYear)
          if (retryError.code === 11000 && retryError.keyPattern?.institutionId && retryError.keyPattern?.grade) {
            // This is a class duplicate, not joinQRCode - fall through to class duplicate handler
            logger.info(`[E11000] Retry error is actually a class duplicate, not joinQRCode`);
          } else {
            // Different error - return it
            return errorResponse(
              res,
              `Failed to create class: ${retryError.message}`,
              500
            );
          }
        }
      }
      
      // This is a class duplicate (institutionId+grade+section+academicYear conflict)
      // Use variables from req.body since outer scope may not be accessible
      logger.info(`[E11000] Class duplicate detected. Finding existing class...`);
      const searchInstitutionId = normalizeInstitutionId(req.body.institutionId);
      const searchGrade = req.body.grade;
      const searchSection = req.body.section;
      const searchAcademicYear = req.body.academicYear || getCurrentAcademicYear();
      
      logger.info(`[E11000] Using: institutionId=${searchInstitutionId}, grade=${searchGrade}, section=${searchSection}, academicYear=${searchAcademicYear}`);
      
      // Try to find existing class
      const existingClass = await Class.findOne({
        institutionId: searchInstitutionId,
        grade: searchGrade,
        section: searchSection,
        academicYear: searchAcademicYear
      })
        .populate('teacherId', 'name email')
        .populate('institutionId', 'name');
      
      if (existingClass) {
        // Found existing class - return it with 200 status
        logger.info(`[E11000] ✅ Found existing class: ${existingClass.classCode} (${searchGrade}-${searchSection})`);
        return successResponse(
          res,
          { class: existingClass },
          `Class with grade ${searchGrade} and section ${searchSection} already exists for this institution in academic year ${searchAcademicYear}. Returning existing class.`,
          200
        );
      }
      
      // If still not found, try without academicYear (legacy class)
      logger.info(`[E11000] Not found with academicYear, trying without...`);
      const legacyClass = await Class.findOne({
        institutionId: searchInstitutionId,
        grade: searchGrade,
        section: searchSection
      })
        .populate('teacherId', 'name email')
        .populate('institutionId', 'name');
      
      if (legacyClass) {
        // Found legacy class - update it with academicYear
        if (!legacyClass.academicYear || legacyClass.academicYear === null) {
          legacyClass.academicYear = searchAcademicYear;
          await legacyClass.save();
          logger.info(`[E11000] ✅ Updated legacy class with academicYear: ${searchAcademicYear}`);
          
          // Re-populate after save
          const updatedClass = await Class.findById(legacyClass._id)
            .populate('teacherId', 'name email')
            .populate('institutionId', 'name');
          
          return successResponse(
            res,
            { class: updatedClass },
            `Class already existed (legacy data). Updated with academic year ${searchAcademicYear}.`,
            200
          );
        } else {
          // Has academicYear but different - return it anyway
          return successResponse(
            res,
            { class: legacyClass },
            `Class with grade ${searchGrade} and section ${searchSection} already exists for this institution. Returning existing class.`,
            200
          );
        }
      }
      
      // If we STILL can't find it, this is a data inconsistency
      logger.error(`[E11000] ❌ CRITICAL: Class should exist but can't be found`);
      logger.error(`[E11000] Query used: institutionId=${searchInstitutionId} (type: ${typeof searchInstitutionId}), grade=${searchGrade}, section=${searchSection}, academicYear=${searchAcademicYear}`);
      logger.error(`[E11000] Error keyPattern:`, JSON.stringify(error.keyPattern));
      logger.error(`[E11000] Error keyValue:`, JSON.stringify(error.keyValue));
      
      // Return 500 error - this is a data inconsistency, not a user error
      return errorResponse(
        res,
        'Data inconsistency detected. The class should exist but could not be retrieved. Please contact support.',
        500
      );
    }
    
    // For non-E11000 errors, return the error
    return errorResponse(res, error.message || 'Failed to create class', 500);
  }
};

/**
 * List all classes (Admin only, or filtered by institution for teachers)
 * GET /api/admin/classes
 */
export const listClasses = async (req, res) => {
  try {
    const { page = 1, limit = 100, institutionId, teacherId, grade, section, includeInactive, academicYear } = req.query;

    const query = {};
    
    // PHASE 1.1: Consistent class listing logic
    // Teachers: Only see their assigned classes (active only)
    if (req.userRole === 'teacher') {
      query.teacherId = req.userId;
      query.isActive = true; // Teachers only see active classes
      
      logger.info(`Teacher ${req.userId} listing classes - query: ${JSON.stringify(query)}`);
    } 
    // Admins: Can see all classes or filter by institution
    else {
      // Handle isActive filter
      if (includeInactive === 'false') {
        query.isActive = true;
      }
      // Otherwise show all (active and inactive) for admin visibility
      
      // PHASE 1.1: SYSTEM_ADMIN can see all classes
      // Regular admin: Use their institutionId if present, or show all if not set (for development)
      if (req.userRole === 'SYSTEM_ADMIN') {
        // SYSTEM_ADMIN: Only filter if explicitly requested
        if (institutionId) {
          query.institutionId = institutionId;
        }
      } else if (req.userRole === 'admin') {
        // Regular admin: Use explicit filter, or fallback to user's institutionId, or show all
        if (institutionId) {
          query.institutionId = institutionId;
        } else if (req.user?.institutionId) {
          // Use admin's institutionId if no explicit filter
          query.institutionId = req.user.institutionId;
        }
        // If admin has no institutionId, show all classes (development mode)
      }
      
      // Additional filters
      if (teacherId) query.teacherId = teacherId;
      if (grade) query.grade = grade;
      if (section) query.section = section;
      if (academicYear) query.academicYear = academicYear;
      
      logger.info(`Admin ${req.userRole} ${req.userId} listing classes - query: ${JSON.stringify(query)}`);
    }

    // Use appropriate limit
    const effectiveLimit = req.userRole === 'teacher' ? parseInt(limit) : Math.max(parseInt(limit), 100);

    const classes = await Class.find(query)
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name')
      .populate('studentIds', 'name email grade section')
      .sort({ grade: 1, section: 1, academicYear: -1 })
      .skip((page - 1) * effectiveLimit)
      .limit(effectiveLimit);

    const total = await Class.countDocuments(query);

    logger.info(`Listed ${classes.length} classes (total: ${total}) for ${req.userRole} ${req.userId}`);

    // PHASE 1.1: Consistent response format
    // Always return { classes: [...] } in data field
    return paginatedResponse(res, { classes }, {
      page: parseInt(page),
      limit: effectiveLimit,
      total,
      totalPages: Math.ceil(total / effectiveLimit)
    }, 'Classes retrieved successfully');
  } catch (error) {
    logger.error('List classes error:', error);
    return errorResponse(res, 'Failed to list classes', 500);
  }
};

/**
 * Update class (Admin only)
 * PUT /api/admin/classes/:id
 */
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow changing institutionId or classCode
    delete updates.institutionId;
    delete updates.classCode;

    // If teacherId is being updated, verify the new teacher
    if (updates.teacherId) {
      const teacher = await User.findById(updates.teacherId);
      if (!teacher || teacher.role !== 'teacher') {
        return errorResponse(res, 'Invalid teacher ID', 400);
      }
    }

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name');

    if (!updatedClass) {
      return errorResponse(res, 'Class not found', 404);
    }

    logger.info(`Class updated: ${updatedClass.classCode}`);

    return successResponse(res, { class: updatedClass }, 'Class updated successfully');
  } catch (error) {
    logger.error('Update class error:', error);
    return errorResponse(res, error.message || 'Failed to update class', 500);
  }
};

/**
 * Get class by ID
 * GET /api/admin/classes/:id
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id)
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name')
      .populate('studentIds', 'name email grade section approvalStatus')
      .populate('deviceIds', 'deviceName deviceType');

    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Verify access: Teachers can only see their own classes
    if (req.userRole === 'teacher' && classData.teacherId._id.toString() !== req.userId.toString()) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, { class: classData }, 'Class retrieved successfully');
  } catch (error) {
    logger.error('Get class error:', error);
    return errorResponse(res, 'Failed to get class', 500);
  }
};

/**
 * PHASE B5: Assign/Reassign teacher to class (Admin only)
 * PUT /api/admin/classes/:id/assign-teacher
 */
export const assignTeacherToClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId } = req.body;

    // Verify class exists
    const classData = await Class.findById(id);
    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    // If teacherId is empty/null/undefined, remove teacher
    if (!teacherId || teacherId === '' || teacherId === null) {
      classData.teacherId = null;
      await classData.save();
      
      logger.info(`Teacher removed from class: ${classData.classCode}`);
      return successResponse(
        res,
        { class: await Class.findById(id).populate('teacherId', 'name email').populate('institutionId', 'name') },
        'Teacher removed successfully'
      );
    }

    // Verify teacher exists and is a teacher
    const teacher = await User.findById(teacherId);
    if (!teacher) {
      return errorResponse(res, 'Teacher not found', 404);
    }
    if (teacher.role !== 'teacher') {
      return errorResponse(res, 'User is not a teacher', 400);
    }

    // Verify teacher belongs to the same institution
    if (teacher.institutionId?.toString() !== classData.institutionId.toString()) {
      return errorResponse(res, 'Teacher does not belong to this institution', 400);
    }

    // Update class with new teacher
    classData.teacherId = teacherId;
    await classData.save();

    logger.info(`Teacher ${teacher.name} assigned to class ${classData.classCode}`);

    const updatedClass = await Class.findById(id)
      .populate('teacherId', 'name email')
      .populate('institutionId', 'name');

    return successResponse(
      res,
      { class: updatedClass },
      'Teacher assigned to class successfully'
    );
  } catch (error) {
    logger.error('Assign teacher error:', error);
    return errorResponse(res, error.message || 'Failed to assign teacher', 500);
  }
};

/**
 * Cleanup endpoint - Delete all classes for a test institution (ONE-TIME USE)
 * DELETE /api/admin/classes/cleanup
 * WARNING: This is a destructive operation. Use only for testing/demo cleanup.
 */
export const cleanupClasses = async (req, res) => {
  try {
    const { institutionId, confirm } = req.body;

    // Safety check - require explicit confirmation
    if (confirm !== 'DELETE_ALL_CLASSES') {
      return errorResponse(
        res,
        'Safety check failed. Set confirm="DELETE_ALL_CLASSES" to proceed.',
        400
      );
    }

    if (!institutionId) {
      return errorResponse(res, 'institutionId is required', 400);
    }

    // Find all classes for this institution
    const classesToDelete = await Class.find({ institutionId });
    const count = classesToDelete.length;

    if (count === 0) {
      return successResponse(
        res,
        { deleted: 0 },
        'No classes found for this institution'
      );
    }

    // Delete all classes
    await Class.deleteMany({ institutionId });

    logger.warn(`DELETED ${count} classes for institution ${institutionId} by admin ${req.userId}`);

    return successResponse(
      res,
      { deleted: count, institutionId },
      `Successfully deleted ${count} class(es) for this institution`
    );
  } catch (error) {
    logger.error('Cleanup classes error:', error);
    return errorResponse(res, error.message || 'Failed to cleanup classes', 500);
  }
};

/**
 * Delete a single class (Admin only)
 * DELETE /api/admin/classes/:id
 */
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const classData = await Class.findById(id);
    if (!classData) {
      return errorResponse(res, 'Class not found', 404);
    }

    // Check if class has students
    if (classData.studentIds && classData.studentIds.length > 0) {
      return errorResponse(
        res,
        `Cannot delete class with ${classData.studentIds.length} student(s). Please remove students first.`,
        400
      );
    }

    await Class.findByIdAndDelete(id);

    logger.warn(`Class ${classData.classCode} (${classData.grade}-${classData.section}) deleted by admin ${req.userId}`);

    return successResponse(
      res,
      { deleted: true, classCode: classData.classCode },
      'Class deleted successfully'
    );
  } catch (error) {
    logger.error('Delete class error:', error);
    return errorResponse(res, error.message || 'Failed to delete class', 500);
  }
};

