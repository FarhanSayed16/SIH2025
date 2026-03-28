/**
 * Phase 3.4.3: Unified Communication Service
 * Manages multi-channel notifications (SMS, Email, Push)
 */

import { sendSMS, sendBulkSMS, checkSMSStatus } from './sms.service.js';
import { sendEmail, sendBulkEmail, sendHTMLEmail } from './email.service.js';
import {
  sendNotificationToUser,
  sendNotificationToMultipleUsers,
  sendNotificationToSchool
} from './fcm.service.js';
import CommunicationLog from '../models/CommunicationLog.js';
import MessageTemplate from '../models/MessageTemplate.js';
import logger from '../config/logger.js';

/**
 * Generate unique message ID
 */
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Process template variables
 * @param {string} content - Template content
 * @param {Object} variables - Variable values
 * @returns {string} Processed content
 */
const processTemplate = (content, variables = {}) => {
  let processed = content;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    processed = processed.replace(regex, variables[key] || '');
  });
  return processed;
};

/**
 * Send notification via specified channel
 * @param {Object} options - Notification options
 * @returns {Promise<Object>} Send result
 */
export const sendNotification = async (options) => {
  const {
    institutionId,
    channel, // 'sms', 'email', 'push'
    recipient, // { userId, email, phone, fcmToken, name }
    subject,
    title,
    body,
    templateId,
    templateVariables = {},
    alertId,
    drillId,
    broadcastId,
    metadata = {}
  } = options;

  const messageId = generateMessageId();
  let logEntry = null;
  let result = null;

  try {
    // Create log entry
    logEntry = await CommunicationLog.create({
      institutionId,
      messageId,
      type: channel,
      channel,
      recipient,
      subject,
      title,
      body,
      templateId,
      status: 'pending',
      alertId,
      drillId,
      broadcastId,
      metadata
    });

    // Send via appropriate channel
    switch (channel) {
      case 'sms':
        if (!recipient.phone) {
          const reason = 'Phone number required for SMS';
          if (logEntry) {
            logEntry.status = 'skipped';
            logEntry.failureReason = reason;
            logEntry.failedAt = new Date();
            await logEntry.save();
          }
          return { success: false, skipped: true, reason };
        }
        result = await sendSMS(recipient.phone, body);
        break;

      case 'email':
        if (!recipient.email) {
          const reason = 'Email address required for email';
          if (logEntry) {
            logEntry.status = 'skipped';
            logEntry.failureReason = reason;
            logEntry.failedAt = new Date();
            await logEntry.save();
          }
          return { success: false, skipped: true, reason };
        }
        result = await sendEmail(recipient.email, subject || title, body);
        break;

      case 'push':
        if (!recipient.fcmToken && !recipient.userId) {
          const reason = 'FCM token or userId required for push notification';
          if (logEntry) {
            logEntry.status = 'skipped';
            logEntry.failureReason = reason;
            logEntry.failedAt = new Date();
            await logEntry.save();
          }
          return { success: false, skipped: true, reason };
        }
        result = await sendNotificationToUser(
          recipient.fcmToken,
          { title, body },
          { type: 'notification', ...metadata }
        );
        break;

      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }

    // Update log entry
    if (logEntry) {
      if (result.skipped) {
        logEntry.status = 'skipped';
        logEntry.failureReason = result.reason || 'Skipped';
        logEntry.failedAt = new Date();
      } else {
        logEntry.status = result.success ? 'sent' : 'failed';
      }
      logEntry.providerId = result.providerId || null;
      logEntry.providerResponse = result.response || result;
      logEntry.sentAt = result.success ? new Date() : null;
      logEntry.failedAt = result.success || result.skipped ? null : new Date();
      logEntry.failureReason = result.success || result.skipped ? null : (result.error || 'Unknown error');
      await logEntry.save();
    }

    return {
      success: result.success,
      messageId,
      logId: logEntry?._id,
      ...result
    };
  } catch (error) {
    logger.error('Send notification error:', error);
    
    // Update log entry on error
    if (logEntry) {
      logEntry.status = 'failed';
      logEntry.failedAt = new Date();
      logEntry.failureReason = error.message;
      await logEntry.save();
    }

    return {
      success: false,
      messageId,
      error: error.message
    };
  }
};

/**
 * Send notification using template
 * @param {Object} options - Template notification options
 * @returns {Promise<Object>} Send result
 */
