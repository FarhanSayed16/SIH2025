import mongoose from 'mongoose';

/**
 * RBAC Refinement: Classroom Join Request Model
 * Tracks student requests to join classrooms via QR code scanning or class code
 * PHASE 2: Updated to support both QR and classCode joining methods
 */
const classroomJoinRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  qrCode: {
    type: String,
    required: false, // PHASE 2: Made optional to support classCode joins
    unique: true,
    sparse: true, // PHASE 2: Sparse index to allow multiple nulls
    index: true
  },
  joinMethod: {
    type: String,
    enum: ['qr', 'classCode', 'admin', 'migrated'],
    default: 'classCode', // PHASE 2: Default to classCode for new joins
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // QR codes expire after 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    // Index created separately below to avoid duplicate index warning
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null,
    trim: true
  },
  studentInfo: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      trim: true
    },
    parentName: {
      type: String,
      trim: true
    },
    parentPhone: {
      type: String,
      trim: true
    }
  },
  notes: {
    type: String,
    default: null,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
classroomJoinRequestSchema.index({ classId: 1, status: 1 });
classroomJoinRequestSchema.index({ teacherId: 1, status: 1 });
classroomJoinRequestSchema.index({ studentId: 1, status: 1 });
classroomJoinRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to check if request is expired
classroomJoinRequestSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

// Method to expire the request
classroomJoinRequestSchema.methods.expire = function() {
  this.status = 'expired';
  return this.save();
};

// Method to approve the request
classroomJoinRequestSchema.methods.approve = function(teacherId, notes = null) {
  this.status = 'approved';
  this.approvedAt = new Date();
  this.notes = notes;
  return this.save();
};

// Method to reject the request
classroomJoinRequestSchema.methods.reject = function(teacherId, reason = null) {
  this.status = 'rejected';
  this.rejectedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

// Static method to find active requests for a class
classroomJoinRequestSchema.statics.findPendingByClass = function(classId) {
  return this.find({
    classId,
    status: 'pending',
    expiresAt: { $gt: new Date() }
  }).populate('studentId', 'name email grade section').sort({ requestedAt: -1 });
};

// Static method to find requests by student
classroomJoinRequestSchema.statics.findByStudent = function(studentId) {
  return this.find({ studentId })
    .populate('classId', 'grade section classCode')
    .populate('teacherId', 'name email')
    .sort({ requestedAt: -1 });
};

// Pre-save hook to auto-expire old requests
classroomJoinRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'expired') {
    if (this.expiresAt && this.expiresAt < new Date()) {
      this.status = 'expired';
    }
  }
  next();
});

const ClassroomJoinRequest = mongoose.model('ClassroomJoinRequest', classroomJoinRequestSchema);

export default ClassroomJoinRequest;

