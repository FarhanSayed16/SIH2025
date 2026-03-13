import mongoose from 'mongoose';

const hazardReportSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null
  },
  type: {
    type: String,
    enum: ['fire', 'structural', 'electrical', 'other'],
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  location: {
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
  aiConfidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: {
    type: String,
    trim: true
  },
  recommendations: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'false_positive'],
    default: 'pending'
  },
  aiAnalysis: {
    type: mongoose.Schema.Types.Mixed, // Store full AI response
    default: {}
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
hazardReportSchema.index({ institutionId: 1, status: 1, createdAt: -1 });
hazardReportSchema.index({ location: '2dsphere' });
hazardReportSchema.index({ type: 1, severity: 1 });
hazardReportSchema.index({ reportedBy: 1, createdAt: -1 });

const HazardReport = mongoose.model('HazardReport', hazardReportSchema);

export default HazardReport;

