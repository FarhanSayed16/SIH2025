import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import { paginate } from '../utils/helpers.js';
import logger from '../config/logger.js';

/**
 * Get user by ID
 * GET /api/users/:id
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate('institutionId', 'name address location')
      .select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    return successResponse(res, { user }, 'User retrieved successfully');
  } catch (error) {
    logger.error('Get user error:', error);
    return errorResponse(res, 'Failed to get user', 500);
  }
};

/**
 * Update user profile
 * PUT /api/users/:id
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Don't allow password or role updates through this endpoint
    delete updates.password;
    delete updates.role;

    // RBAC Refinement: Handle approval status updates
    if (updates.approvalStatus) {
      // Only teachers and admins can approve/reject students
      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return errorResponse(res, 'Unauthorized: Only teachers and admins can approve students', 403);
      }

      // If approving, set approvedBy and approvedAt
      if (updates.approvalStatus === 'approved') {
        updates.approvedBy = req.user.userId;
        updates.approvedAt = new Date();
      } else if (updates.approvalStatus === 'rejected') {
        // Keep rejectionReason if provided
        if (!updates.rejectionReason) {
          updates.rejectionReason = 'Rejected by ' + req.user.name;
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    logger.info(`User updated: ${user.email}`);

    // Phase 3.5.1: Invalidate user cache
    try {
      const { invalidateCache } = await import('../middleware/cache.middleware.js');
      await invalidateCache('user', `profile:${id}`);
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', error.message);
    }

    return successResponse(res, { user }, 'User updated successfully');
  } catch (error) {
    logger.error('Update user error:', error);
    return errorResponse(res, 'Failed to update user', 500);
  }
};

/**
 * Approve a teacher (Admin only)
 * PUT /api/admin/users/:userId/approve
 */
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role !== 'teacher') {
      return errorResponse(res, 'Only teachers can be approved through this endpoint', 400);
    }

    // Update approval status
    user.approvalStatus = 'approved';
    user.approvedBy = req.userId;
    user.approvedAt = new Date();
    user.isActive = true;
    await user.save();
    
    // CRITICAL: Re-fetch user to ensure all fields are fresh
    // This ensures the response has the latest data
    const updatedUser = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    logger.info(`Teacher ${updatedUser.email} approved by admin ${req.userId}`);

    // Invalidate cache
    try {
      const { invalidateCache } = await import('../middleware/cache.middleware.js');
      await invalidateCache('user', `profile:${userId}`);
      // Also invalidate teacher classes cache
      await invalidateCache('teacher_classes', `teacher:classes:${userId}`);
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', error.message);
    }

    return successResponse(res, { user: updatedUser }, 'Teacher approved successfully');
  } catch (error) {
    logger.error('Approve user error:', error);
    return errorResponse(res, error.message || 'Failed to approve user', 500);
  }
};

/**
 * Assign institution to a user (Admin only)
 * PUT /api/admin/users/:userId/assign-institution
 */
export const assignInstitution = async (req, res) => {
  try {
    const { userId } = req.params;
    const { institutionId } = req.body;

    if (!institutionId) {
      return errorResponse(res, 'institutionId is required', 400);
    }

    // Verify institution exists
    const School = (await import('../models/School.js')).default;
    const school = await School.findById(institutionId);
    if (!school) {
      return errorResponse(res, 'Institution not found', 404);
    }

    const user = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update institution
    user.institutionId = institutionId;
    await user.save();

    logger.info(`Institution ${institutionId} assigned to user ${user.email} by admin ${req.userId}`);

    // CRITICAL: Re-fetch user to ensure all fields are fresh
    const updatedUser = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    // Invalidate cache
    try {
      const { invalidateCache } = await import('../middleware/cache.middleware.js');
      await invalidateCache('user', `profile:${userId}`);
      // Also invalidate teacher classes cache
      await invalidateCache('teacher_classes', `teacher:classes:${userId}`);
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', error.message);
    }

    return successResponse(res, { user: updatedUser }, 'Institution assigned successfully');
  } catch (error) {
    logger.error('Assign institution error:', error);
    return errorResponse(res, error.message || 'Failed to assign institution', 500);
  }
};

/**
 * Reject a teacher (Admin only)
 * PUT /api/admin/users/:userId/reject
 */
