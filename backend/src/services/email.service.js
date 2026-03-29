/**
 * Phase 3.4.3: Email Service (Nodemailer Integration + SendGrid)
 * Handles sending email notifications with rate limiting and multiple providers
 */

import logger from '../config/logger.js';
import { getRedisClient } from '../config/redis.js';

// Email transporter (supports multiple providers)
let nodemailer = null;
let emailTransporter = null;
let sendGridClient = null;
let emailConfigured = false;
let sendGridConfigured = false;
let initializationAttempted = false;

// Email rate limiting constants
const MAX_DAILY_EMAILS_GMAIL = 500; // Gmail free account limit
const MAX_DAILY_EMAILS_SENDGRID = 100; // SendGrid free tier limit
const EMAIL_BATCH_SIZE = 50; // Send emails in batches
const EMAIL_BATCH_DELAY = 1000; // 1 second delay between batches

/**
 * Initialize email transporter (lazy initialization)
 * Supports both SMTP (Gmail) and SendGrid
 */
const initializeEmailService = async () => {
  if (initializationAttempted) return; // Already attempted
  initializationAttempted = true;
  
  try {
    // Initialize SendGrid if API key is provided
    if (process.env.SENDGRID_API_KEY) {
      try {
        const sendGridModule = await import('@sendgrid/mail').catch(() => null);
        if (sendGridModule && sendGridModule.default) {
          sendGridModule.default.setApiKey(process.env.SENDGRID_API_KEY);
          sendGridClient = sendGridModule.default;
          sendGridConfigured = true;
          logger.info('✅ SendGrid email service initialized');
        }
      } catch (error) {
        logger.warn('⚠️ SendGrid package not installed - Install with: npm install @sendgrid/mail');
      }
    }

    // Initialize SMTP (Gmail) if credentials are provided
    const nodemailerModule = await import('nodemailer').catch((err) => {
      logger.warn('⚠️ Nodemailer not installed - SMTP email service will be disabled');
      logger.warn('   Install with: npm install nodemailer');
      return null;
    });
    
    if (nodemailerModule && nodemailerModule.default) {
      nodemailer = nodemailerModule.default;

      const emailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      // Check if SMTP is configured
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        emailTransporter = nodemailer.createTransport(emailConfig);
        emailConfigured = true;
        logger.info('✅ SMTP email service initialized');
        
        // Verify connection (async, don't block)
        emailTransporter.verify((error) => {
          if (error) {
            logger.warn('⚠️ SMTP email service verification failed:', error.message);
            emailConfigured = false;
          } else {
            logger.info('✅ SMTP email service connection verified');
          }
        });
      }
    }

    if (!emailConfigured && !sendGridConfigured) {
      logger.warn('⚠️ No email service configured - Email notifications will be disabled');
      logger.warn('   Configure either SENDGRID_API_KEY or SMTP_USER/SMTP_PASS');
    }
  } catch (error) {
    logger.warn('⚠️ Email service initialization failed:', error.message);
    emailConfigured = false;
    sendGridConfigured = false;
  }
};

/**
 * Get daily email count from Redis
 * @returns {Promise<number>} Daily email count
 */
const getDailyEmailCount = async () => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isReady) {
      return 0; // Redis not available, can't track
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const count = await redisClient.get(`email:count:${today}`);
    return parseInt(count || '0', 10);
  } catch (error) {
    logger.warn('Failed to get daily email count from Redis:', error.message);
    return 0;
  }
};

/**
 * Increment daily email count in Redis
 * @returns {Promise<number>} New count
 */
const incrementDailyEmailCount = async () => {
  try {
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isReady) {
      return 0; // Redis not available
    }

    const today = new Date().toISOString().split('T')[0];
    const count = await redisClient.incr(`email:count:${today}`);
    
    // Set expiry to end of day (24 hours from now)
    if (count === 1) {
      const secondsUntilMidnight = Math.floor((new Date().setHours(24, 0, 0, 0) - Date.now()) / 1000);
      await redisClient.expire(`email:count:${today}`, secondsUntilMidnight);
    }

    return count;
  } catch (error) {
    logger.warn('Failed to increment daily email count in Redis:', error.message);
    return 0;
  }
};

/**
 * Check if email can be sent (rate limit check)
 * @param {string} provider - 'smtp' or 'sendgrid'
 * @returns {Promise<{canSend: boolean, reason?: string, count?: number, limit?: number}>}
 */
