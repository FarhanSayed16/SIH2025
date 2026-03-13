/**
 * Parent-Student Relationship Model
 * Tracks verified relationships between parents and students
 * Supports multiple parents per student and guardianship scenarios
 */

import mongoose from 'mongoose';

const parentStudentRelationshipSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Parent ID is required'],
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other'],
    required: [true, 'Relationship type is required'],
    default: 'other'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.verified === true;
    }
  },
  verifiedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  // Phase 1: QR Code Integration
  qrCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentQRCode',
    default: null
  },
  lastVerifiedAt: {
    type: Date,
    default: null
  },
  verificationMethod: {
    type: String,
    enum: ['manual', 'qr_scan', 'admin'],
    default: 'manual'
  },
  verificationHistory: [{
    verifiedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    method: {
      type: String,
      enum: ['manual', 'qr_scan', 'admin']
    },
    notes: {
      type: String,
      trim: true
    }
  }]
}, {
  timestamps: true
});

// Compound index to ensure unique parent-student relationships
parentStudentRelationshipSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

// Index for quick lookup of all children for a parent
parentStudentRelationshipSchema.index({ parentId: 1, verified: 1 });

// Index for quick lookup of all parents for a student
parentStudentRelationshipSchema.index({ studentId: 1, verified: 1 });

// Virtual to populate parent details
parentStudentRelationshipSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate student details
parentStudentRelationshipSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Method to verify relationship
parentStudentRelationshipSchema.methods.verify = async function(verifiedBy) {
  this.verified = true;
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  await this.save();
  return this;
};

// Method to unverify relationship
parentStudentRelationshipSchema.methods.unverify = async function() {
  this.verified = false;
  this.verifiedBy = undefined;
  this.verifiedAt = undefined;
  await this.save();
  return this;
};

// Static method to find verified relationships for a parent
parentStudentRelationshipSchema.statics.findVerifiedByParent = function(parentId) {
  return this.find({ parentId, verified: true })
    .populate('student', 'name email grade section classId institutionId qrCode')
    .populate('verifiedBy', 'name email role');
};

// Static method to find verified relationships for a student
parentStudentRelationshipSchema.statics.findVerifiedByStudent = function(studentId) {
  return this.find({ studentId, verified: true })
    .populate('parent', 'name email phone parentProfile')
    .populate('verifiedBy', 'name email role');
};

// Static method to check if relationship exists and is verified
parentStudentRelationshipSchema.statics.isVerified = async function(parentId, studentId) {
  const relationship = await this.findOne({ parentId, studentId, verified: true });
  return !!relationship;
};

const ParentStudentRelationship = mongoose.model('ParentStudentRelationship', parentStudentRelationshipSchema);

export default ParentStudentRelationship;