export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role !== 'teacher') {
      return errorResponse(res, 'Only teachers can be rejected through this endpoint', 400);
    }

    // Update approval status
    user.approvalStatus = 'rejected';
    user.rejectedBy = req.userId;
    user.rejectedAt = new Date();
    user.rejectionReason = reason || 'Rejected by administrator';
    user.isActive = false; // Deactivate rejected teachers
    await user.save();
    
    // CRITICAL: Re-fetch user to ensure all fields are fresh
    const updatedUser = await User.findById(userId)
      .populate('institutionId', 'name address')
      .select('-password -refreshToken');

    logger.info(`Teacher ${updatedUser.email} rejected by admin ${req.userId}`);

    // Invalidate cache
    try {
      const { invalidateCache } = await import('../middleware/cache.middleware.js');
      await invalidateCache('user', `profile:${userId}`);
      await invalidateCache('teacher_classes', `teacher:classes:${userId}`);
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', error.message);
    }

    return successResponse(res, { user: updatedUser }, 'Teacher rejected successfully');
  } catch (error) {
    logger.error('Reject user error:', error);
    return errorResponse(res, error.message || 'Failed to reject user', 500);
  }
};

/**
 * Delete a teacher (Admin only)
 * DELETE /api/admin/users/:userId
 */
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    if (user.role !== 'teacher') {
      return errorResponse(res, 'Only teachers can be deleted through this endpoint', 400);
    }

    // Check if teacher has assigned classes
    const Class = (await import('../models/Class.js')).default;
    const classesWithTeacher = await Class.find({ teacherId: userId, isActive: true });
    
    if (classesWithTeacher.length > 0) {
      return errorResponse(
        res, 
        `Cannot delete teacher. They are assigned to ${classesWithTeacher.length} active class(es). Please remove them from classes first.`,
        400
      );
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`Teacher ${user.email} deleted by admin ${req.userId}`);

    // Invalidate cache
    try {
      const { invalidateCache } = await import('../middleware/cache.middleware.js');
      await invalidateCache('user', `profile:${userId}`);
      await invalidateCache('teacher_classes', `teacher:classes:${userId}`);
    } catch (error) {
      logger.warn('Failed to invalidate user cache:', error.message);
    }

    return successResponse(res, { message: 'Teacher deleted successfully' }, 'Teacher deleted successfully');
  } catch (error) {
    logger.error('Delete user error:', error);
    return errorResponse(res, error.message || 'Failed to delete user', 500);
  }
};

/**
 * Register FCM token (for push notifications)
 * POST /api/users/:id/fcm-token
 */
export const registerFCMToken = async (req, res) => {
  try {
    const { id } = req.params;
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return errorResponse(res, 'FCM token is required', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Update deviceToken (FCM token) in user model
    user.deviceToken = fcmToken;
    await user.save();

    logger.info(`FCM token registered for user ${id}`);

    return successResponse(res, { 
      message: 'FCM token registered successfully',
      userId: user._id
    }, 'FCM token registered successfully');
  } catch (error) {
    logger.error('Register FCM token error:', error);
    return errorResponse(res, 'Failed to register FCM token', 500);
  }
};

/**
 * Update user location
 * PUT /api/users/:id/location
 */
export const updateUserLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return errorResponse(res, 'Latitude and longitude are required', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    await user.updateLocation(lat, lng);

    return successResponse(res, { user: user.toJSON() }, 'Location updated successfully');
  } catch (error) {
    logger.error('Update location error:', error);
    return errorResponse(res, 'Failed to update location', 500);
  }
};

/**
 * Update user safety status
 * PUT /api/users/:id/safety-status
 */
export const updateSafetyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['safe', 'missing', 'at_risk', 'evacuating'].includes(status)) {
      return errorResponse(res, 'Invalid safety status', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    await user.updateSafetyStatus(status);

    logger.info(`Safety status updated for user ${id}: ${status}`);

    return successResponse(res, { user: user.toJSON() }, 'Safety status updated successfully');
  } catch (error) {
    logger.error('Update safety status error:', error);
    return errorResponse(res, 'Failed to update safety status', 500);
  }
};

/**
 * List users (Admin only)
 * GET /api/users
 */
