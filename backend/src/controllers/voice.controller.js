/**
 * Phase 3.5.5: Voice Controller
 * Handles voice command API endpoints
 */

import { processVoiceCommand, getCommands } from '../services/voice.service.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Process voice command
 * POST /api/voice/command
 */
export const processCommand = async (req, res) => {
  try {
    const { text, context } = req.body;
    const userId = req.userId;

    if (!text || typeof text !== 'string') {
      return errorResponse(res, 'Text is required', 400);
    }

    const result = await processVoiceCommand(text, userId, context || null);

    if (!result.success) {
      return errorResponse(
        res,
        result.error || 'Command not recognized',
        400,
        { suggestions: result.suggestions }
      );
    }

    return successResponse(
      res,
      {
        action: result.action,
        message: result.message,
        confidence: result.confidence,
      },
      'Command processed successfully'
    );
  } catch (error) {
    logger.error('Process command controller error:', error);
    return errorResponse(res, 'Failed to process command', 500);
  }
};

/**
 * Get available commands
 * GET /api/voice/commands
 */
export const getAvailableCommands = async (req, res) => {
  try {
    const { context } = req.query;
    const commands = getCommands(context || null);

    return successResponse(
      res,
      { commands, context: context || 'all' },
      'Commands retrieved successfully'
    );
  } catch (error) {
    logger.error('Get commands controller error:', error);
    return errorResponse(res, 'Failed to retrieve commands', 500);
  }
};

/**
 * Test command parsing (for development)
 * POST /api/voice/test
 */
export const testCommand = async (req, res) => {
  try {
    const { text, context } = req.body;

    if (!text) {
      return errorResponse(res, 'Text is required', 400);
    }

    const { testCommand } = await import('../services/voice.service.js');
    const result = testCommand(text, context || null);

    return successResponse(res, result, 'Command test completed');
  } catch (error) {
    logger.error('Test command controller error:', error);
    return errorResponse(res, 'Failed to test command', 500);
  }
};


