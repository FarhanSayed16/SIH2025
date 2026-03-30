/**
 * Phase 3.4.3: SMS Service (Twilio Integration)
 * Handles sending SMS notifications
 */

import logger from '../config/logger.js';

// Twilio client (optional - will work without if not configured)
let twilioClient = null;
let twilioConfigured = false;

// Initialize Twilio client
try {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (accountSid && authToken && fromNumber) {
    const twilio = await import('twilio');
    twilioClient = twilio.default(accountSid, authToken);
    twilioConfigured = true;
    logger.info('✅ Twilio SMS service initialized');
  } else {
    logger.warn('⚠️ Twilio credentials not configured - SMS service will be disabled');
  }
} catch (error) {
  logger.warn('⚠️ Twilio not installed or initialization failed - SMS service disabled');
  logger.warn(`   Install with: npm install twilio`);
  logger.warn(`   Error: ${error.message}`);
}

/**
 * Send SMS message
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} message - Message body
 * @returns {Promise<Object>} Send result
 */
export const sendSMS = async (to, message) => {
  if (!twilioConfigured || !twilioClient) {
    logger.warn('SMS service not configured - message not sent');
    return {
      success: false,
      skipped: true,
      reason: 'SMS service not configured',
      providerId: null
    };
  }

  try {
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to
    });

    logger.info(`✅ SMS sent successfully to ${to}: ${result.sid}`);

    return {
      success: true,
      providerId: result.sid,
      status: result.status,
      response: result
    };
  } catch (error) {
    logger.error(`❌ Failed to send SMS to ${to}:`, error);
    return {
      success: false,
      error: error.message,
      providerId: null
    };
  }
};

/**
 * Send SMS to multiple recipients
 * @param {string[]} recipients - Array of phone numbers
 * @param {string} message - Message body
 * @returns {Promise<Object>} Send results
 */
export const sendBulkSMS = async (recipients, message) => {
  if (!twilioConfigured || !twilioClient) {
    logger.warn('SMS service not configured - bulk messages not sent');
    return {
      success: false,
      skipped: true,
      reason: 'SMS service not configured',
      results: []
    };
  }

  const results = await Promise.allSettled(
    recipients.map(recipient => sendSMS(recipient, message))
  );

  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  logger.info(`Bulk SMS sent: ${successful} successful, ${failed} failed`);

  return {
    success: true,
    total: recipients.length,
    successful,
    failed,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: r.reason })
  };
};

/**
 * Check SMS delivery status
 * @param {string} messageId - Twilio message SID
 * @returns {Promise<Object>} Delivery status
 */
export const checkSMSStatus = async (messageId) => {
  if (!twilioConfigured || !twilioClient) {
    return {
      success: false,
      error: 'SMS service not configured'
    };
  }

  try {
    const message = await twilioClient.messages(messageId).fetch();
    return {
      success: true,
      status: message.status,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    logger.error(`Failed to check SMS status for ${messageId}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  sendSMS,
  sendBulkSMS,
  checkSMSStatus,
  isConfigured: () => twilioConfigured
};

