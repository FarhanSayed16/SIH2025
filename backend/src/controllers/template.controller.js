/**
 * Phase 3.4.3: Template Controller
 * Handles message template endpoints
 */

import {
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  previewTemplate
} from '../services/template.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Create template
 * POST /api/templates
 */
export const createTemplateEndpoint = async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      institutionId: req.body.institutionId || req.user?.institutionId,
      createdBy: req.user?._id || req.userId
    };

    const result = await createTemplate(templateData);

    if (result.success) {
      return successResponse(res, result.template, 'Template created successfully', 201);
    } else {
      return errorResponse(res, result.error || 'Failed to create template', 400);
    }
  } catch (error) {
    logger.error('Create template endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to create template', 500);
  }
};

/**
 * Get templates
 * GET /api/templates
 */
export const getTemplatesEndpoint = async (req, res) => {
  try {
    const { category, channel } = req.query;

    const result = await getTemplates(req.user?.institutionId, {
      category,
      channel
    });

    if (result.success) {
      return successResponse(res, result.templates, 'Templates retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to get templates', 500);
    }
  } catch (error) {
    logger.error('Get templates endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get templates', 500);
  }
};

/**
 * Get template by ID
 * GET /api/templates/:id
 */
export const getTemplateByIdEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await getTemplateById(id);

    if (result.success) {
      return successResponse(res, result.template, 'Template retrieved successfully');
    } else {
      return errorResponse(res, result.error || 'Template not found', 404);
    }
  } catch (error) {
    logger.error('Get template by ID endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to get template', 500);
  }
};

/**
 * Update template
 * PUT /api/templates/:id
 */
export const updateTemplateEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await updateTemplate(id, req.body);

    if (result.success) {
      return successResponse(res, result.template, 'Template updated successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to update template', 400);
    }
  } catch (error) {
    logger.error('Update template endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to update template', 500);
  }
};

/**
 * Delete template
 * DELETE /api/templates/:id
 */
export const deleteTemplateEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteTemplate(id);

    if (result.success) {
      return successResponse(res, null, 'Template deleted successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to delete template', 400);
    }
  } catch (error) {
    logger.error('Delete template endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to delete template', 500);
  }
};

/**
 * Preview template
 * POST /api/templates/:id/preview
 */
export const previewTemplateEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const { channel, variables = {} } = req.body;

    if (!channel) {
      return errorResponse(res, 'Channel is required', 400);
    }

    const result = await previewTemplate(id, channel, variables);

    if (result.success) {
      return successResponse(res, result.preview, 'Template preview generated successfully');
    } else {
      return errorResponse(res, result.error || 'Failed to preview template', 400);
    }
  } catch (error) {
    logger.error('Preview template endpoint error:', error);
    return errorResponse(res, error.message || 'Failed to preview template', 500);
  }
};

