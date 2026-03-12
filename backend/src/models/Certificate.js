import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  certificateType: {
    type: String,
    enum: ['module_completion', 'score_milestone', 'badge_achievement', 'all_modules_completed'],
    required: true
  },
  achievement: {
    type: String,
    required: true // e.g., "Completed all fire safety modules"
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
    // Can store: moduleId, score, badgeId, etc.
  },
  pdfUrl: {
    type: String, // Path to stored PDF file
    default: null
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  sharedAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
certificateSchema.index({ userId: 1, issuedAt: -1 });
certificateSchema.index({ userId: 1, certificateType: 1 });
certificateSchema.index({ certificateType: 1 });

// Prevent duplicate certificates (same user, same type, same achievement)
certificateSchema.index({ userId: 1, certificateType: 1, achievement: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

export default Certificate;

