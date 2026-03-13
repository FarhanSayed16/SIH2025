import mongoose from 'mongoose';

const drillSchema = new mongoose.Schema({
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  type: {
    type: String,
    enum: ['fire', 'earthquake', 'flood', 'cyclone', 'stampede', 'heatwave'],
    required: [true, 'Drill type is required']
  },
  scheduledAt: {
    type: Date,
    required: [true, 'Scheduled time is required']
  },
  duration: {
    type: Number, // in minutes
    default: 10,
    min: 1,
    max: 120
  },
  actualStart: {
    type: Date,
    default: null
  },
  participantSelection: {
    type: {
      type: String,
      enum: ['all', 'class', 'grade', 'specific'],
      default: 'all'
    },
    classIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class'
    }],
    grades: [{
      type: String,
      enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    }],
    userIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  triggeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  triggeredAt: {
    type: Date,
    default: null
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin']
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    evacuationTime: {
      type: Number, // in seconds
      default: null
    },
    route: {
      type: String,
      default: null
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
      default: null
    },
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date,
      default: null
    },
    responseTime: {
      type: Number, // in seconds (time from drill start to acknowledgment)
      default: null
    }
  }],
  results: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    completedParticipants: {
      type: Number,
      default: 0
    },
    avgEvacuationTime: {
      type: Number, // in seconds
      default: null
    },
    participationRate: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    },
    routeEfficiency: {
      type: Number, // percentage
      default: 0,
      min: 0,
      max: 100
    }
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
drillSchema.index({ institutionId: 1, scheduledAt: -1 });
drillSchema.index({ status: 1, scheduledAt: -1 });
drillSchema.index({ type: 1 });
drillSchema.index({ createdAt: -1 });

// Method to add participant
drillSchema.methods.addParticipant = function(userId, role) {
  const existing = this.participants.find(p => p.userId.toString() === userId.toString());
  if (existing) {
    existing.joinedAt = new Date();
    return this.save();
  }
  
  this.participants.push({
    userId,
    role,
    joinedAt: new Date()
  });
  this.results.totalParticipants = this.participants.length;
  return this.save();
};

// Method to acknowledge drill
drillSchema.methods.acknowledgeDrill = function(userId) {
  // Check if drill is in progress
  if (this.status !== 'in_progress') {
    throw new Error(`Cannot acknowledge drill. Drill status is "${this.status}". Only in-progress drills can be acknowledged.`);
  }

  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (!participant) {
    throw new Error('You are not a participant in this drill. Only selected participants can acknowledge participation.');
  }

  // Check if already acknowledged
  if (participant.acknowledged) {
    throw new Error('You have already acknowledged this drill.');
  }

  participant.acknowledged = true;
  participant.acknowledgedAt = new Date();
  participant.completedAt = new Date();
  
  // Calculate response time (from actualStart to acknowledgment)
  if (this.actualStart && participant.acknowledgedAt) {
    participant.responseTime = Math.round(
      (participant.acknowledgedAt - this.actualStart) / 1000 // Convert to seconds
    );
  }
  
  // Update results
  this.results.completedParticipants = this.participants.filter(p => p.acknowledged).length;
  this.results.participationRate = this.results.totalParticipants > 0
    ? Math.round((this.results.completedParticipants / this.results.totalParticipants) * 100)
    : 0;
  
  return this.save();
};

// Method to complete participant
drillSchema.methods.completeParticipant = function(userId, evacuationTime, route, score) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.completedAt = new Date();
    participant.evacuationTime = evacuationTime;
    participant.route = route;
    participant.score = score || null;
    participant.acknowledged = true;
    
    // Update results
    this.results.completedParticipants = this.participants.filter(p => p.completedAt).length;
    
    // Calculate average evacuation time
    const completed = this.participants.filter(p => p.evacuationTime !== null);
    if (completed.length > 0) {
      this.results.avgEvacuationTime = Math.round(
        completed.reduce((sum, p) => sum + p.evacuationTime, 0) / completed.length
      );
    }
    
    // Calculate participation rate
    this.results.participationRate = Math.round(
      (this.results.completedParticipants / this.results.totalParticipants) * 100
    );
    
    return this.save();
  }
  throw new Error('Participant not found');
};

// Method to finalize drill
drillSchema.methods.finalize = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  
  // Final calculations
  const completed = this.participants.filter(p => p.completedAt);
  this.results.completedParticipants = completed.length;
  
  if (completed.length > 0) {
    const avgTime = completed.reduce((sum, p) => sum + (p.evacuationTime || 0), 0) / completed.length;
    this.results.avgEvacuationTime = Math.round(avgTime);
  }
  
  this.results.participationRate = this.results.totalParticipants > 0
    ? Math.round((this.results.completedParticipants / this.results.totalParticipants) * 100)
    : 0;
  
  return this.save();
};

const Drill = mongoose.model('Drill', drillSchema);

export default Drill;

