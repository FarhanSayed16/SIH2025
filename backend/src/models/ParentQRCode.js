/**
 * Parent QR Code Model
 * Tracks QR codes for parent-student relationships
 * Used for teacher verification of parent identity (especially in kidnapping scenarios)
 */

import mongoose from 'mongoose';

const parentQRCodeSchema = new mongoose.Schema({
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
  relationshipId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentStudentRelationship',
    required: [true, 'Relationship ID is required'],
    index: true
  },
  qrCode: {
    type: String,
    required: [true, 'QR code is required'],
    unique: true,
    index: true
  },
  encryptedData: {
    type: String,
    required: [true, 'Encrypted data is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration date is required'],
    index: true
  },
  scanCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  lastScannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  scanHistory: [{
    scannedAt: {
      type: Date,
      default: Date.now
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    },
    verified: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
parentQRCodeSchema.index({ parentId: 1, studentId: 1 });
parentQRCodeSchema.index({ relationshipId: 1, isActive: 1 });

// TTL index to auto-delete expired QR codes (after 7 days of expiration)
// This also serves as an index for expiresAt queries
parentQRCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days

// Compound index for active QR codes (expiresAt is already indexed above)
parentQRCodeSchema.index({ isActive: 1, expiresAt: 1 });

// Virtual to populate parent details
parentQRCodeSchema.virtual('parent', {
  ref: 'User',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate student details
parentQRCodeSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate relationship details
parentQRCodeSchema.virtual('relationship', {
  ref: 'ParentStudentRelationship',
  localField: 'relationshipId',
  foreignField: '_id',
  justOne: true
});

// Method to check if QR code is expired
parentQRCodeSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Method to check if QR code is valid (not expired and active)
parentQRCodeSchema.methods.isValid = function() {
  return this.isActive && !this.isExpired();
};

// Method to log a scan
parentQRCodeSchema.methods.logScan = async function(scannedBy, location = null, verified = false) {
  this.scanCount += 1;
  this.lastScannedAt = new Date();
  this.lastScannedBy = scannedBy;
  
  this.scanHistory.push({
    scannedAt: new Date(),
    scannedBy,
    location: location || { lat: null, lng: null },
    verified
  });
  
  // Keep only last 50 scans in history
  if (this.scanHistory.length > 50) {
    this.scanHistory = this.scanHistory.slice(-50);
  }
  
  await this.save();
  return this;
};

// Method to deactivate QR code
parentQRCodeSchema.methods.deactivate = async function() {
  this.isActive = false;
  await this.save();
  return this;
};

// Static method to find active QR codes for a parent
parentQRCodeSchema.statics.findActiveByParent = function(parentId) {
  return this.find({
    parentId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
    .populate('student', 'name email grade section classId institutionId')
    .populate('relationship', 'relationship verified verifiedAt');
};

// Static method to find active QR codes for a student
parentQRCodeSchema.statics.findActiveByStudent = function(studentId) {
  return this.find({
    studentId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  })
    .populate('parent', 'name email phone parentProfile')
    .populate('relationship', 'relationship verified verifiedAt');
};

// Static method to find QR code by code string
parentQRCodeSchema.statics.findByCode = function(qrCode) {
  return this.findOne({ qrCode, isActive: true })
    .populate('parent', 'name email phone parentProfile')
    .populate('student', 'name email grade section classId institutionId')
    .populate('relationship', 'relationship verified verifiedAt verifiedBy');
};

const ParentQRCode = mongoose.model('ParentQRCode', parentQRCodeSchema);

export default ParentQRCode;

