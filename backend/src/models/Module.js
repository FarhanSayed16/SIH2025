import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Phase 3.1.1: Enhanced categorization
  type: {
    type: String,
    enum: ['earthquake', 'flood', 'fire', 'cyclone', 'stampede', 'heatwave', 'general'],
    required: [true, 'Module type is required']
  },
  category: {
    type: String,
    enum: ['safety', 'preparedness', 'response', 'recovery', 'prevention'],
    default: 'safety'
  },
  region: {
    type: String,
    trim: true // For localized content (e.g., 'Himalayan', 'Coastal')
  },
  // Phase 3.1.1: Enhanced content structure with lessons/sections
  content: {
    // Structured lessons/sections
    lessons: [{
      title: {
        type: String,
        required: true
      },
      order: {
        type: Number,
        default: 0
      },
      sections: [{
        type: {
          type: String,
          enum: ['text', 'image', 'video', 'audio', 'animation', 'interactive'],
          required: true
        },
        order: {
          type: Number,
          default: 0
        },
        content: mongoose.Schema.Types.Mixed, // Flexible content based on type
        metadata: {
          duration: Number, // for video/audio
          caption: String, // for images
          url: String, // for media
          lottieUrl: String // for animations
        }
      }]
    }],
    // Legacy support - keep existing structure
    videos: [{
      url: String,
      title: String,
      duration: Number // in seconds
    }],
    images: [{
      url: String,
      caption: String
    }],
    text: {
      type: String
    },
    arScenarios: [{
      name: String,
      description: String,
      arData: mongoose.Schema.Types.Mixed // AR-specific data
    }]
  },
  quiz: {
    questions: [{
      question: {
        type: String,
        required: true
      },
      questionType: {
        type: String,
        enum: ['text', 'image', 'audio', 'image-to-image'],
        default: 'text'
      },
      // For image-based questions
      questionImage: String,
      // For audio questions
      questionAudio: String,
      options: [{
        type: String,
        required: true
      }],
      // For image-based options
      optionImages: [String],
      correctAnswer: {
        type: Number,
        required: true,
        min: 0
      },
      points: {
        type: Number,
        default: 10,
        min: 0
      },
      explanation: String,
      explanationImage: String // For visual explanations
    }],
    passingScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    timeLimit: {
      type: Number, // in seconds
      default: null
    }
  },
  badges: [{
    type: String
  }],
  points: {
    type: Number,
    default: 100,
    min: 0
  },
  estimatedTime: {
    type: Number, // in minutes
    default: 15
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // Phase 3.1.1: Age/Difficulty curve support
  gradeLevel: {
    type: [String],
    enum: ['KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'all'],
    default: ['all']
  },
  // Phase 3.1.1: Content versioning
  version: {
    type: String,
    default: '1.0.0'
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  // Phase 3.1.1: Metadata for search and filtering
  tags: [{
    type: String,
    trim: true
  }],
  language: {
    type: String,
    default: 'en'
  },
  // Phase 3.1.1: Content statistics
  stats: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalCompletions: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Phase 3.1.1: Enhanced indexes for search and filtering
moduleSchema.index({ type: 1, region: 1 });
moduleSchema.index({ isActive: 1, order: 1 });
moduleSchema.index({ category: 1, type: 1 });
moduleSchema.index({ gradeLevel: 1, difficulty: 1 });
moduleSchema.index({ tags: 1 });
moduleSchema.index({ version: 1 });
moduleSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search

// Phase 3.1.1: Methods
moduleSchema.methods.incrementViews = async function() {
  this.stats.totalViews += 1;
  await this.save();
};

moduleSchema.methods.updateCompletionStats = async function(score) {
  this.stats.totalCompletions += 1;
  const currentAvg = this.stats.averageScore || 0;
  const totalCompletions = this.stats.totalCompletions;
  this.stats.averageScore = Math.round(
    ((currentAvg * (totalCompletions - 1)) + score) / totalCompletions
  );
  await this.save();
};

const Module = mongoose.model('Module', moduleSchema);

export default Module;

