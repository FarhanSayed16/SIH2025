/**
 * Phase 3.2.2: Hazard Model
 * Stores hazards for Hazard Hunter game
 */

import mongoose from 'mongoose';

const hazardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hazard name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['fire', 'electrical', 'structural', 'exit', 'chemical', 'other'],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  // Hazard location in image (for tap detection)
  location: {
    x: { type: Number, required: true }, // Percentage from left (0-100)
    y: { type: Number, required: true }, // Percentage from top (0-100)
    width: { type: Number, default: 10 }, // Percentage width
    height: { type: Number, default: 10 } // Percentage height
  },
  // Level information
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
  points: {
    type: Number,
    default: 10,
    min: 0
  },
  // Wrong tap penalty
  penaltyPoints: {
    type: Number,
    default: 5,
    min: 0
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
  }
}, {
  timestamps: true
});

// Indexes
hazardSchema.index({ level: 1, difficulty: 1, isActive: 1 });
hazardSchema.index({ type: 1 });

const Hazard = mongoose.model('Hazard', hazardSchema);

export default Hazard;

