import mongoose from 'mongoose';

const projectorSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: [true, 'Session ID is required'],
    trim: true
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    required: [true, 'Device ID is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    default: null
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Started by (teacher) is required']
  },
  currentContent: {
    type: {
      type: String,
      enum: ['module', 'game', 'quiz', 'video', 'image', 'presentation'],
      default: 'module'
    },
    contentId: String,
    contentName: String,
    slideIndex: {
      type: Number,
      default: 0
    },
    data: mongoose.Schema.Types.Mixed // Flexible content data
  },
  connectedDevices: [{
    deviceId: String,
    deviceName: String,
    connectedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  settings: {
    autoAdvance: {
      type: Boolean,
      default: false
    },
    allowStudentControl: {
      type: Boolean,
      default: false
    },
    syncRate: {
      type: Number,
      default: 1000 // milliseconds
    }
  }
}, {
  timestamps: true
});

// Indexes
// Note: sessionId already has unique: true, so no need for separate index
projectorSessionSchema.index({ deviceId: 1, status: 1 });
projectorSessionSchema.index({ classId: 1, status: 1 });
projectorSessionSchema.index({ startedBy: 1 });

// Method to generate session ID
projectorSessionSchema.statics.generateSessionId = async function() {
  const crypto = await import('crypto');
  return `PROJ-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
};

// Method to add connected device
projectorSessionSchema.methods.addDevice = function(deviceId, deviceName) {
  const existing = this.connectedDevices.find(
    d => d.deviceId === deviceId
  );
  
  if (existing) {
    existing.lastSeen = new Date();
  } else {
    this.connectedDevices.push({
      deviceId,
      deviceName,
      connectedAt: new Date(),
      lastSeen: new Date()
    });
  }
  
  return this.save();
};

// Method to update content
projectorSessionSchema.methods.updateContent = function(contentData) {
  this.currentContent = {
    ...this.currentContent,
    ...contentData,
    updatedAt: new Date()
  };
  return this.save();
};

// Method to advance slide
projectorSessionSchema.methods.advanceSlide = function() {
  if (this.currentContent.slideIndex !== undefined) {
    this.currentContent.slideIndex += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to go back slide
projectorSessionSchema.methods.goBackSlide = function() {
  if (this.currentContent.slideIndex !== undefined && this.currentContent.slideIndex > 0) {
    this.currentContent.slideIndex -= 1;
    return this.save();
  }
  return Promise.resolve(this);
};

const ProjectorSession = mongoose.model('ProjectorSession', projectorSessionSchema);

export default ProjectorSession;

