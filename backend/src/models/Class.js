import mongoose from 'mongoose';

const classSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  grade: {
    type: String,
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    required: [true, 'Grade is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  classCode: {
    type: String,
    unique: true,
    required: [true, 'Class code is required'],
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Made optional - can be assigned later
    default: null
  },
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deviceIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device'
  }],
  roomNumber: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    default: 40,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // PHASE 3: Flag to identify seed-created classes
  isSeeded: {
    type: Boolean,
    default: false
  },
  // Academic Year support - allows same grade/section in different years
  academicYear: {
    type: String,
    required: false, // Optional for backward compatibility
    default: function() {
      // Default to current academic year (e.g., "2024-2025")
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth(); // 0-11
      // Academic year typically starts in June/July, so if month >= 6, it's the new year
      if (month >= 6) {
        return `${year}-${year + 1}`;
      } else {
        return `${year - 1}-${year}`;
      }
    },
    trim: true
  },
  // RBAC Refinement: Classroom QR Code for student joining
  joinQRCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null,
    index: true
  },
  joinQRExpiresAt: {
    type: Date,
    default: null,
    index: true
  },
  // RBAC Refinement: Pending join requests
  pendingJoinRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassroomJoinRequest'
  }]
}, {
  timestamps: true
});

// Indexes
// CRITICAL: Unique index now includes academicYear to allow same grade/section in different years
classSchema.index({ institutionId: 1, grade: 1, section: 1, academicYear: 1 }, { unique: true });
classSchema.index({ teacherId: 1 });
// Note: classCode already has unique: true, so no need for separate index
classSchema.index({ isActive: 1, institutionId: 1 });
classSchema.index({ academicYear: 1, institutionId: 1 }); // For filtering by academic year
// RBAC Refinement: Join QR indexes - CRITICAL: Must be sparse to allow multiple nulls
classSchema.index({ joinQRCode: 1 }, { unique: true, sparse: true });

// Virtual for student count
classSchema.virtual('studentCount').get(function() {
  return this.studentIds ? this.studentIds.length : 0;
});

// Method to add student
classSchema.methods.addStudent = function(studentId) {
  if (!this.studentIds.includes(studentId)) {
    this.studentIds.push(studentId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove student
classSchema.methods.removeStudent = function(studentId) {
  this.studentIds = this.studentIds.filter(id => id.toString() !== studentId.toString());
  return this.save();
};

// Method to generate class code
classSchema.statics.generateClassCode = function(institutionId, grade, section) {
  // Format: S{institutionId}-{grade}-{section}
  // e.g., "S507f1d77e1f86e20894e4f42-5-A"
  return `S${institutionId.toString().substring(0, 12)}-${grade}-${section}`;
};

// Pre-save hook to generate class code if not provided
classSchema.pre('save', async function(next) {
  if (!this.classCode && this.institutionId && this.grade && this.section) {
    this.classCode = classSchema.statics.generateClassCode(
      this.institutionId,
      this.grade,
      this.section
    );
  }
  
  // CRITICAL: For sparse index to work, don't explicitly set joinQRCode to null
  // If it's null and not modified, unset it so sparse index doesn't see it
  if (this.isNew && this.joinQRCode === null && !this.isModified('joinQRCode')) {
    this.joinQRCode = undefined; // Don't set it at all
  }
  
  next();
});

const Class = mongoose.model('Class', classSchema);

export default Class;

