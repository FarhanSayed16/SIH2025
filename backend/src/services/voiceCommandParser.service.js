/**
 * Phase 3.5.5: Voice Command Parser Service
 * Parses voice commands and maps them to actions
 */

import logger from '../config/logger.js';

/**
 * Command mappings with variations
 */
const COMMAND_MAPPINGS = {
  // Navigation commands
  next: ['next', 'skip', 'continue', 'forward', 'proceed'],
  back: ['back', 'previous', 'go back', 'return'],
  home: ['home', 'main', 'dashboard', 'menu'],
  
  // Game commands
  startGame: ['start game', 'play game', 'begin game', 'launch game'],
  stopGame: ['stop game', 'end game', 'quit game'],
  
  // Content commands
  play: ['play', 'start', 'begin'],
  stop: ['stop', 'pause', 'end'],
  explain: ['explain', 'tell me', 'what is', 'describe'],
  
  // Quiz commands
  showAnswer: ['show answer', 'answer', 'reveal answer', 'tell answer'],
  skipQuestion: ['skip', 'next question', 'skip question'],
  
  // General commands
  help: ['help', 'assistance', 'what can you do'],
  yes: ['yes', 'okay', 'ok', 'sure', 'confirm'],
  no: ['no', 'cancel', 'stop'],
};

/**
 * Parse voice command text and return action
 * @param {string} text - Recognized speech text
 * @param {string} context - Current screen/context (optional)
 * @returns {Object} Parsed command with action and confidence
 */
export const parseCommand = (text, context = null) => {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      action: null,
      confidence: 0,
      error: 'Invalid text input',
    };
  }

  const normalizedText = text.toLowerCase().trim();

  // Try exact match first
  for (const [action, variations] of Object.entries(COMMAND_MAPPINGS)) {
    for (const variation of variations) {
      if (normalizedText === variation || normalizedText.includes(variation)) {
        return {
          success: true,
          action,
          originalText: text,
          confidence: normalizedText === variation ? 1.0 : 0.8,
          context,
        };
      }
    }
  }

  // Try fuzzy matching for common words
  const words = normalizedText.split(/\s+/);
  for (const word of words) {
    for (const [action, variations] of Object.entries(COMMAND_MAPPINGS)) {
      for (const variation of variations) {
        if (variation.includes(word) || word.includes(variation)) {
          return {
            success: true,
            action,
            originalText: text,
            confidence: 0.6,
            context,
            note: 'Fuzzy match',
          };
        }
      }
    }
  }

  return {
    success: false,
    action: null,
    confidence: 0,
    originalText: text,
    error: 'Command not recognized',
  };
};

/**
 * Get all available commands
 * @returns {Array} List of available commands with descriptions
 */
export const getAvailableCommands = () => {
  const commands = [];

  for (const [action, variations] of Object.entries(COMMAND_MAPPINGS)) {
    commands.push({
      action,
      variations,
      primary: variations[0],
    });
  }

  return commands;
};

/**
 * Get command suggestions based on context
 * @param {string} context - Current screen/context
 * @returns {Array} Suggested commands for the context
 */
export const getContextualCommands = (context) => {
  const contextualMap = {
    module: ['next', 'back', 'play', 'stop', 'explain', 'help'],
    quiz: ['next', 'back', 'show answer', 'skip question', 'help'],
    game: ['start game', 'stop game', 'help'],
    home: ['start game', 'help'],
    any: ['help', 'back', 'home'],
  };

  const commands = contextualMap[context] || contextualMap.any;
  return commands.map((cmd) => {
    const entry = Object.entries(COMMAND_MAPPINGS).find(([action, variations]) =>
      variations.includes(cmd)
    );
    return entry
      ? {
          action: entry[0],
          primary: entry[1][0],
          description: `Say "${entry[1][0]}"`,
        }
      : null;
  }).filter(Boolean);
};

/**
 * Validate command for context
 * @param {string} action - Command action
 * @param {string} context - Current context
 * @returns {boolean} Whether command is valid for context
 */
export const validateCommandForContext = (action, context) => {
  const validActions = {
    module: ['next', 'back', 'play', 'stop', 'explain', 'help', 'home'],
    quiz: ['next', 'back', 'show answer', 'skip question', 'help', 'home'],
    game: ['start game', 'stop game', 'help', 'back', 'home'],
    home: ['start game', 'help'],
    any: ['help', 'back', 'home'],
  };

  const allowed = validActions[context] || validActions.any;
  return allowed.includes(action);
};

/**
 * Format command response
 * @param {Object} parsedCommand - Parsed command result
 * @returns {Object} Formatted response
 */
export const formatCommandResponse = (parsedCommand) => {
  if (!parsedCommand.success) {
    return {
      success: false,
      message: parsedCommand.error || 'Command not recognized',
      suggestions: ['Try saying "help" to see available commands'],
    };
  }

  return {
    success: true,
    action: parsedCommand.action,
    message: `Executing: ${parsedCommand.action}`,
    confidence: parsedCommand.confidence,
  };
};

export default {
  parseCommand,
  getAvailableCommands,
  getContextualCommands,
  validateCommandForContext,
  formatCommandResponse,
};


