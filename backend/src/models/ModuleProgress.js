/**
 * Module Progress Model
 * Tracks user progress for all module types: NDMA Interactive, NDRF, Hearing Impaired
 */

import mongoose from 'mongoose';

const moduleProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  moduleId: {
    type: String,
    required: [true, 'Module ID is required'],
    index: true
  },
  moduleType: {
    type: String,
    enum: ['ndma', 'ndrf', 'hearing_impaired'],
    required: [true, 'Module type is required'],
    index: true
  },
  language: {
    type: String,
    default: null, // For NDRF modules (e.g., 'Hindi', 'English', 'Marathi')
    index: true
  },
  completedVideos: [{
    type: String, // Video ID or title
    default: []
  }],
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  xpEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  completedAt: {
    type: Date,
    default: null
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
// FIXED: Include language in unique index to allow multiple NDRF modules per user (one per language)
// Use partial index: only enforce uniqueness when language is not null (for NDRF modules)
moduleProgressSchema.index(
  { userId: 1, moduleId: 1, moduleType: 1, language: 1 },
  { 
    unique: true,
    partialFilterExpression: { language: { $ne: null } } // Only enforce uniqueness for modules with language
  }
);
// For modules without language (NDMA), use separate unique index
moduleProgressSchema.index(
  { userId: 1, moduleId: 1, moduleType: 1 },
  { 
    unique: true,
    partialFilterExpression: { language: null } // Only enforce uniqueness for modules without language
  }
);
moduleProgressSchema.index({ userId: 1, moduleType: 1, isCompleted: 1 });
moduleProgressSchema.index({ userId: 1, completedAt: -1 });
moduleProgressSchema.index({ userId: 1, language: 1, moduleType: 1 });

// Method to mark video as completed
moduleProgressSchema.methods.markVideoCompleted = function(videoId) {
  if (!this.completedVideos.includes(videoId)) {
    this.completedVideos.push(videoId);
    this.lastUpdated = new Date();
  }
  return this;
};

// Method to calculate progress percentage
moduleProgressSchema.methods.calculateProgress = function(totalVideos) {
  if (totalVideos === 0) return 0;
  return Math.round((this.completedVideos.length / totalVideos) * 100);
};

// Static method to get user's progress for a module
moduleProgressSchema.statics.getUserProgress = async function(userId, moduleId, moduleType, language = null) {
  const query = { userId, moduleId, moduleType };
  if (language) query.language = language;
  
  return await this.findOne(query);
};

// Static method to get all completed modules for a user
moduleProgressSchema.statics.getCompletedModules = async function(userId, moduleType = null) {
  const query = { userId, isCompleted: true };
  if (moduleType) query.moduleType = moduleType;
  
  return await this.find(query).sort({ completedAt: -1 });
};

// Static method to get completion statistics
moduleProgressSchema.statics.getCompletionStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$moduleType',
        total: { $sum: 1 },
        completed: {
          $sum: { $cond: ['$isCompleted', 1, 0] }
        },
        totalPoints: { $sum: '$pointsEarned' },
        totalXP: { $sum: '$xpEarned' }
      }
    }
  ]);
  
  return stats;
};

const ModuleProgress = mongoose.model('ModuleProgress', moduleProgressSchema);

export default ModuleProgress;