export const sendNotificationWithTemplate = async (options) => {
  const {
    templateId,
    templateName,
    institutionId,
    channel,
    recipient,
    variables = {},
    alertId,
    drillId,
    broadcastId,
    metadata = {}
  } = options;

  try {
    // Find template
    const template = templateId
      ? await MessageTemplate.findById(templateId)
      : await MessageTemplate.findOne({
          name: templateName,
          $or: [
            { institutionId },
            { isGlobal: true }
          ],
          isActive: true
        });

    if (!template) {
      throw new Error('Template not found');
    }

    // Get template content for channel
    const channelContent = template.content[channel];
    if (!channelContent) {
      throw new Error(`Template does not support channel: ${channel}`);
    }

    // Process template with variables
    let subject = null;
    let title = null;
    let body = null;

    if (channel === 'email') {
      subject = processTemplate(channelContent.subject || '', variables);
      body = processTemplate(channelContent.body || channelContent.htmlBody || '', variables);
    } else if (channel === 'sms') {
      body = processTemplate(channelContent.body || '', variables);
    } else if (channel === 'push') {
      title = processTemplate(channelContent.title || '', variables);
      body = processTemplate(channelContent.body || '', variables);
    }

    // Send notification
    return await sendNotification({
      institutionId,
      channel,
      recipient,
      subject,
      title,
      body,
      templateId: template._id,
      templateVariables: variables,
      alertId,
      drillId,
      broadcastId,
      metadata
    });
  } catch (error) {
    logger.error('Send notification with template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send multi-channel notification (all channels at once)
 * @param {Object} options - Multi-channel options
 * @returns {Promise<Object>} Send results
 */
export const sendMultiChannelNotification = async (options) => {
  const {
    channels = ['push'], // Default to push only
    ...restOptions
  } = options;

  const results = await Promise.allSettled(
    channels.map(channel => sendNotification({
      ...restOptions,
      channel
    }))
  );

  const successful = results.filter(r => 
    r.status === 'fulfilled' && r.value.success
  ).length;

  return {
    success: successful > 0,
    channels: channels.length,
    successful,
    failed: channels.length - successful,
    results: results.map(r => 
      r.status === 'fulfilled' ? r.value : { success: false, error: r.reason }
    )
  };
};

/**
 * Update delivery status for a message
 * @param {string} messageId - Message ID
 * @param {string} status - New status
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Update result
 */
export const updateDeliveryStatus = async (messageId, status, metadata = {}) => {
  try {
    const logEntry = await CommunicationLog.findOne({ messageId });
    if (!logEntry) {
      throw new Error('Message log not found');
    }

    logEntry.status = status;
    if (status === 'delivered') {
      logEntry.deliveredAt = new Date();
    } else if (status === 'failed' || status === 'bounced') {
      logEntry.failedAt = new Date();
      logEntry.failureReason = metadata.reason || metadata.error || null;
    }
    Object.assign(logEntry.metadata, metadata);
    await logEntry.save();

    return {
      success: true,
      messageId,
      status
    };
  } catch (error) {
    logger.error('Update delivery status error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get delivery statistics
 * @param {string} institutionId - Institution ID
 * @param {Object} filters - Date range and filters
 * @returns {Promise<Object>} Statistics
 */
export const getDeliveryStatistics = async (institutionId, filters = {}) => {
  try {
    const stats = await CommunicationLog.getDeliveryStats(
      institutionId,
      filters.startDate,
      filters.endDate
    );

    // Process stats into organized format
    const organized = {
      byChannel: {},
      byStatus: {},
      total: 0
    };

    stats.forEach(stat => {
      const { channel, status, count } = stat._id;
      organized.total += count;

      if (!organized.byChannel[channel]) {
        organized.byChannel[channel] = { total: 0, byStatus: {} };
      }
      organized.byChannel[channel].total += count;
      organized.byChannel[channel].byStatus[status] = count;

      if (!organized.byStatus[status]) {
        organized.byStatus[status] = 0;
      }
      organized.byStatus[status] += count;
    });

    return {
      success: true,
      stats: organized
    };
  } catch (error) {
    logger.error('Get delivery statistics error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendNotification,
  sendNotificationWithTemplate,
  sendMultiChannelNotification,
  updateDeliveryStatus,
  getDeliveryStatistics
};

