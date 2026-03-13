/**
 * Parent Notification Model
 * Persistent storage for parent notifications
 * Parent Monitoring System - Phase 4 Complete
 */

import mongoose from 'mongoose';

const parentNotificationSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  type: {
    type: String,
    enum: ['drill', 'achievement', 'attendance', 'emergency', 'alert', 'system', 'progress'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
parentNotificationSchema.index({ parentId: 1, read: 1, createdAt: -1 });
parentNotificationSchema.index({ parentId: 1, type: 1, read: 1 });
parentNotificationSchema.index({ studentId: 1, createdAt: -1 });

// Static method to get unread count
parentNotificationSchema.statics.getUnreadCount = async function(parentId) {
  return this.countDocuments({ parentId, read: false });
};

// Static method to mark all as read
parentNotificationSchema.statics.markAllAsRead = async function(parentId) {
  return this.updateMany(
    { parentId, read: false },
    { 
      $set: { 
        read: true, 
        readAt: new Date() 
      } 
    }
  );
};

// Instance method to mark as read
parentNotificationSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

const ParentNotification = mongoose.model('ParentNotification', parentNotificationSchema);

export default ParentNotification;

