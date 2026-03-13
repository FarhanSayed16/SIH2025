import mongoose from 'mongoose';

const drillLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  drillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drill',
    required: [true, 'Drill ID is required']
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  evacuationTime: {
    type: Number, // in seconds
    required: true,
    min: 0
  },
  route: {
    type: String,
    trim: true
  },
  startLocation: {
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
  endLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  synced: {
    type: Boolean,
    default: false // For offline sync tracking
  },
  syncedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Additional data
    default: {}
  }
}, {
  timestamps: true
});

// Indexes
drillLogSchema.index({ userId: 1, drillId: 1 });
drillLogSchema.index({ institutionId: 1, completedAt: -1 });
drillLogSchema.index({ synced: 1, completedAt: -1 }); // For sync queries
drillLogSchema.index({ drillId: 1, completedAt: -1 });

// Static method to get user's average evacuation time
drillLogSchema.statics.getUserAverageTime = async function(userId, institutionId = null) {
  const query = { userId };
  if (institutionId) {
    query.institutionId = institutionId;
  }
  
  const result = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$evacuationTime' },
        totalDrills: { $sum: 1 },
        bestTime: { $min: '$evacuationTime' }
      }
    }
  ]);
  
  return result[0] || { avgTime: 0, totalDrills: 0, bestTime: 0 };
};

// Static method to get institution statistics
drillLogSchema.statics.getInstitutionStats = async function(institutionId, drillId = null) {
  const query = { institutionId };
  if (drillId) {
    query.drillId = drillId;
  }
  
  const stats = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgTime: { $avg: '$evacuationTime' },
        totalParticipants: { $sum: 1 },
        bestTime: { $min: '$evacuationTime' },
        worstTime: { $max: '$evacuationTime' }
      }
    }
  ]);
  
  return stats[0] || {
    avgTime: 0,
    totalParticipants: 0,
    bestTime: 0,
    worstTime: 0
  };
};

const DrillLog = mongoose.model('DrillLog', drillLogSchema);

export default DrillLog;

