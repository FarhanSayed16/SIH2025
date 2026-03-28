/**
 * Phase 3.4.3: Broadcast Service
 * Handles sending messages to multiple recipients
 */

import BroadcastMessage from '../models/BroadcastMessage.js';
import AlertLog from '../models/AlertLog.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import School from '../models/School.js';
import {
  sendNotification,
  sendNotificationWithTemplate,
  sendMultiChannelNotification
} from './communication.service.js';
import logger from '../config/logger.js';

// Map broadcast priority to incident severity
const mapPriorityToSeverity = (priority = 'medium') => {
  switch (priority) {
    case 'low':
      return 'low';
    case 'high':
      return 'high';
    case 'urgent':
      return 'critical';
    default:
      return 'medium';
  }
};

// Map broadcast type to incident type (fallback to other)
const mapBroadcastTypeToIncidentType = (type = 'general') => {
  switch (type) {
    case 'fire':
    case 'earthquake':
    case 'flood':
    case 'cyclone':
    case 'stampede':
    case 'medical':
      return type;
    case 'emergency':
      return 'other';
    default:
      return 'other';
  }
};

/**
 * Create an incident log entry for a broadcast so it shows in incident history
 */
const createIncidentLogForBroadcast = async (broadcast, stats = {}) => {
  try {
    // Avoid duplicate logs
    if (broadcast?.metadata?.incidentLogId) {
      return broadcast.metadata.incidentLogId;
    }

    const severity = mapPriorityToSeverity(broadcast.priority);
    const type = mapBroadcastTypeToIncidentType(broadcast.type);

    const incident = await AlertLog.create({
      alertId: null,
      source: 'broadcast',
      severity,
      type,
      institutionId: broadcast.institutionId,
      affectedUsers: [],
      metadata: {
        broadcastId: broadcast._id,
        title: broadcast.title || broadcast.subject || 'Broadcast Message',
        message: broadcast.message,
        channels: broadcast.channels,
        recipients: broadcast.recipients,
        priority: broadcast.priority,
        stats,
        broadcastStatus: broadcast.status
      },
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: broadcast.createdBy,
      actions: [
        {
          userId: broadcast.createdBy,
          action: 'created',
          timestamp: new Date(),
          details: { source: 'broadcast' }
        },
        {
          userId: broadcast.createdBy,
          action: 'resolved',
          timestamp: new Date(),
          details: { autoResolved: true, source: 'broadcast' }
        }
      ]
    });

    // Persist back the linkage so we don't duplicate later
    broadcast.metadata = {
      ...(broadcast.metadata || {}),
      incidentLogId: incident._id
    };
    await broadcast.save();

    logger.info(`Incident log created for broadcast ${broadcast._id}: ${incident._id}`);
    return incident._id;
  } catch (error) {
    logger.error('Create incident log for broadcast error:', error);
    return null;
  }
};

/**
 * Get recipients based on broadcast configuration
 * @param {Object} broadcastConfig - Broadcast recipient configuration
 * @param {string} institutionId - Institution ID
 * @returns {Promise<Object[]>} Array of recipient objects
 */
