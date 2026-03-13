/**
 * Phase 3.2: Game Item Model
 * Stores items for Bag Packer game (correct and incorrect items)
 */

import mongoose from 'mongoose';

const gameItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['emergency', 'distraction', 'food', 'tool', 'electronics', 'other'],
    required: true
  },
  gameType: {
    type: String,
    enum: ['bag-packer', 'hazard-hunter', 'earthquake-shake', 'all'],
    default: 'bag-packer'
  },
  isCorrect: {
    type: Boolean,
    required: true,
    default: false
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  points: {
    type: Number,
    default: 10
    // Allow negative points for incorrect items (penalties)
  },
  // For incorrect items: funny feedback message
  feedbackMessage: {
    type: String,
    default: null
  },
  // Emergency category details
  emergencyType: {
    type: String,
    enum: ['fire', 'earthquake', 'flood', 'cyclone', 'general', null],
    default: null
  },
  // Grade level appropriateness
  gradeLevel: {
    type: [String],
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'all'],
    default: ['all']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
gameItemSchema.index({ gameType: 1, isCorrect: 1, isActive: 1 });
gameItemSchema.index({ category: 1, gameType: 1 });

const GameItem = mongoose.model('GameItem', gameItemSchema);

export default GameItem;