export const listUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, institutionId, search, approvalStatus } = req.query;

    // Build query
    const query = {};
    
    // RBAC Refinement: Teachers can see students from their classes OR pending students from their institution
    if (req.userRole === 'teacher') {
      // Teachers typically only need to see students
      if (!role) {
        query.role = 'student';
      }
      
      // Filter by teacher's classes OR pending approval students
      const Class = (await import('../models/Class.js')).default;
      const teacherClasses = await Class.find({ 
        teacherId: req.userId,
        isActive: true 
      }).select('_id');
      
      if (teacherClasses.length > 0) {
        // CRITICAL: Teachers can ONLY see students from their assigned classes
        // This enforces the "Chain of Trust" - teachers only see students they're responsible for
        const classIds = teacherClasses.map(c => c._id);
        query.classId = { $in: classIds };
        // Remove the $or condition - teachers only see students in their classes
      } else {
        // If teacher has no classes assigned, they see nothing
        // This ensures teachers must be assigned to classes before they can see students
        query.classId = { $exists: false }; // This will return no results
      }
    }
    
    if (role) query.role = role;
    if (institutionId && req.userRole === 'admin') {
      // Only admins can filter by any institution
      query.institutionId = institutionId;
    }
    if (approvalStatus) query.approvalStatus = approvalStatus; // RBAC Refinement: Filter by approval status
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('institutionId', 'name')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    return paginatedResponse(res, users, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Users retrieved successfully');
  } catch (error) {
    logger.error('List users error:', error);
    return errorResponse(res, 'Failed to list users', 500);
  }
};

/**
 * Phase 3.5.4: Bulk operations on users
 * POST /api/users/bulk
 */
export const bulkUserOperation = async (req, res) => {
  try {
    const { userIds, action } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return errorResponse(res, 'User IDs are required', 400);
    }

    if (!['activate', 'deactivate', 'delete'].includes(action)) {
      return errorResponse(res, 'Invalid action. Must be: activate, deactivate, or delete', 400);
    }

    const results = [];
    let affected = 0;

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        if (action === 'delete') {
          await User.findByIdAndDelete(userId);
          affected++;
          results.push({ userId, success: true, action: 'deleted' });
          logger.info(`User deleted: ${user.email}`);
        } else {
          user.isActive = action === 'activate';
          await user.save();
          affected++;
          results.push({ userId, success: true, action, isActive: user.isActive });
          logger.info(`User ${action}d: ${user.email}`);
        }
      } catch (error) {
        logger.error(`Error processing user ${userId}:`, error);
        results.push({ userId, success: false, error: error.message });
      }
    }

    return successResponse(res, { affected, results }, `Bulk operation completed: ${affected} users ${action}d`);
  } catch (error) {
    logger.error('Bulk user operation error:', error);
    return errorResponse(res, 'Failed to perform bulk operation', 500);
  }
};

/**
 * Phase 3.5.4: Export users to CSV/Excel
 * GET /api/users/export
 */
export const exportUsers = async (req, res) => {
  try {
    const { format = 'csv', role, institutionId, search, isActive } = req.query;

    if (!['csv', 'excel'].includes(format)) {
      return errorResponse(res, 'Invalid format. Must be: csv or excel', 400);
    }

    // Build query (same as listUsers)
    const query = {};
    if (role) query.role = role;
    if (institutionId) query.institutionId = institutionId;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .populate('institutionId', 'name')
      .select('-password -refreshToken')
      .sort({ createdAt: -1 });

    if (format === 'csv') {
      const csv = [
        ['Name', 'Email', 'Role', 'Institution', 'Grade', 'Section', 'Status', 'Created At'].join(',')
      ];

      users.forEach((user) => {
        csv.push([
          `"${user.name || ''}"`,
          `"${user.email || ''}"`,
          `"${user.role || ''}"`,
          `"${typeof user.institutionId === 'object' && user.institutionId ? user.institutionId.name : ''}"`,
          `"${user.grade || ''}"`,
          `"${user.section || ''}"`,
          `"${user.isActive ? 'Active' : 'Inactive'}"`,
          `"${user.createdAt ? new Date(user.createdAt).toISOString() : ''}"`
        ].join(','));
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.csv`);
      return res.send(csv.join('\n'));
    } else {
      // Excel format using ExcelJS
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Users');

      // Add headers
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Role', key: 'role', width: 15 },
        { header: 'Institution', key: 'institution', width: 30 },
        { header: 'Grade', key: 'grade', width: 10 },
        { header: 'Section', key: 'section', width: 10 },
        { header: 'Status', key: 'status', width: 10 },
        { header: 'Created At', key: 'createdAt', width: 20 }
      ];

      // Add data
      users.forEach((user) => {
        worksheet.addRow({
          name: user.name || '',
          email: user.email || '',
          role: user.role || '',
          institution: typeof user.institutionId === 'object' && user.institutionId ? user.institutionId.name : '',
          grade: user.grade || '',
          section: user.section || '',
          status: user.isActive ? 'Active' : 'Inactive',
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : ''
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=users-${Date.now()}.xlsx`);
      await workbook.xlsx.write(res);
      return res.end();
    }
  } catch (error) {
    logger.error('Export users error:', error);
    return errorResponse(res, 'Failed to export users', 500);
  }
};