const getRecipients = async (broadcastConfig, institutionId, senderRole) => {
  const { type, userIds = [], classIds = [] } = broadcastConfig;
  const recipients = [];

  try {
    switch (type) {
      case 'all':
        // Admin: entire school population by institutionId
        // Others: default to entire institution as well (no class restriction here)
        const allUsers = await User.find({
          institutionId,
          isActive: true
        }).select('name email phone deviceToken role');
        
        allUsers.forEach(user => {
          recipients.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            fcmToken: user.deviceToken,
            role: user.role
          });
        });
        break;

      case 'students':
        const students = await User.find({
          institutionId,
          role: 'student',
          isActive: true
        }).select('name email phone deviceToken');
        
        students.forEach(user => {
          recipients.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            fcmToken: user.deviceToken
          });
        });
        break;

      case 'teachers':
        const teachers = await User.find({
          institutionId,
          role: 'teacher',
          isActive: true
        }).select('name email phone deviceToken');
        
        teachers.forEach(user => {
          recipients.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            fcmToken: user.deviceToken
          });
        });
        break;

      case 'parents':
        const parents = await User.find({
          institutionId,
          role: 'parent',
          isActive: true
        }).select('name email phone deviceToken');
        
        parents.forEach(user => {
          recipients.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            fcmToken: user.deviceToken
          });
        });
        break;

      case 'admins': {
        // Include both admin and system-admin roles for the institution
        const admins = await User.find({
          institutionId,
          role: { $in: ['admin', 'ADMIN', 'system_admin', 'SYSTEM_ADMIN'] },
          isActive: true
        }).select('name email phone deviceToken role');
        
        admins.forEach(user => {
          recipients.push({
            userId: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            fcmToken: user.deviceToken,
            role: user.role
          });
        });
        break;
      }

      case 'custom':
        // Custom user IDs
        if (userIds.length > 0) {
          const customUsers = await User.find({
            _id: { $in: userIds },
            institutionId,
            isActive: true
          }).select('name email phone deviceToken');
          
          customUsers.forEach(user => {
            recipients.push({
              userId: user._id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              fcmToken: user.deviceToken
            });
          });
        }

        // Users from specific classes
        if (classIds.length > 0) {
          const classes = await Class.find({
            _id: { $in: classIds },
            institutionId
          }).populate('studentIds', 'name email phone deviceToken');

          classes.forEach(classData => {
            if (classData.studentIds) {
              classData.studentIds.forEach(student => {
                recipients.push({
                  userId: student._id,
                  name: student.name,
                  email: student.email,
                  phone: student.phone,
                  fcmToken: student.deviceToken,
                  classId: classData._id
                });
              });
            }
          });
        }
        break;

      default:
        throw new Error(`Invalid recipient type: ${type}`);
    }

    // Remove duplicates by userId
    const uniqueRecipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.userId?.toString() === recipient.userId?.toString())
    );

    return uniqueRecipients;
  } catch (error) {
    logger.error('Get recipients error:', error);
    throw error;
  }
};

/**
 * Send broadcast message
 * @param {Object} options - Broadcast options
 * @returns {Promise<Object>} Broadcast result
 */
