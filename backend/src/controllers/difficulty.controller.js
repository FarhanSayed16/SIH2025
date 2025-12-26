/**
 * Phase 3.1.5: Difficulty Controller
 * Handles grade-based difficulty filtering and adaptive complexity
 */

import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import Module from '../models/Module.js';

/**
 * Get difficulty recommendations for a grade level
 * GET /api/difficulty/recommendations/:gradeLevel
 */
export const getDifficultyRecommendations = async (req, res) => {
  try {
    const { gradeLevel } = req.params;

    if (!gradeLevel) {
      return errorResponse(res, 'Grade level is required', 400);
    }

    // Grade to difficulty mapping
    const gradeDifficultyMap = {
      'KG': { difficulty: 'beginner', preferredQuizTypes: ['image', 'audio', 'image-to-image'] },
      '1': { difficulty: 'beginner', preferredQuizTypes: ['image', 'audio', 'image-to-image'] },
      '2': { difficulty: 'beginner', preferredQuizTypes: ['image', 'audio', 'image-to-image'] },
      '3': { difficulty: 'beginner', preferredQuizTypes: ['text', 'image', 'audio'] },
      '4': { difficulty: 'beginner', preferredQuizTypes: ['text', 'image', 'audio'] },
      '5': { difficulty: 'beginner', preferredQuizTypes: ['text', 'image'] },
      '6': { difficulty: 'intermediate', preferredQuizTypes: ['text', 'image'] },
      '7': { difficulty: 'intermediate', preferredQuizTypes: ['text', 'image'] },
      '8': { difficulty: 'intermediate', preferredQuizTypes: ['text'] },
      '9': { difficulty: 'advanced', preferredQuizTypes: ['text'] },
      '10': { difficulty: 'advanced', preferredQuizTypes: ['text'] },
      '11': { difficulty: 'advanced', preferredQuizTypes: ['text'] },
      '12': { difficulty: 'advanced', preferredQuizTypes: ['text'] },
    };

    const recommendation = gradeDifficultyMap[gradeLevel] || {
      difficulty: 'beginner',
      preferredQuizTypes: ['text', 'image']
    };

    // Get module count for this grade level
    const moduleCount = await Module.countDocuments({
      isActive: true,
      $or: [
        { gradeLevel: { $in: [gradeLevel, 'all'] } },
        { gradeLevel: { $exists: false } }
      ],
      difficulty: recommendation.difficulty
    });

    return successResponse(res, {
      gradeLevel,
      recommendedDifficulty: recommendation.difficulty,
      preferredQuizTypes: recommendation.preferredQuizTypes,
      availableModules: moduleCount,
      gradeMapping: {
        'KG-2': 'Animation only, Image-based quizzes, Group Mode',
        '3-5': 'Audio + Images, Mixed Easy quizzes, Group/Individual',
        '6-8': 'Text + Images, MCQ, Individual',
        '9-12': 'Full modules, Full quizzes, Full games'
      }
    }, 'Difficulty recommendations retrieved successfully');
  } catch (error) {
    logger.error('Get difficulty recommendations error:', error);
    return errorResponse(res, 'Failed to retrieve difficulty recommendations', 500);
  }
};

/**
 * Get adaptive quiz complexity settings
 * GET /api/difficulty/quiz-settings/:gradeLevel
 */
export const getQuizSettings = async (req, res) => {
  try {
    const { gradeLevel } = req.params;

    if (!gradeLevel) {
      return errorResponse(res, 'Grade level is required', 400);
    }

    // Adaptive quiz settings based on grade
    const quizSettings = {
      'KG': {
        maxQuestions: 3,
        timeLimit: null, // No time limit for young kids
        questionTypes: ['image', 'audio', 'image-to-image'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 60
      },
      '1': {
        maxQuestions: 3,
        timeLimit: null,
        questionTypes: ['image', 'audio', 'image-to-image'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 60
      },
      '2': {
        maxQuestions: 4,
        timeLimit: null,
        questionTypes: ['image', 'audio', 'image-to-image'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 65
      },
      '3': {
        maxQuestions: 5,
        timeLimit: 300, // 5 minutes
        questionTypes: ['text', 'image', 'audio'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 70
      },
      '4': {
        maxQuestions: 5,
        timeLimit: 300,
        questionTypes: ['text', 'image', 'audio'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 70
      },
      '5': {
        maxQuestions: 5,
        timeLimit: 300,
        questionTypes: ['text', 'image'],
        showExplanations: true,
        allowRetries: true,
        passingScore: 70
      },
      '6': {
        maxQuestions: 7,
        timeLimit: 600, // 10 minutes
        questionTypes: ['text', 'image'],
        showExplanations: true,
        allowRetries: false,
        passingScore: 75
      },
      '7': {
        maxQuestions: 7,
        timeLimit: 600,
        questionTypes: ['text', 'image'],
        showExplanations: true,
        allowRetries: false,
        passingScore: 75
      },
      '8': {
        maxQuestions: 8,
        timeLimit: 900, // 15 minutes
        questionTypes: ['text'],
        showExplanations: true,
        allowRetries: false,
        passingScore: 80
      },
      '9': {
        maxQuestions: 10,
        timeLimit: 900,
        questionTypes: ['text'],
        showExplanations: false,
        allowRetries: false,
        passingScore: 80
      },
      '10': {
        maxQuestions: 10,
        timeLimit: 900,
        questionTypes: ['text'],
        showExplanations: false,
        allowRetries: false,
        passingScore: 85
      },
      '11': {
        maxQuestions: 10,
        timeLimit: 1200, // 20 minutes
        questionTypes: ['text'],
        showExplanations: false,
        allowRetries: false,
        passingScore: 85
      },
      '12': {
        maxQuestions: 10,
        timeLimit: 1200,
        questionTypes: ['text'],
        showExplanations: false,
        allowRetries: false,
        passingScore: 90
      }
    };

    const settings = quizSettings[gradeLevel] || quizSettings['6']; // Default to 6th grade

    return successResponse(res, {
      gradeLevel,
      settings
    }, 'Quiz settings retrieved successfully');
  } catch (error) {
    logger.error('Get quiz settings error:', error);
    return errorResponse(res, 'Failed to retrieve quiz settings', 500);
  }
};

