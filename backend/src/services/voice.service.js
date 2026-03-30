/**
 * Phase 3.5.5: Voice Service
 * Handles voice command processing and execution
 */

import {
  parseCommand,
  getAvailableCommands,
  getContextualCommands,
  validateCommandForContext,
  formatCommandResponse,
} from './voiceCommandParser.service.js';
import logger from '../config/logger.js';

/**
 * Process voice command
 * @param {string} text - Recognized speech text
 * @param {string} userId - User ID
 * @param {string} context - Current context (optional)
 * @returns {Object} Command result
 */
export const processVoiceCommand = async (text, userId, context = null) => {
  try {
    // Parse the command
    const parsedCommand = parseCommand(text, context);

    if (!parsedCommand.success) {
      return {
        success: false,
        error: parsedCommand.error,
        suggestions: getContextualCommands(context || 'any'),
      };
    }

    // Validate command for context
    if (context && !validateCommandForContext(parsedCommand.action, context)) {
      return {
        success: false,
        error: `Command "${parsedCommand.action}" not available in ${context} context`,
        suggestions: getContextualCommands(context),
      };
    }

    // Log command for analytics
    logger.info(`Voice command: ${parsedCommand.action} by user ${userId}`, {
      action: parsedCommand.action,
      originalText: text,
      context,
      confidence: parsedCommand.confidence,
    });

    // Return formatted response
    return formatCommandResponse(parsedCommand);
  } catch (error) {
    logger.error('Process voice command error:', error);
    return {
      success: false,
      error: 'Failed to process voice command',
    };
  }
};

/**
 * Get available commands for a context
 * @param {string} context - Current context
 * @returns {Array} Available commands
 */
export const getCommands = (context = null) => {
  if (context) {
    return getContextualCommands(context);
  }
  return getAvailableCommands();
};

/**
 * Test command parsing (for development)
 * @param {string} text - Test text
 * @param {string} context - Test context
 * @returns {Object} Test result
 */
export const testCommand = (text, context = null) => {
  const parsed = parseCommand(text, context);
  return {
    input: text,
    context,
    result: parsed,
    formatted: formatCommandResponse(parsed),
  };
};

export default {
  processVoiceCommand,
  getCommands,
  testCommand,
};


