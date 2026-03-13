/**
 * Parent-Child Link Request Model
 * Tracks parent requests to link to students
 * Supports quick auto-verification for matching conditions
 */

import mongoose from 'mongoose';

const parentChildLinkRequestSchema = new mongoose.Schema({
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
  requestMethod: {
    type: String,
    enum: ['qr_scan', 'student_id', 'email', 'manual'],
    required: [true, 'Request method is required'],
    default: 'qr_scan'
  },
  relationship: {
    type: String,
    enum: ['father', 'mother', 'guardian', 'other'],
    required: [true, 'Relationship type is required'],
    default: 'other'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto_verified'],
    default: 'pending',
    index: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    trim: true,
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: null
  },
  // Store request data for reference
  requestData: {
    qrCode: String,
    studentId: String,
    email: String,
    studentName: String,
    grade: String,
    section: String
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate pending requests
parentChildLinkRequestSchema.index({ parentId: 1, studentId: 1, status: 1 }, { 
  unique: true,
  partialFilterExpression: { status: 'pending' }
});

// Index for quick lookup of pending requests
parentChildLinkRequestSchema.index({ status: 1, createdAt: -1 });

// Index for parent's requests
parentChildLinkRequestSchema.index({ parentId: 1, status: 1 });

// Method to approve request
parentChildLinkRequestSchema.methods.approve = async function(verifiedBy, notes = null) {
  this.status = 'approved';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  if (notes) {
    this.notes = notes;
  }
  await this.save();
  return this;
};

// Method to reject request
parentChildLinkRequestSchema.methods.reject = async function(verifiedBy, reason = null) {
  this.status = 'rejected';
  this.verifiedBy = verifiedBy;
  this.verifiedAt = new Date();
  if (reason) {
    this.rejectionReason = reason;
  }
  await this.save();
  return this;
};

// Static method to find pending requests for a parent
parentChildLinkRequestSchema.statics.findPendingByParent = function(parentId) {
  return this.find({ parentId, status: 'pending' })
    .populate('studentId', 'name email grade section classId institutionId qrCode')
    .sort({ createdAt: -1 });
};

// Static method to find pending requests for approval (by institution)
parentChildLinkRequestSchema.statics.findPendingForApproval = function(institutionId) {
  return this.find({ status: 'pending' })
    .populate({
      path: 'studentId',
      match: { institutionId: institutionId },
      select: 'name email grade section classId institutionId'
    })
    .populate('parentId', 'name email phone parentProfile')
    .sort({ createdAt: -1 });
};

const ParentChildLinkRequest = mongoose.model('ParentChildLinkRequest', parentChildLinkRequestSchema);

export default ParentChildLinkRequest;

