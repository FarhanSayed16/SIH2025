import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    unique: true,
    required: [true, 'Device ID is required'],
    trim: true
  },
  deviceName: {
    type: String,
    required: [true, 'Device name is required'],
    trim: true
  },
  deviceType: {
    type: String,
    enum: [
      // Mobile devices (Phase 2.5)
      'class_tablet', 'projector_device', 'teacher_device', 'personal',
      // IoT sensors (Phase 3.4.2)
      'fire-sensor', 'flood-sensor', 'motion-sensor', 'temperature-sensor', 
      'smoke-sensor', 'panic-button', 'siren', 'led-strip',
      // Phase 201: Multi-sensor IoT nodes
      'multi-sensor'
    ],
    required: [true, 'Device type is required']
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  registrationToken: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  metadata: {
    os: String,
    osVersion: String,
    appVersion: String,
    model: String
  },
  // Phase 3.4.2: IoT sensor configuration
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
  room: {
    type: String,
    default: null
  },
  configuration: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'offline'],
    default: 'active'
  },
  deviceToken: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  // Telemetry array (limited to last 100 entries for quick access)
  telemetry: [{
    timestamp: { type: Date, default: Date.now },
    data: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true
});

// Indexes
// Note: deviceId already has unique: true, so no need for separate index
// Note: registrationToken already has unique: true (sparse), so no need for separate index
deviceSchema.index({ institutionId: 1, deviceType: 1 });
deviceSchema.index({ classId: 1 });
deviceSchema.index({ isActive: 1 });

// Method to update last seen
deviceSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Method to assign to class
deviceSchema.methods.assignToClass = function(classId) {
  this.classId = classId;
  return this.save();
};

// Method to unassign from class
deviceSchema.methods.unassignFromClass = function() {
  this.classId = null;
  return this.save();
};

// Static method to find devices by class
deviceSchema.statics.findByClass = function(classId) {
  return this.find({ classId, isActive: true });
};

// Static method to find devices by institution and type
deviceSchema.statics.findByInstitutionAndType = function(institutionId, deviceType) {
  return this.find({ institutionId, deviceType, isActive: true });
};

// Phase 3.4.2: Add telemetry method
deviceSchema.methods.addTelemetry = function(data, limitTo = true) {
  this.telemetry = this.telemetry || [];
  this.telemetry.push({
    timestamp: new Date(),
    data
  });

  // Keep only last 100 entries if limitTo is true
  if (limitTo && this.telemetry.length > 100) {
    this.telemetry = this.telemetry.slice(-100);
  }

  this.lastSeen = new Date();
  return this.save();
};

// Phase 3.4.2: Update location method
deviceSchema.methods.updateLocation = function(lat, lng) {
  this.location = {
    type: 'Point',
    coordinates: [lng || 0, lat || 0]
  };
  this.lastSeen = new Date();
  return this.save();
};

// Phase 3.4.2: Geospatial index for location queries
deviceSchema.index({ location: '2dsphere' });

const Device = mongoose.model('Device', deviceSchema);

export default Device;
