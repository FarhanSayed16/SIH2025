import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Module ID is required']
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: [true, 'Institution ID is required']
  },
  answers: [{
    questionIndex: {
      type: Number,
      required: true
    },
    selectedAnswer: {
      type: Number,
      required: true
    },
    isCorrect: {
      type: Boolean,
      required: true
    },
    points: {
      type: Number,
      default: 0
    },
    timeTaken: {
      type: Number, // in seconds
      default: null
    }
  }],
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  passed: {
    type: Boolean,
    required: true
  },
  timeTaken: {
    type: Number, // in seconds
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
  }
}, {
  timestamps: true
});

// Indexes
quizResultSchema.index({ userId: 1, moduleId: 1 });
quizResultSchema.index({ institutionId: 1, completedAt: -1 });
quizResultSchema.index({ synced: 1, completedAt: -1 }); // For sync queries
quizResultSchema.index({ userId: 1, completedAt: -1 });

// Method to calculate score
quizResultSchema.methods.calculateScore = function(module) {
  let totalPoints = 0;
  let maxPoints = 0;
  
  this.answers.forEach((answer, index) => {
    const question = module.quiz.questions[answer.questionIndex];
    if (question) {
      maxPoints += question.points;
      if (answer.isCorrect) {
        totalPoints += question.points;
      }
    }
  });
  
  this.totalPoints = totalPoints;
  this.score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
  this.passed = this.score >= (module.quiz.passingScore || 70);
  
  return this;
};

// Static method to get user's best score for a module
quizResultSchema.statics.getBestScore = async function(userId, moduleId) {
  const result = await this.findOne({
    userId,
    moduleId
  }).sort({ score: -1 });
  
  return result;
};

// Static method to get average score for institution
quizResultSchema.statics.getInstitutionAverage = async function(institutionId, moduleId = null) {
  const query = { institutionId };
  if (moduleId) {
    query.moduleId = moduleId;
  }
  
  const results = await this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        totalAttempts: { $sum: 1 }
      }
    }
  ]);
  
  return results[0] || { avgScore: 0, totalAttempts: 0 };
};

const QuizResult = mongoose.model('QuizResult', quizResultSchema);

export default QuizResult;

