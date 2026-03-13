/**
 * Student Activity Log Model
 * Tracks all student activities for real-time synchronization with parents and teachers
 */

import mongoose from 'mongoose';

const studentActivityLogSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student ID is required'],
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    index: true
  },
  activityType: {
    type: String,
    enum: [
      'module_complete',
      'quiz_attempt',
      'quiz_complete',
      'game_play',
      'game_complete',
      'login',
      'logout',
      'progress_update',
      'safety_status_change',
      'badge_earned',
      'xp_milestone',
      'location_update',
      'drill_participation',
      'drill_complete'
    ],
    required: [true, 'Activity type is required'],
    index: true
  },
  activityData: {
    // Module-related
    moduleId: String,
    moduleName: String,
    moduleCategory: String,
    
    // Quiz-related
    quizId: String,
    quizName: String,
    quizScore: Number,
    quizTotalQuestions: Number,
    quizCorrectAnswers: Number,
    
    // Game-related
    gameId: String,
    gameName: String,
    gameScore: Number,
    gameLevel: Number,
    
    // Progress-related
    xpEarned: Number,
    totalXP: Number,
    preparednessScore: Number,
    previousPreparednessScore: Number,
    
    // Badge-related
    badgeId: String,
    badgeName: String,
    badgeCategory: String,
    
    // Safety-related
    safetyStatus: String,
    previousSafetyStatus: String,
    location: {
      lat: Number,
      lng: Number,
      address: String
    },
    
    // Drill-related
    drillId: String,
    drillType: String,
    drillStatus: String,
    responseTime: Number,
    
    // Device-related
    deviceType: String,
    deviceId: String,
    ipAddress: String,
    
    // Additional metadata
    metadata: mongoose.Schema.Types.Mixed
  },
  notifiedParents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notifiedTeachers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  notificationStatus: {
    fcmSent: {
      type: Boolean,
      default: false
    },
    socketSent: {
      type: Boolean,
      default: false
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    notificationCount: {
      type: Number,
      default: 0
    }
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
    index: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
// Note: createdAt is included in compound indexes, so we don't need a separate index
studentActivityLogSchema.index({ studentId: 1, createdAt: -1 });
studentActivityLogSchema.index({ classId: 1, createdAt: -1 });
studentActivityLogSchema.index({ activityType: 1, createdAt: -1 });
studentActivityLogSchema.index({ priority: 1, createdAt: -1 });

// Compound index for activity timeline queries
studentActivityLogSchema.index({ studentId: 1, activityType: 1, createdAt: -1 });

// TTL index to auto-delete logs older than 90 days (uses createdAt)
// Note: This replaces the separate createdAt index above
studentActivityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Virtual to populate student details
studentActivityLogSchema.virtual('student', {
  ref: 'User',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});

// Virtual to populate class details
studentActivityLogSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: '_id',
  justOne: true
});

// Method to mark notification as sent
studentActivityLogSchema.methods.markNotificationSent = async function(channel, userIds = []) {
  if (channel === 'fcm') {
    this.notificationStatus.fcmSent = true;
    if (userIds.length > 0) {
      this.notifiedParents.push(...userIds.filter(id => !this.notifiedParents.includes(id)));
    }
  } else if (channel === 'socket') {
    this.notificationStatus.socketSent = true;
  } else if (channel === 'email') {
    this.notificationStatus.emailSent = true;
  }
  
  this.notificationStatus.notificationCount += userIds.length;
  await this.save();
  return this;
};

// Static method to get activity timeline for a student
studentActivityLogSchema.statics.getStudentTimeline = function(studentId, options = {}) {
  const {
    startDate,
    endDate,
    activityType,
    limit = 50,
    page = 1
  } = options;
  
  const query = { studentId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (activityType) {
    query.activityType = activityType;
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit)
    .populate('student', 'name email grade section')
    .populate('class', 'grade section classCode');
};

// Static method to get class activity summary
studentActivityLogSchema.statics.getClassActivitySummary = function(classId, options = {}) {
  const {
    startDate,
    endDate,
    activityType
  } = options;
  
  const query = { classId };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  if (activityType) {
    query.activityType = activityType;
  }
  
  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          activityType: '$activityType',
          studentId: '$studentId'
        },
        count: { $sum: 1 },
        lastActivity: { $max: '$createdAt' }
      }
    },
    {
      $group: {
        _id: '$_id.activityType',
        totalCount: { $sum: '$count' },
        uniqueStudents: { $addToSet: '$_id.studentId' },
        lastActivity: { $max: '$lastActivity' }
      }
    },
    {
      $project: {
        activityType: '$_id',
        totalCount: 1,
        uniqueStudentsCount: { $size: '$uniqueStudents' },
        lastActivity: 1
      }
    },
    { $sort: { totalCount: -1 } }
  ]);
};

// Static method to get recent activities for notification
studentActivityLogSchema.statics.getRecentActivitiesForNotification = function(limit = 10) {
  return this.find({
    priority: { $in: ['high', 'critical'] },
    'notificationStatus.fcmSent': false
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('student', 'name email')
    .populate('class', 'grade section');
};

const StudentActivityLog = mongoose.model('StudentActivityLog', studentActivityLogSchema);

export default StudentActivityLog;

