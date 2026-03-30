/**
 * Phase 3.4.3: Template Service
 * Manages message templates
 */

import MessageTemplate from '../models/MessageTemplate.js';
import logger from '../config/logger.js';

/**
 * Create message template
 * @param {Object} templateData - Template data
 * @returns {Promise<Object>} Created template
 */
export const createTemplate = async (templateData) => {
  try {
    const template = await MessageTemplate.create(templateData);
    logger.info(`Template created: ${template.name} (${template._id})`);
    return {
      success: true,
      template
    };
  } catch (error) {
    logger.error('Create template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get templates
 * @param {string} institutionId - Institution ID
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>} Templates
 */
export const getTemplates = async (institutionId, filters = {}) => {
  try {
    const query = {
      $or: [
        { institutionId },
        { isGlobal: true }
      ],
      isActive: true
    };

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.channel) {
      query['channels'] = filters.channel;
    }

    const templates = await MessageTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return {
      success: true,
      templates
    };
  } catch (error) {
    logger.error('Get templates error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Template
 */
export const getTemplateById = async (templateId) => {
  try {
    const template = await MessageTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    return {
      success: true,
      template
    };
  } catch (error) {
    logger.error('Get template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Update template
 * @param {string} templateId - Template ID
 * @param {Object} updates - Update data
 * @returns {Promise<Object>} Updated template
 */
export const updateTemplate = async (templateId, updates) => {
  try {
    const template = await MessageTemplate.findByIdAndUpdate(
      templateId,
      updates,
      { new: true, runValidators: true }
    );

    if (!template) {
      throw new Error('Template not found');
    }

    logger.info(`Template updated: ${template.name}`);
    return {
      success: true,
      template
    };
  } catch (error) {
    logger.error('Update template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete template (soft delete)
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Delete result
 */
export const deleteTemplate = async (templateId) => {
  try {
    const template = await MessageTemplate.findByIdAndUpdate(
      templateId,
      { isActive: false },
      { new: true }
    );

    if (!template) {
      throw new Error('Template not found');
    }

    logger.info(`Template deleted: ${template.name}`);
    return {
      success: true
    };
  } catch (error) {
    logger.error('Delete template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Preview template with variables
 * @param {string} templateId - Template ID
 * @param {string} channel - Channel to preview
 * @param {Object} variables - Template variables
 * @returns {Promise<Object>} Preview content
 */
export const previewTemplate = async (templateId, channel, variables = {}) => {
  try {
    const template = await MessageTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const channelContent = template.content[channel];
    if (!channelContent) {
      throw new Error(`Template does not support channel: ${channel}`);
    }

    // Process template variables
    let preview = {};
    Object.keys(channelContent).forEach(key => {
      let content = channelContent[key] || '';
      Object.keys(variables).forEach(varKey => {
        const regex = new RegExp(`{{${varKey}}}`, 'g');
        content = content.replace(regex, variables[varKey] || '');
      });
      preview[key] = content;
    });

    return {
      success: true,
      preview
    };
  } catch (error) {
    logger.error('Preview template error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate
};

