import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  type: {
    type: String,
    enum: ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'medical', 'other'],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'high'
  },
  location: {
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
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional for device-triggered alerts
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    default: null // null if triggered by user
  },
  status: {
    type: String,
    enum: ['active', 'resolved', 'false_alarm'],
    default: 'active'
  },
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  studentStatus: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['safe', 'help', 'missing', 'at_risk', 'potentially_trapped'], // Phase 4.4: Added 'help' status
      default: 'safe'
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    }
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed, // For additional data (smoke level, temperature, etc.)
    default: {}
  },
  resolvedAt: {
    type: Date,
    default: null
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes
alertSchema.index({ institutionId: 1, status: 1, createdAt: -1 });
alertSchema.index({ location: '2dsphere' });
alertSchema.index({ type: 1, status: 1 });
alertSchema.index({ createdAt: -1 });

// Method to update student status
alertSchema.methods.updateStudentStatus = function(userId, status, location = null) {
  const studentStatus = this.studentStatus.find(s => s.userId.toString() === userId.toString());
  
  if (studentStatus) {
    studentStatus.status = status;
    studentStatus.lastUpdate = new Date();
    if (location) {
      studentStatus.location = {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      };
    }
  } else {
    this.studentStatus.push({
      userId,
      status,
      lastUpdate: new Date(),
      location: location ? {
        type: 'Point',
        coordinates: [location.lng, location.lat]
      } : {
        type: 'Point',
        coordinates: [0, 0]
      }
    });
  }
  
  return this.save();
};

// Method to resolve alert
alertSchema.methods.resolve = function(resolvedBy) {
  this.status = 'resolved';
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  return this.save();
};

// Static method to get active alerts for institution
alertSchema.statics.getActiveAlerts = function(institutionId) {
  return this.find({
    institutionId,
    status: 'active'
  }).sort({ createdAt: -1 });
};

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;

