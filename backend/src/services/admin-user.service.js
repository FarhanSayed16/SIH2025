/**
 * Admin User Creation Service
 * Phase 2: Allows admins to create teachers, students (roster records), and parents
 */

import User from '../models/User.js';
import logger from '../config/logger.js';
import bcrypt from 'bcrypt';

/**
 * Create a teacher (admin only)
 * @param {string} adminId - Admin user ID
 * @param {Object} teacherData - Teacher data
 * @param {string} teacherData.name - Teacher name (required)
 * @param {string} teacherData.email - Teacher email (required)
 * @param {string} teacherData.password - Teacher password (required)
 * @param {string} teacherData.phone - Teacher phone (optional)
 * @param {string} teacherData.institutionId - Institution ID (required if admin has no institutionId)
 * @returns {Object} Created teacher (without password)
 */
export const createTeacher = async (adminId, teacherData) => {
  try {
    const { name, email, password, phone, institutionId: providedInstitutionId } = teacherData;

    // Get admin user to extract institutionId
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Determine institutionId: use admin's or require it in request
    let institutionId = admin.institutionId;
    if (!institutionId) {
      // System-level admin: require institutionId in request
      if (!providedInstitutionId) {
        throw new Error('institutionId is required when admin has no institution');
      }
      institutionId = providedInstitutionId;
    } else if (providedInstitutionId) {
      // Admin has institutionId but also provided one - use admin's (for security)
      logger.warn(`Admin ${adminId} provided institutionId but already has one. Using admin's institutionId.`);
    }

    // Validate required fields
    if (!name || !email || !password) {
      throw new Error('Name, email, and password are required');
    }

    // Validate password length (min 6 as per User model)
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create teacher
    const teacher = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'teacher',
      userType: 'account_user',
      institutionId: institutionId,
      phone: phone ? phone.trim() : null,
      isActive: true,
      approvalStatus: 'pending' // Teachers need approval through admin UI
    });

    logger.info(`Teacher created by admin ${adminId}: ${teacher.email}`);

    // Return teacher without password
    const teacherObj = teacher.toJSON();
    delete teacherObj.password;
    delete teacherObj.refreshToken;

    return teacherObj;
  } catch (error) {
    logger.error('Create teacher error:', error);
    throw error;
  }
};

/**
 * Create a student (roster record) - admin only
 * @param {string} adminId - Admin user ID
 * @param {Object} studentData - Student data
 * @param {string} studentData.name - Student name (required)
 * @param {string} studentData.grade - Student grade (required)
 * @param {string} studentData.section - Student section (required)
 * @param {string} studentData.rollNo - Student roll number (optional)
 * @param {string} studentData.parentName - Parent name (optional)
 * @param {string} studentData.parentPhone - Parent phone (optional)
 * @param {string} studentData.parentId - Parent user ID (optional)
 * @param {string} studentData.institutionId - Institution ID (required if admin has no institutionId)
 * @returns {Object} Created student (roster record)
 */
