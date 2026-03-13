/**
 * Phase 3.2: Game Score Model
 * Stores scores for all games (Bag Packer, Hazard Hunter, Earthquake Shake)
 */

import mongoose from 'mongoose';

const gameScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  gameType: {
    type: String,
    enum: [
      'bag-packer', 
      'hazard-hunter', 
      'earthquake-shake', 
      'manual-xp-assignment',
      'school-runner',
      'flood-escape',
      'punjab-safety',
      'school-safety-quiz',
      'fire-extinguisher-ar',
      'web-game'
    ],
    required: [true, 'Game type is required']
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  maxScore: {
    type: Number,
    default: 0,
    min: 0
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  // Phase 3.2.4: Group Mode support
  isGroupMode: {
    type: Boolean,
    default: false
  },
  groupActivityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupActivity',
    default: null
  },
  // Game-specific data
  gameData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // For Bag Packer: items selected
  // For Hazard Hunter: hazards found
  // For Earthquake Shake: sequence accuracy
  itemsCorrect: {
    type: Number,
    default: 0
  },
  itemsIncorrect: {
    type: Number,
    default: 0
  },
  timeTaken: {
    type: Number, // in seconds
    default: null
  },
  completedAt: {
    type: Date,
    default: Date.now
  },
  // Offline sync tracking
      synced: {
        type: Boolean,
        default: true // Default to true for online scores
      },
      syncedAt: {
        type: Date,
        default: null
      },
      syncAttempts: {
        type: Number,
        default: 0
      },
      lastSyncAttempt: {
        type: Date,
        default: null
      },
  // XP earned
  xpEarned: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
gameScoreSchema.index({ userId: 1, gameType: 1, completedAt: -1 });
gameScoreSchema.index({ institutionId: 1, gameType: 1, completedAt: -1 });
gameScoreSchema.index({ groupActivityId: 1 });
gameScoreSchema.index({ synced: 1, completedAt: -1 }); // For offline sync

// Method to calculate XP
gameScoreSchema.methods.calculateXP = function() {
  // Base XP = score / 10
  // Bonus for difficulty: easy (1x), medium (1.5x), hard (2x)
  // Bonus for perfect score: +50 XP
  const baseXP = Math.floor(this.score / 10);
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2
  };
  
  const multiplier = difficultyMultiplier[this.difficulty] || 1;
  let xp = Math.floor(baseXP * multiplier);
  
  // Perfect score bonus
  if (this.maxScore > 0 && this.score >= this.maxScore) {
    xp += 50;
  }
  
  // Time bonus (if completed quickly)
  if (this.timeTaken && this.timeTaken < 60) {
    xp += 10;
  }
  
  this.xpEarned = xp;
  return xp;
};

const GameScore = mongoose.model('GameScore', gameScoreSchema);

export default GameScore;

