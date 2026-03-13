import mongoose from 'mongoose';

const groupActivitySchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: ['game', 'quiz', 'drill', 'module'],
    required: [true, 'Activity type is required']
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: [true, 'Class ID is required']
  },
  deviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Device',
    default: null
  },
  participants: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    score: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  startedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Started by (teacher) is required']
  },
  results: {
    totalParticipants: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    }
  },
  metadata: {
    activityId: String, // ID of the game/quiz/module
    activityName: String,
    duration: Number, // in seconds
  }
}, {
  timestamps: true
});

// Indexes
groupActivitySchema.index({ classId: 1, status: 1 });
groupActivitySchema.index({ deviceId: 1 });
groupActivitySchema.index({ startedBy: 1 });
groupActivitySchema.index({ 'participants.studentId': 1 });

// Method to add participant
groupActivitySchema.methods.addParticipant = function(studentId) {
  const existing = this.participants.find(
    p => p.studentId.toString() === studentId.toString()
  );
  
  if (!existing) {
    this.participants.push({
      studentId,
      joinedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update participant score
groupActivitySchema.methods.updateParticipantScore = function(studentId, score, completed = false) {
  const participant = this.participants.find(
    p => p.studentId.toString() === studentId.toString()
  );
  
  if (participant) {
    participant.score = score;
    participant.completed = completed;
    return this.save();
  }
  throw new Error('Participant not found');
};

// Method to calculate results
groupActivitySchema.methods.calculateResults = function() {
  const total = this.participants.length;
  if (total === 0) {
    this.results = {
      totalParticipants: 0,
      averageScore: 0,
      completionRate: 0
    };
    return this.save();
  }

  const completed = this.participants.filter(p => p.completed).length;
  const totalScore = this.participants.reduce((sum, p) => sum + (p.score || 0), 0);

  this.results = {
    totalParticipants: total,
    averageScore: Math.round(totalScore / total),
    completionRate: Math.round((completed / total) * 100)
  };

  return this.save();
};

const GroupActivity = mongoose.model('GroupActivity', groupActivitySchema);

export default GroupActivity;

