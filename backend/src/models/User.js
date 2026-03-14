import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  // RBAC Refinement: User Type Distinction
  userType: {
    type: String,
    enum: ['account_user', 'roster_record'],
    // CRITICAL REFACTOR: Remove grade-based default logic
    // userType should be explicitly set during creation based on credentials
    // Default to account_user for backward compatibility (will be overridden if needed)
    default: 'account_user'
  },
  email: {
    type: String,
    required: function() {
      // Only required for account users
      return this.userType === 'account_user' || this.role !== 'student';
    },
    unique: true,
    sparse: true, // Allow null values for roster records
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: function() {
      // Only required for account users
      return this.userType === 'account_user' || this.role !== 'student';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password by default
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin', 'parent', 'SYSTEM_ADMIN'],
    required: [true, 'Role is required'],
    default: 'student'
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: function() {
      // Admin and SYSTEM_ADMIN may not have institution
      if (this.role === 'admin' || this.role === 'SYSTEM_ADMIN') return false;
      
      // For students: institutionId is optional during registration
      // It will be set when they join a classroom via QR code
      // For roster records (KG-4th), teachers create them with institutionId
      if (this.role === 'student') {
        // Optional during registration, will be set when joining classroom
        return false;
      }
      
      // Teachers and parents must have institution
      return true;
    }
  },
  // Phase 2.5: K-12 Multi-Access fields
  grade: {
    type: String,
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: function() {
      // Only required for students, but allow for flexibility during registration
      return false; // Temporarily optional to allow existing users without these fields
      // return this.role === 'student'; // Original requirement
    }
  },
  section: {
    type: String, // A, B, C, etc.
    trim: true,
    required: function() {
      // Only required for students, but allow for flexibility during registration
      return false; // Temporarily optional to allow existing users without these fields
      // return this.role === 'student'; // Original requirement
    }
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: function() {
      // Only required for students, but allow for flexibility during registration
      return false; // Temporarily optional to allow existing users without these fields
      // return this.role === 'student'; // Original requirement
    }
  },
  accessLevel: {
    type: String,
    enum: ['full', 'shared', 'teacher_led', 'none'],
    default: function() {
      if (this.role === 'student' && this.grade) {
        const gradeNum = parseInt(this.grade) || 0;
        if (gradeNum >= 9) return 'full';
        if (gradeNum >= 6) return 'shared';
        if (gradeNum >= 0 || this.grade === 'KG') return 'teacher_led';
      }
      return 'full'; // Default for non-students
    }
  },
  canUseApp: {
    type: Boolean,
    default: function() {
      if (this.role === 'student' && this.grade) {
        const gradeNum = parseInt(this.grade) || 0;
        return gradeNum >= 6; // 6th std and above can use app
      }
      return true; // Teachers, admins can always use app
    }
  },
  requiresTeacherAuth: {
    type: Boolean,
    default: function() {
      if (this.role === 'student' && this.grade) {
        const gradeNum = parseInt(this.grade) || 0;
        return gradeNum < 6 || this.grade === 'KG'; // KG-5th require teacher
      }
      return false;
    }
  },
  // RBAC Refinement: Teacher Approval System
  approvalStatus: {
    type: String,
    enum: ['pending', 'registered', 'approved', 'rejected'],
    default: function() {
      // All new account_user registrations start as "registered"
      if (this.userType === 'account_user') {
        return 'registered';
      }
      return 'registered';
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  approvalNotes: {
    type: String,
    default: null,
    trim: true
  },
  // RBAC Refinement: Classroom Join Request
  joinRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassroomJoinRequest',
    default: null
  },
  qrCode: {
    type: String,
    // Don't set unique: true here - it will be created as sparse index below
    default: null
  },
  qrBadgeId: {
    type: String,
    // Don't set unique: true here - it will be created as sparse index below
    default: null
  },
  // RBAC Refinement: Classroom QR (for joining)
  classroomQRCode: {
    type: String,
    default: null
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Parent Monitoring System: Children array for parents
  childrenIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: []
  },
  // Parent Monitoring System: Parent profile information
  parentProfile: {
    phoneNumber: {
      type: String,
      trim: true,
      required: function() {
        return this.role === 'parent';
      }
    },
    alternatePhoneNumber: {
      type: String,
      trim: true,
      default: null
    },
    relationship: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'other'
    },
    emergencyContact: {
      type: Boolean,
      default: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  // Phase 2: Admin User Creation - Additional fields
  phone: {
    type: String,
    trim: true,
    // No default - field should be absent if not provided (for sparse index compatibility)
    // Required for account_user (login-capable users)
  },
  rollNo: {
    type: String,
    trim: true,
    default: null,
    // Unique within institution (compound index will be added below)
  },
  parentName: {
    type: String,
    trim: true,
    default: null
  },
  parentPhone: {
    type: String,
    trim: true,
    default: null
  },
  // Accessibility: Physical disability status
  hasDisability: {
    type: Boolean,
    default: false
  },
  disabilityType: {
    type: String,
    enum: ['hearing_impaired', 'visual_impaired', 'mobility_impaired', 'other', null],
    default: null
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0]
    }
  },
  safetyStatus: {
    type: String,
    enum: ['safe', 'missing', 'at_risk', 'evacuating'],
    default: 'safe'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  deviceToken: {
    type: String, // For push notifications
    default: null
  },
  progress: {
    completedModules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module'
    }],
    badges: [{
      type: String
    }],
    preparednessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Phase 3.3.1: Score breakdown and history
    scoreBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    scoreHistory: [{
      score: {
        type: Number,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }],
    loginStreak: {
      type: Number,
      default: 0,
      min: 0
    },
    lastLoginDate: {
      type: Date,
      default: null
    }
  },
  refreshToken: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes (email index is already defined as unique: true in schema, so we don't need to add it again)
// userSchema.index({ email: 1 }, { unique: true }); // Removed - already defined in schema
userSchema.index({ institutionId: 1, role: 1 });
userSchema.index({ currentLocation: '2dsphere' });
userSchema.index({ safetyStatus: 1, institutionId: 1 });
// Phase 2.5: K-12 Multi-Access indexes
// Note: qrCode and qrBadgeId indexes are created manually (see seed script or migrations)
// This is because Mongoose has issues with sparse unique indexes when auto-creating
userSchema.index({ classId: 1 });
userSchema.index({ grade: 1, section: 1, institutionId: 1 });
userSchema.index({ accessLevel: 1 });
// RBAC Refinement: New indexes
userSchema.index({ userType: 1, role: 1 });
userSchema.index({ approvalStatus: 1, role: 1 });
userSchema.index({ joinRequestId: 1 });
userSchema.index({ classroomQRCode: 1 });
// Phase 2: Admin User Creation - Indexes
userSchema.index({ phone: 1 }, { unique: true, sparse: true }); // Global unique phone (for parents)
userSchema.index({ institutionId: 1, rollNo: 1, userType: 1 }, { unique: true, sparse: true }); // RollNo unique per institution

// Hash password before saving (only if password exists)
userSchema.pre('save', async function(next) {
  // Skip password hashing for roster records (no password)
  if (this.userType === 'roster_record' || !this.password) {
    return next();
  }
  
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password (only for account users)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.userType === 'roster_record' || !this.password) {
    throw new Error('Roster records do not have passwords');
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update location
userSchema.methods.updateLocation = function(lat, lng) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [parseFloat(lng), parseFloat(lat)]
  };
  this.lastSeen = new Date();
  return this.save();
};

// Method to update safety status
userSchema.methods.updateSafetyStatus = function(status) {
  this.safetyStatus = status;
  this.lastSeen = new Date();
  return this.save();
};

// Virtual for full name (if needed later)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Remove password from JSON output and convert _id to id
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  // Convert _id to id for frontend compatibility
  if (obj._id) {
    obj.id = obj._id.toString();
    delete obj._id;
  }
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;