export const createStudent = async (adminId, studentData) => {
  try {
    const {
      name,
      grade,
      section,
      rollNo,
      parentName,
      parentPhone,
      parentId,
      email, // Optional - if provided, creates account_user
      password, // Optional - if provided with email, creates account_user
      phone, // Optional - required if email/password provided
      institutionId: providedInstitutionId
    } = studentData;

    // Get admin user to extract institutionId
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Determine institutionId: use admin's or require it in request
    let institutionId = admin.institutionId;
    if (!institutionId) {
      // System-level admin: require institutionId in request
      if (!providedInstitutionId) {
        throw new Error('institutionId is required when admin has no institution');
      }
      institutionId = providedInstitutionId;
    } else if (providedInstitutionId) {
      // Admin has institutionId but also provided one - use admin's (for security)
      logger.warn(`Admin ${adminId} provided institutionId but already has one. Using admin's institutionId.`);
    }

    // Validate required fields
    if (!name || !grade || !section) {
      throw new Error('Name, grade, and section are required');
    }

    // Validate grade
    const validGrades = ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
    if (!validGrades.includes(grade)) {
      throw new Error('Invalid grade. Must be one of: KG, 1-12');
    }

    // Check rollNo uniqueness within institution if provided
    if (rollNo) {
      const existingStudent = await User.findOne({
        institutionId: institutionId,
        rollNo: rollNo.trim(),
        userType: 'roster_record'
      });
      if (existingStudent) {
        throw new Error(`Student with roll number ${rollNo} already exists in this institution`);
      }
    }

    // CRITICAL REFACTOR: Use credential-based logic, not grade-based
    // If admin provides email + password, create as account_user
    // If no credentials, create as roster_record
    const hasCredentials = !!(studentData.email && studentData.password);
    const userType = hasCredentials ? 'account_user' : 'roster_record';
    
    // Build student data
    const studentDataToCreate = {
      name: name.trim(),
      role: 'student',
      userType: userType,
      institutionId: institutionId,
      grade: grade, // Grade is purely informational
      section: section.trim(),
      rollNo: rollNo ? rollNo.trim() : null,
      parentName: parentName ? parentName.trim() : null,
      parentPhone: parentPhone ? parentPhone.trim() : null,
      parentId: parentId || null,
      isActive: true,
      approvalStatus: hasCredentials ? 'pending' : 'approved' // Account users need approval, roster records are auto-approved
    };
    
    // Add credentials only if provided
    if (hasCredentials) {
      studentDataToCreate.email = studentData.email.trim().toLowerCase();
      studentDataToCreate.password = studentData.password; // Will be hashed by pre-save hook
      
      // Validate phone if provided (required for account_user)
      if (studentData.phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(studentData.phone.trim())) {
          throw new Error('Enter a valid 10-digit Indian phone number');
        }
        studentDataToCreate.phone = studentData.phone.trim();
      }
    } else if (studentData.phone) {
      // Optional phone for roster records
      const phoneRegex = /^[6-9]\d{9}$/;
      if (phoneRegex.test(studentData.phone.trim())) {
        studentDataToCreate.phone = studentData.phone.trim();
      }
    }

    // Create student
    const student = await User.create(studentDataToCreate);

    logger.info(`Student (${userType}) created by admin ${adminId}: ${student.name} (Grade ${grade}${section})`);

    // Return student
    const studentObj = student.toJSON();
    return studentObj;
  } catch (error) {
    logger.error('Create student error:', error);
    throw error;
  }
};

/**
 * Create a parent (admin only)
 * @param {string} adminId - Admin user ID
 * @param {Object} parentData - Parent data
 * @param {string} parentData.name - Parent name (required)
 * @param {string} parentData.phone - Parent phone (required)
 * @param {string} parentData.password - Parent password (required)
 * @param {string} parentData.email - Parent email (optional)
 * @param {string} parentData.institutionId - Institution ID (required if admin has no institutionId)
 * @returns {Object} Created parent (without password)
 */
export const createParent = async (adminId, parentData) => {
  try {
    const { name, phone, password, email, institutionId: providedInstitutionId } = parentData;

    // Get admin user to extract institutionId
    const admin = await User.findById(adminId);
    if (!admin) {
      throw new Error('Admin user not found');
    }

    // Determine institutionId: use admin's or require it in request
    let institutionId = admin.institutionId;
    if (!institutionId) {
      // System-level admin: require institutionId in request
      if (!providedInstitutionId) {
        throw new Error('institutionId is required when admin has no institution');
      }
      institutionId = providedInstitutionId;
    } else if (providedInstitutionId) {
      // Admin has institutionId but also provided one - use admin's (for security)
      logger.warn(`Admin ${adminId} provided institutionId but already has one. Using admin's institutionId.`);
    }

    // Validate required fields
    if (!name || !phone || !password) {
      throw new Error('Name, phone, and password are required');
    }

    // Validate password length (min 6 as per User model)
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Check if phone already exists (global uniqueness)
    const existingUser = await User.findOne({ phone: phone.trim() });
    if (existingUser) {
      throw new Error('User with this phone number already exists');
    }

    // Check if email already exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create parent
    const parent = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.toLowerCase().trim() : null,
      password: hashedPassword,
      role: 'parent',
      userType: 'account_user',
      institutionId: institutionId,
      isActive: true,
      approvalStatus: 'approved' // Parents are auto-approved
    });

    logger.info(`Parent created by admin ${adminId}: ${parent.phone}${parent.email ? ` (${parent.email})` : ''}`);

    // Return parent without password
    const parentObj = parent.toJSON();
    delete parentObj.password;
    delete parentObj.refreshToken;

    return parentObj;
  } catch (error) {
    logger.error('Create parent error:', error);
    throw error;
  }
};

