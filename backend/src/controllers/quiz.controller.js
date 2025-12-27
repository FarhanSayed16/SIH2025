/**
 * Phase 3.1.4: Quiz Controller
 * Handles AI-powered quiz generation
 */

import { generateQuizQuestions } from '../services/ai.service.js';
import { getCachedQuiz, cacheQuiz } from '../services/quizCache.service.js';
import Module from '../models/Module.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Generate quiz for module using AI
 * GET /api/quiz/generate/:moduleId
 */
export const generateQuiz = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const {
      numQuestions = 5,
      difficulty = 'beginner',
      gradeLevel = 'all',
      useCache = true
    } = req.query;

    // Validate moduleId
    if (!moduleId) {
      return errorResponse(res, 'Module ID is required', 400);
    }

    // Get module
    const module = await Module.findById(moduleId);
    if (!module) {
      return errorResponse(res, 'Module not found', 404);
    }

    // Check cache first
    if (useCache === 'true' || useCache === true) {
      const cachedQuestions = await getCachedQuiz(moduleId, {
        numQuestions: parseInt(numQuestions),
        difficulty,
        gradeLevel
      });

      if (cachedQuestions) {
        logger.info(`Returning cached quiz for module: ${moduleId}`);
        return successResponse(res, {
          moduleId,
          questions: cachedQuestions,
          cached: true,
          numQuestions: cachedQuestions.length
        }, 'Quiz retrieved from cache');
      }
    }

    // Extract module text content for quiz generation
    let moduleText = '';

    // Extract text from structured content
    if (module.content && module.content.lessons) {
      moduleText = module.content.lessons
        .map(lesson => {
          return lesson.sections
            .filter(section => section.type === 'text')
            .map(section => {
              const content = section.content;
              return typeof content === 'string' ? content : JSON.stringify(content);
            })
            .join('\n\n');
        })
        .join('\n\n');
    }

    // Fallback to legacy text content
    if (!moduleText && module.content && module.content.text) {
      moduleText = module.content.text;
    }

    // Fallback to description
    if (!moduleText) {
      moduleText = module.description || module.title || '';
    }

    if (!moduleText || moduleText.trim().length < 50) {
      return errorResponse(
        res,
        'Module content is too short to generate a quiz. Minimum 50 characters required.',
        400
      );
    }

    logger.info(`Generating quiz for module: ${moduleId} (${moduleText.length} chars)`);

    // Generate quiz questions using AI
    const questions = await generateQuizQuestions(moduleText, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      gradeLevel
    });

    // Cache the generated quiz
    await cacheQuiz(moduleId, questions, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      gradeLevel
    });

    return successResponse(res, {
      moduleId,
      questions,
      cached: false,
      numQuestions: questions.length,
      difficulty,
      gradeLevel
    }, 'Quiz generated successfully');
  } catch (error) {
    logger.error('Quiz generation error:', error);
    
    if (error.message.includes('Gemini API key')) {
      return errorResponse(res, 'AI quiz generation is not configured. Please set GEMINI_API_KEY.', 503);
    }
    
    return errorResponse(res, error.message || 'Failed to generate quiz', 500);
  }
};

/**
 * Get cached quiz for module
 * GET /api/quiz/cached/:moduleId
 */
export const getCachedQuizForModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const {
      numQuestions = 5,
      difficulty = 'beginner',
      gradeLevel = 'all'
    } = req.query;

    const cachedQuestions = await getCachedQuiz(moduleId, {
      numQuestions: parseInt(numQuestions),
      difficulty,
      gradeLevel
    });

    if (!cachedQuestions) {
      return errorResponse(res, 'No cached quiz found for this module', 404);
    }

    return successResponse(res, {
      moduleId,
      questions: cachedQuestions,
      cached: true,
      numQuestions: cachedQuestions.length
    }, 'Cached quiz retrieved');
  } catch (error) {
    logger.error('Get cached quiz error:', error);
    return errorResponse(res, 'Failed to get cached quiz', 500);
  }
};