export const sendBroadcast = async (options) => {
  const {
    institutionId,
    createdBy,
    senderRole,
    type,
    priority = 'medium',
    recipients: recipientConfig,
    channels = ['push', 'email'], // include email by default to ensure delivery without tokens
    subject,
    title,
    message,
    templateId,
    templateVariables = {},
    alertId,
    drillId,
    metadata = {}
  } = options;

  try {
    // Normalize institutionId (could be populated object or ObjectId/string)
    const normalizedInstitutionId =
      (institutionId && institutionId._id) ? institutionId._id : institutionId;

    // Normalize channels; for admin-only broadcasts, force push-only to keep it fast/reliable
    const recipientType = recipientConfig?.type;
    const effectiveChannels =
      recipientType === 'admins' ? ['push'] : Array.from(new Set(channels));

    // Get recipients
    const recipients = await getRecipients(recipientConfig, normalizedInstitutionId, senderRole);

    if (recipients.length === 0) {
      return {
        success: false,
        error: 'No recipients found'
      };
    }

    // Quick check: if push channel selected but nobody has a token, fail fast to avoid long retries
    const wantsPush = effectiveChannels.includes('push');
    const pushCapable = recipients.filter(r => r.fcmToken).length;
    if (wantsPush && pushCapable === 0) {
      logger.warn(`Broadcast aborted: push selected but no recipients have FCM tokens (recipientType=${recipientConfig?.type})`);
      return {
        success: false,
        error: 'No FCM tokens found for selected recipients'
      };
    }

    // Create broadcast message record
    const broadcast = await BroadcastMessage.create({
      institutionId: normalizedInstitutionId,
      createdBy,
      type,
      priority,
      recipients: recipientConfig,
      channels,
      subject,
      title,
      message,
      templateId,
      status: 'sending',
      stats: {
        totalRecipients: recipients.length,
        pending: recipients.length
      },
      alertId,
      drillId,
      metadata
    });

    let skippedNoToken = 0;
    let skippedNoChannel = 0;

    // Build send tasks with per-recipient channel filtering and fallback
    const tasks = recipients.flatMap(recipient => {
      const recipientChannels = new Set(effectiveChannels);

      // If push selected but no token, skip push and optionally fallback to email
        if (recipientChannels.has('push') && !recipient.fcmToken) {
          skippedNoToken += 1;
          // Do not fallback to email automatically; keep behavior explicit
          recipientChannels.delete('push');
        }

      // If no channels left, skip
      if (recipientChannels.size === 0) {
        skippedNoChannel += 1;
        return [];
      }

      return Array.from(recipientChannels).map(channel =>
        templateId
          ? sendNotificationWithTemplate({
              institutionId,
              channel,
              recipient,
              templateId,
              templateVariables,
              broadcastId: broadcast._id,
              alertId,
              drillId,
              metadata
            })
          : sendNotification({
              institutionId,
              channel,
              recipient,
              subject,
              title,
              body: message,
              broadcastId: broadcast._id,
              alertId,
              drillId,
              metadata
            })
      );
    });

    const results = await Promise.allSettled(tasks);

    // Calculate statistics
    const successful = results.filter(r =>
      r.status === 'fulfilled' && r.value?.success
    ).length;
    const skipped = results.filter(r =>
      r.status === 'fulfilled' && r.value?.skipped
    ).length;
    const failed = results.length - successful - skipped;

    // Update broadcast status
    broadcast.status = 'sent';
    broadcast.sentAt = new Date();
    broadcast.stats = {
      totalRecipients: recipients.length,
      sent: successful,
      delivered: 0, // Will be updated via delivery callbacks
      failed,
      skipped,
      skippedNoToken,
      skippedNoChannel,
      pending: 0
    };
    await broadcast.save();

    // Create incident log entry for history view
    await createIncidentLogForBroadcast(broadcast, {
      totalRecipients: recipients.length,
      successful,
      failed,
      skipped,
      skippedNoToken,
      skippedNoChannel,
      channels: channels.length
    });

    logger.info(`Broadcast sent: ${successful} successful, ${failed} failed`);

    return {
      success: true,
      broadcastId: broadcast._id,
      totalRecipients: recipients.length,
      channels: channels.length,
      successful,
      failed
    };
  } catch (error) {
    logger.error('Send broadcast error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Schedule broadcast message
 * @param {Object} options - Broadcast options with scheduledAt
 * @returns {Promise<Object>} Scheduled broadcast result
 */
export const scheduleBroadcast = async (options) => {
  const { scheduledAt, ...broadcastOptions } = options;

  try {
    const broadcast = await BroadcastMessage.create({
      ...broadcastOptions,
      scheduledAt: new Date(scheduledAt),
      status: 'scheduled'
    });

    logger.info(`Broadcast scheduled: ${broadcast._id} for ${scheduledAt}`);

    return {
      success: true,
      broadcastId: broadcast._id,
      scheduledAt: broadcast.scheduledAt
    };
  } catch (error) {
    logger.error('Schedule broadcast error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Process scheduled broadcasts (to be called by cron job)
 */
export const processScheduledBroadcasts = async () => {
  try {
    const now = new Date();
    const scheduled = await BroadcastMessage.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    for (const broadcast of scheduled) {
      // ATOMIC UPDATE: Only update if status is still 'scheduled'
      // This prevents race conditions where multiple scheduler runs pick up the same broadcast
      const updateResult = await BroadcastMessage.updateOne(
        { 
          _id: broadcast._id, 
          status: 'scheduled'  // Only update if still scheduled
        },
        { 
          $set: { 
            status: 'sending',
            processingLock: new Date() // Add lock timestamp
          } 
        }
      );

      // If no document was modified, another process already got it
      if (updateResult.modifiedCount === 0) {
        logger.warn(`Scheduled broadcast ${broadcast._id} already being processed by another instance, skipping`);
        continue;
      }

      // Reload broadcast to get fresh data
      const currentBroadcast = await BroadcastMessage.findById(broadcast._id);
      if (!currentBroadcast) {
        logger.warn(`Scheduled broadcast ${broadcast._id} not found after update, skipping`);
        continue;
      }

      logger.info(`Processing scheduled broadcast: ${broadcast._id}`);
      
      try {
        // Get recipients
        const recipients = await getRecipients(broadcast.recipients, broadcast.institutionId);

        if (recipients.length === 0) {
          broadcast.status = 'failed';
          await broadcast.save();
          logger.warn(`No recipients found for scheduled broadcast: ${broadcast._id}`);
          continue;
        }

        // Send notifications to all recipients
        let skippedNoToken = 0;
        let skippedNoChannel = 0;

        const scheduledTasks = recipients.flatMap(recipient => {
          const recipientChannels = new Set(broadcast.channels || ['push', 'email']);

          if (recipientChannels.has('push') && !recipient.fcmToken) {
            skippedNoToken += 1;
            recipientChannels.delete('push');
            if (recipient.email) {
              recipientChannels.add('email');
            }
          }

          if (recipientChannels.size === 0) {
            skippedNoChannel += 1;
            return [];
          }

          return Array.from(recipientChannels).map(channel =>
            broadcast.templateId
              ? sendNotificationWithTemplate({
                  institutionId: broadcast.institutionId,
                  channel,
                  recipient,
                  templateId: broadcast.templateId,
                  templateVariables: {},
                  broadcastId: broadcast._id,
                  alertId: broadcast.alertId,
                  drillId: broadcast.drillId,
                  metadata: broadcast.metadata
                })
              : sendNotification({
                  institutionId: broadcast.institutionId,
                  channel,
                  recipient,
                  subject: broadcast.subject,
                  title: broadcast.title,
                  body: broadcast.message,
                  broadcastId: broadcast._id,
                  alertId: broadcast.alertId,
                  drillId: broadcast.drillId,
                  metadata: broadcast.metadata
                })
          );
        });

        const results = await Promise.allSettled(scheduledTasks);

        // Calculate statistics
        const successful = results.filter(r =>
          r.status === 'fulfilled' && r.value?.success
        ).length;
        const skipped = results.filter(r =>
          r.status === 'fulfilled' && r.value?.skipped
        ).length;
        const failed = results.length - successful - skipped;

        // Only mark as 'sent' if at least some notifications were successful
        if (successful > 0) {
          currentBroadcast.status = 'sent';
          currentBroadcast.sentAt = new Date();
        } else if (skipped > 0 || skippedNoToken > 0 || skippedNoChannel > 0) {
          currentBroadcast.status = 'sent'; // treated as sent with skips
          currentBroadcast.sentAt = new Date();
        } else {
          currentBroadcast.status = 'failed';
        }

        currentBroadcast.stats = {
          totalRecipients: recipients.length,
          sent: successful,
          delivered: 0, // Will be updated via delivery callbacks
          failed,
          skipped,
          skippedNoToken,
          skippedNoChannel,
          pending: 0
        };
        await currentBroadcast.save();

        // Create incident log entry for history view (only once)
        await createIncidentLogForBroadcast(currentBroadcast, {
          totalRecipients: recipients.length,
          successful,
          failed,
          skipped,
          skippedNoToken,
          skippedNoChannel,
          channels: currentBroadcast.channels?.length || 0
        });

        logger.info(`Scheduled broadcast processed: ${currentBroadcast._id} (${successful} successful, ${failed} failed, ${queued} queued)`);
      } catch (error) {
        logger.error(`Error processing scheduled broadcast ${currentBroadcast._id}:`, error);
        // Mark as failed and clear processing lock
        currentBroadcast.status = 'failed';
        currentBroadcast.processingLock = undefined;
        await currentBroadcast.save();
      }
    }

    return {
      success: true,
      processed: scheduled.length
    };
  } catch (error) {
    logger.error('Process scheduled broadcasts error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get broadcast statistics
 * @param {string} broadcastId - Broadcast ID
 * @returns {Promise<Object>} Broadcast statistics
 */
export const getBroadcastStats = async (broadcastId) => {
  try {
    const broadcast = await BroadcastMessage.findById(broadcastId);
    if (!broadcast) {
      throw new Error('Broadcast not found');
    }

    return {
      success: true,
      broadcast: broadcast.toJSON(),
      stats: broadcast.stats
    };
  } catch (error) {
    logger.error('Get broadcast stats error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendBroadcast,
  scheduleBroadcast,
  processScheduledBroadcasts,
  getBroadcastStats
};