const checkEmailRateLimit = async (provider = 'smtp') => {
  const dailyCount = await getDailyEmailCount();
  const limit = provider === 'sendgrid' ? MAX_DAILY_EMAILS_SENDGRID : MAX_DAILY_EMAILS_GMAIL;

  if (dailyCount >= limit) {
    return {
      canSend: false,
      reason: `Daily email limit reached (${dailyCount}/${limit}). Emails will be queued.`,
      count: dailyCount,
      limit
    };
  }

  return {
    canSend: true,
    count: dailyCount,
    limit
  };
};

/**
 * Send email via SendGrid
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @returns {Promise<Object>} Send result
 */
const sendEmailViaSendGrid = async (to, subject, text, html = null) => {
  if (!sendGridConfigured || !sendGridClient) {
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    // Use verified email: SENDGRID_FROM_EMAIL, or fallback to SMTP_USER (Gmail) which is already verified
    // This ensures we use an email that works
    const from = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_USER || 'noreply@kavach.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'Kavach';

    const msg = {
      to,
      from: { email: from, name: fromName },
      subject,
      text,
      ...(html && { html })
    };

    const response = await sendGridClient.send(msg);
    
    logger.info(`✅ Email sent via SendGrid to ${to}: ${response[0].statusCode}`);
    
    return {
      success: true,
      provider: 'sendgrid',
      providerId: response[0].headers['x-message-id'] || 'unknown',
      response: response[0]
    };
  } catch (error) {
    logger.error(`❌ Failed to send email via SendGrid to ${to}:`, error);
    return {
      success: false,
      error: error.message,
      provider: 'sendgrid'
    };
  }
};

/**
 * Send email via SMTP (Gmail)
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Send result
 */
const sendEmailViaSMTP = async (to, subject, text, html = null, options = {}) => {
  if (!emailConfigured || !emailTransporter) {
    return { success: false, error: 'SMTP not configured' };
  }

  try {
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@kavach.com';

    const mailOptions = {
      from,
      to,
      subject,
      text,
      ...(html && { html }),
      ...options
    };

    const info = await emailTransporter.sendMail(mailOptions);

    logger.info(`✅ Email sent via SMTP to ${to}: ${info.messageId}`);

    return {
      success: true,
      provider: 'smtp',
      providerId: info.messageId,
      response: info
    };
  } catch (error) {
    logger.error(`❌ Failed to send email via SMTP to ${to}:`, error);
    
    // Check if it's a rate limit error
    if (error.message && error.message.includes('Daily user sending limit exceeded')) {
      return {
        success: false,
        error: 'Gmail daily sending limit exceeded',
        rateLimitExceeded: true,
        provider: 'smtp'
      };
    }

    return {
      success: false,
      error: error.message,
      provider: 'smtp'
    };
  }
};

/**
 * Send email with rate limiting and provider fallback
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @param {Object} options - Additional options (cc, bcc, attachments, etc.)
 * @returns {Promise<Object>} Send result
 */
export const sendEmail = async (to, subject, text, html = null, options = {}) => {
  // Lazy initialize email service
  if (!initializationAttempted) {
    await initializeEmailService();
  }
  
  if (!emailConfigured && !sendGridConfigured) {
    logger.warn('Email service not configured - message not sent');
    return {
      success: false,
      error: 'Email service not configured',
      providerId: null,
      queued: false
    };
  }

  // Try SendGrid first (if configured), then SMTP as fallback
  let result = null;
  let provider = 'none';

  // Try SendGrid first
  if (sendGridConfigured) {
    const rateLimit = await checkEmailRateLimit('sendgrid');
    if (rateLimit.canSend) {
      result = await sendEmailViaSendGrid(to, subject, text, html);
      provider = 'sendgrid';
      if (result.success) {
        await incrementDailyEmailCount();
        return result;
      }
    } else {
      logger.warn(`SendGrid rate limit reached: ${rateLimit.reason}`);
    }
  }

  // Fallback to SMTP if SendGrid failed or not configured
  if (emailConfigured && (!result || !result.success)) {
    const rateLimit = await checkEmailRateLimit('smtp');
    if (rateLimit.canSend) {
      result = await sendEmailViaSMTP(to, subject, text, html, options);
      provider = 'smtp';
      if (result.success) {
        await incrementDailyEmailCount();
        return result;
      } else if (result.rateLimitExceeded) {
        // Gmail limit hit, try SendGrid if available
        if (sendGridConfigured && provider !== 'sendgrid') {
          logger.info('Gmail limit exceeded, trying SendGrid as fallback');
          const sendGridRateLimit = await checkEmailRateLimit('sendgrid');
          if (sendGridRateLimit.canSend) {
            result = await sendEmailViaSendGrid(to, subject, text, html);
            if (result.success) {
              await incrementDailyEmailCount();
              return result;
            }
          }
        }
      }
    } else {
      logger.warn(`SMTP rate limit reached: ${rateLimit.reason}`);
      return {
        success: false,
        error: rateLimit.reason,
        providerId: null,
        queued: true, // Can be queued for later
        count: rateLimit.count,
        limit: rateLimit.limit
      };
    }
  }

  // If all providers failed
  if (!result || !result.success) {
    return {
      success: false,
      error: result?.error || 'All email providers failed',
      providerId: null,
      queued: true
    };
  }

  return result;
};

