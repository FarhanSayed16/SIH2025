/**
 * Phase 3.4.3: Message Template Model
 * Stores reusable message templates for notifications
 */

import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    default: null // null for global templates
  },
  category: {
    type: String,
    enum: ['emergency', 'drill', 'announcement', 'parent', 'general'],
    required: true,
    index: true
  },
  channels: [{
    type: String,
    enum: ['sms', 'email', 'push'],
    required: true
  }],
  // Template content for different channels
  content: {
    sms: {
      body: {
        type: String,
        trim: true
      }
    },
    email: {
      subject: {
        type: String,
        trim: true
      },
      body: {
        type: String,
        trim: true
      },
      htmlBody: {
        type: String,
        trim: true
      }
    },
    push: {
      title: {
        type: String,
        trim: true
      },
      body: {
        type: String,
        trim: true
      }
    }
  },
  // Template variables (for dynamic content)
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    defaultValue: {
      type: String
    }
  }],
  // Template metadata
  isActive: {
    type: Boolean,
    default: true
  },
  isGlobal: {
    type: Boolean,
    default: false // false = institution-specific
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
messageTemplateSchema.index({ institutionId: 1, category: 1 });
messageTemplateSchema.index({ isGlobal: 1, category: 1 });
messageTemplateSchema.index({ isActive: 1 });

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

export default MessageTemplate;