/**
 * Send email to multiple recipients with batching and rate limiting
 * @param {string[]} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Send results
 */
export const sendBulkEmail = async (recipients, subject, text, html = null, options = {}) => {
  // Lazy initialize email service
  if (!initializationAttempted) {
    await initializeEmailService();
  }
  
  if (!emailConfigured && !sendGridConfigured) {
    logger.warn('Email service not configured - bulk emails not sent');
    return {
      success: false,
      error: 'Email service not configured',
      results: []
    };
  }

  const results = [];
  let successful = 0;
  let failed = 0;
  let queued = 0;

  // Send in batches to avoid overwhelming the email service
  for (let i = 0; i < recipients.length; i += EMAIL_BATCH_SIZE) {
    const batch = recipients.slice(i, i + EMAIL_BATCH_SIZE);
    
    // Check rate limit before sending batch
    const rateLimit = await checkEmailRateLimit(sendGridConfigured ? 'sendgrid' : 'smtp');
    if (!rateLimit.canSend) {
      logger.warn(`Rate limit reached, queuing remaining ${recipients.length - i} emails`);
      // Queue remaining emails
      for (const recipient of recipients.slice(i)) {
        results.push({
          success: false,
          error: rateLimit.reason,
          queued: true
        });
        queued++;
      }
      break;
    }

    // Send batch
    const batchResults = await Promise.allSettled(
      batch.map(recipient => sendEmail(recipient, subject, text, html, options))
    );

    // Process batch results
    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        const value = result.value;
        results.push(value);
        if (value.success) {
          successful++;
        } else if (value.queued) {
          queued++;
          failed++;
        } else {
          failed++;
        }
      } else {
        results.push({ success: false, error: result.reason });
        failed++;
      }
    }

    // Delay between batches (except for last batch)
    if (i + EMAIL_BATCH_SIZE < recipients.length) {
      await new Promise(resolve => setTimeout(resolve, EMAIL_BATCH_DELAY));
    }
  }

  logger.info(`Bulk email sent: ${successful} successful, ${failed} failed, ${queued} queued`);

  return {
    success: successful > 0,
    total: recipients.length,
    successful,
    failed,
    queued,
    results
  };
};

/**
 * Send HTML email with template
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlTemplate - HTML template content
 * @param {Object} variables - Template variables
 * @returns {Promise<Object>} Send result
 */
export const sendHTMLEmail = async (to, subject, htmlTemplate, variables = {}) => {
  // Simple template variable replacement
  let html = htmlTemplate;
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key] || '');
  });

  const text = html.replace(/<[^>]*>/g, ''); // Strip HTML for text version

  return sendEmail(to, subject, text, html);
};

/**
 * Get email service status and rate limit info
 * @returns {Promise<Object>} Service status
 */
export const getEmailServiceStatus = async () => {
  if (!initializationAttempted) {
    await initializeEmailService();
  }

  const dailyCount = await getDailyEmailCount();
  const smtpLimit = emailConfigured ? MAX_DAILY_EMAILS_GMAIL : 0;
  const sendGridLimit = sendGridConfigured ? MAX_DAILY_EMAILS_SENDGRID : 0;
  const effectiveLimit = sendGridConfigured ? sendGridLimit : smtpLimit;
  const remaining = Math.max(0, effectiveLimit - dailyCount);

  return {
    smtpConfigured: emailConfigured,
    sendGridConfigured: sendGridConfigured,
    dailyCount,
    smtpLimit,
    sendGridLimit,
    effectiveLimit,
    remaining,
    canSend: remaining > 0
  };
};

export default {
  sendEmail,
  sendBulkEmail,
  sendHTMLEmail,
  getEmailServiceStatus,
  isConfigured: () => emailConfigured || sendGridConfigured
};
