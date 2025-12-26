import mongoose from 'mongoose';
import Module from '../models/Module.js';
import QuizResult from '../models/QuizResult.js';
import ModuleProgress from '../models/ModuleProgress.js';
import User from '../models/User.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * List modules
 * GET /api/modules
 * Phase 3.1.1: Enhanced with filtering, search, and categorization
 */
export const listModules = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      region, 
      category,
      difficulty,
      gradeLevel,
      tags,
      search,
      sortBy = 'order',
      sortOrder = 'asc'
    } = req.query;

    const query = { isActive: true };
    
    // Phase 3.1.1: Enhanced filtering
    if (type) query.type = type;
    if (region) query.region = region;
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (gradeLevel) {
      query.$or = [
        { gradeLevel: { $in: [gradeLevel, 'all'] } },
        { gradeLevel: { $exists: false } } // Legacy modules
      ];
    }
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }
    
    // Phase 3.1.1: Enhanced search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Phase 3.1.1: Enhanced sorting
    const sortOptions = {};
    if (sortBy === 'order') {
      sortOptions.order = sortOrder === 'desc' ? -1 : 1;
      sortOptions.createdAt = -1;
    } else if (sortBy === 'popularity') {
      sortOptions['stats.totalViews'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'completions') {
      sortOptions['stats.totalCompletions'] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const modules = await Module.find(query)
      .select('-quiz.questions.correctAnswer') // Don't expose answers, but keep quiz structure
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    // Ensure quiz questions are included (just without correctAnswer)
    // Mongoose select might exclude the entire quiz if not careful
    const modulesWithQuiz = modules.map(mod => {
      const modObj = mod.toObject();
      if (modObj.quiz && modObj.quiz.questions) {
        // Remove correctAnswer from each question if present
        modObj.quiz.questions = modObj.quiz.questions.map(q => {
          const { correctAnswer, ...questionWithoutAnswer } = q;
          return questionWithoutAnswer;
        });
      }
      return modObj;
    });

    const total = await Module.countDocuments(query);

    return paginatedResponse(res, modulesWithQuiz, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }, 'Modules retrieved successfully');
  } catch (error) {
    logger.error('List modules error:', error);
    return errorResponse(res, 'Failed to list modules', 500);
  }
};

/**
 * Get module by ID
 * GET /api/modules/:id
 * Phase 3.1.1: Enhanced with view tracking and version support
 */
export const getModuleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { version } = req.query; // Optional version parameter
    const includeAnswers = req.user?.role === 'admin' || req.user?.role === 'teacher';

    let module;
    if (version) {
      // Phase 3.1.1: Get specific version
      // Try to find by ID and version, but if not found, fall back to latest
      module = await Module.findOne({ _id: id, version });
      if (!module) {
        // If specific version not found, return latest version
        module = await Module.findById(id);
      }
    } else {
      module = await Module.findById(id);
    }

    if (!module) {
      return errorResponse(res, 'Module not found', 404);
    }

    // Phase 3.1.1: Increment view count (async, don't wait)
    module.incrementViews().catch(err => {
      logger.error('Failed to increment module views:', err);
    });

    // Don't expose correct answers to students
    if (!includeAnswers) {
      module = module.toObject();
      if (module.quiz && module.quiz.questions) {
        module.quiz.questions = module.quiz.questions.map(q => {
          const question = { ...q };
          delete question.correctAnswer;
          return question;
        });
      }
    }

    return successResponse(res, { module }, 'Module retrieved successfully');
  } catch (error) {
    logger.error('Get module error:', error);
    return errorResponse(res, 'Failed to get module', 500);
  }
};

/**
 * Submit quiz results
 * POST /api/modules/:id/complete
 */
export const completeModule = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers, timeTaken, isClassMode = false, classId = null } = req.body;

    // FIXED: Handle both MongoDB ObjectId and legacy string IDs (like 'flood', 'cyclone', etc.)
    let module;
    
    // First, try to find by MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      module = await Module.findById(id);
    }
    
    // If not found and id is not a valid ObjectId, try to find by type (for legacy modules)
    if (!module) {
      // Legacy modules use string IDs that match their type
      // Try to find module by type field
      module = await Module.findOne({ 
        type: id, 
        isActive: true 
      }).sort({ createdAt: -1 }); // Get most recent if multiple
    }
    
    // If still not found, try to find by title (case-insensitive partial match)
    if (!module) {
      module = await Module.findOne({ 
        title: { $regex: new RegExp(id, 'i') },
        isActive: true 
      }).sort({ createdAt: -1 });
    }

    if (!module) {
      return errorResponse(res, `Module not found: ${id}. Tried ObjectId, type, and title lookup.`, 404);
    }
    
    logger.info(`Module found: ${module._id} (lookup by: ${mongoose.Types.ObjectId.isValid(id) ? 'ObjectId' : 'type/title'})`);

    if (!module.quiz || !module.quiz.questions) {
      return errorResponse(res, 'Module has no quiz', 400);
    }

    // Process answers
    const processedAnswers = answers.map((answer, index) => {
      const question = module.quiz.questions[index];
      if (!question) {
        return null;
      }

      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;

      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points,
        timeTaken: answer.timeTaken || null
      };
    }).filter(Boolean);

    // Calculate score
    const totalPoints = processedAnswers.reduce((sum, a) => sum + a.points, 0);
    const maxPoints = module.quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const score = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
    const passed = score >= module.quiz.passingScore;

    // Create quiz result
    const quizResult = await QuizResult.create({
      userId: req.userId,
      moduleId: id,
      institutionId: req.user.institutionId,
      answers: processedAnswers,
      score,
      totalPoints,
      passed,
      timeTaken: timeTaken || null,
      synced: true // Already synced since it's coming from online
    });

    // Phase 3.1.1: Update module completion stats
    module.updateCompletionStats(score).catch(err => {
      logger.error('Failed to update module stats:', err);
    });

    // Update user progress if passed
    if (passed) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(req.userId);
      if (user && !user.progress.completedModules.includes(id)) {
        user.progress.completedModules.push(id);
        // Add badges
        if (module.badges && module.badges.length > 0) {
          module.badges.forEach(badge => {
            if (!user.progress.badges.includes(badge)) {
              user.progress.badges.push(badge);
            }
          });
        }
        await user.save();
      }
    }

    // Phase 3.3.2: Distribute shared XP if class mode
    if (isClassMode && classId && passed) {
      try {
        const { distributeSharedXP } = await import('../services/adaptiveScoring.service.js');
        // Calculate XP based on score (e.g., 100 points for passing)
        const xpAmount = Math.floor(score / 10); // Convert score percentage to XP
        distributeSharedXP(classId, id, xpAmount, {
          activityType: 'module',
          activityId: quizResult._id.toString()
        }).catch(err => {
          logger.warn('Failed to distribute shared XP:', err);
        });
      } catch (xpError) {
        logger.warn('Failed to distribute shared XP:', xpError);
        // Don't fail the request if XP distribution fails
      }
    }

    // Phase 3.3.1: Trigger preparedness score update (non-blocking)
    const { recalculateScore } = await import('../services/preparednessScore.service.js');
    recalculateScore(req.userId).catch(err => {
      logger.warn('Failed to update preparedness score after quiz:', err);
    });

    // Phase 3.3.3: Check and award badges (non-blocking)
    if (passed) {
      const { checkAndAwardBadges } = await import('../services/badge.service.js');
      checkAndAwardBadges(req.userId, 'module', {
        moduleId: id,
        score,
        category: module.category
      }).catch(err => {
        logger.warn('Failed to check badges after module completion:', err);
      });

      // Phase 3.3.4: Check and generate certificates (non-blocking)
      const { checkAndGenerateCertificates } = await import('../services/certificate.service.js');
      checkAndGenerateCertificates(req.userId, 'module_complete', {
        moduleId: id,
        moduleTitle: module.title,
        score
      }).catch(err => {
        logger.warn('Failed to check certificates after module completion:', err);
      });
    }

    logger.info(`Module completed: User ${req.userId} - Module ${id} - Score: ${score}% - Class Mode: ${isClassMode}`);

    return successResponse(res, {
      quizResult,
      score,
      passed,
      message: passed ? 'Congratulations! You passed the quiz.' : 'You did not pass. Try again!'
    }, 'Quiz submitted successfully');
  } catch (error) {
    logger.error('Complete module error:', error);
    return errorResponse(res, error.message || 'Failed to submit quiz', 400);
  }
};

/**
 * Track module/video progress
 * POST /api/modules/progress
 * Tracks video completion and module completion for NDRF, Hearing Impaired, and NDMA modules
 */
export const trackModuleProgress = async (req, res) => {
  try {
    const { moduleId, moduleType, language, videoId, action, totalVideos } = req.body;
    const userId = req.userId;

    if (!moduleId || !moduleType || !action) {
      return errorResponse(res, 'moduleId, moduleType, and action are required', 400);
    }

    if (!['ndma', 'ndrf', 'hearing_impaired'].includes(moduleType)) {
      return errorResponse(res, 'Invalid moduleType. Must be: ndma, ndrf, or hearing_impaired', 400);
    }

    // Restrict hearing_impaired modules to users with disabilities
    if (moduleType === 'hearing_impaired') {
      const user = await User.findById(userId).select('hasDisability disabilityType');
      if (!user || !user.hasDisability) {
        return errorResponse(
          res,
          'Access denied: Hearing impaired modules are only available for users with physical disabilities',
          403
        );
      }
      // Optional: Check if disability type matches (hearing_impaired)
      if (user.disabilityType && user.disabilityType !== 'hearing_impaired' && user.disabilityType !== 'other') {
        logger.warn(`User ${userId} with disability type ${user.disabilityType} accessing hearing_impaired modules`);
        // Allow access but log for monitoring
      }
    }

    if (!['video_complete', 'module_complete'].includes(action)) {
      return errorResponse(res, 'Invalid action. Must be: video_complete or module_complete', 400);
    }

    // Find or create module progress
    // FIXED: Ensure language is included in query for NDRF modules
    const query = { userId, moduleId, moduleType };
    if (language) {
      query.language = language;
    } else {
      // For NDMA modules, explicitly set language to null to match index
      query.language = null;
    }

    let moduleProgress = await ModuleProgress.findOne(query);

    if (!moduleProgress) {
      try {
        moduleProgress = new ModuleProgress({
          userId,
          moduleId,
          moduleType,
          language: language || null,
          completedVideos: [],
          isCompleted: false,
          pointsEarned: 0,
          xpEarned: 0
        });
      } catch (createError) {
        logger.error('Error creating ModuleProgress:', createError);
        // If creation fails due to duplicate, try to find existing one
        moduleProgress = await ModuleProgress.findOne(query);
        if (!moduleProgress) {
          throw createError;
        }
      }
    }

    let pointsEarned = 0;
    let xpEarned = 0;

    if (action === 'video_complete') {
      if (!videoId) {
        return errorResponse(res, 'videoId is required for video_complete action', 400);
      }

      // Mark video as completed
      moduleProgress.markVideoCompleted(videoId);

      // Award points for video completion
      // NDRF and Hearing Impaired: 10 points per video
      // NDMA: 5 points per video
      pointsEarned = moduleType === 'ndma' ? 5 : 10;
      xpEarned = pointsEarned; // 1:1 conversion

      moduleProgress.pointsEarned += pointsEarned;
      moduleProgress.xpEarned += xpEarned;

      // Check if all videos are completed
      if (totalVideos && moduleProgress.completedVideos.length >= totalVideos) {
        // Mark module as completed
        moduleProgress.isCompleted = true;
        moduleProgress.completedAt = new Date();

        // Award completion bonus
        const completionBonus = 50;
        moduleProgress.pointsEarned += completionBonus;
        moduleProgress.xpEarned += completionBonus;
        pointsEarned += completionBonus;
        xpEarned += completionBonus;
      }
    } else if (action === 'module_complete') {
      // Mark module as completed
      moduleProgress.isCompleted = true;
      moduleProgress.completedAt = new Date();

      // Award completion bonus if not already completed
      if (!moduleProgress.isCompleted) {
        const completionBonus = 50;
        moduleProgress.pointsEarned += completionBonus;
        moduleProgress.xpEarned += completionBonus;
        pointsEarned = completionBonus;
        xpEarned = completionBonus;
      }
    }

    // Save module progress with error handling for duplicate key errors
    try {
      await moduleProgress.save();
      logger.info(`✅ Module progress saved: ${moduleType} - ${moduleId} - Language: ${language || 'N/A'}`);
    } catch (saveError) {
      // If save fails due to duplicate key error, try to find and update existing
      if (saveError.code === 11000 || (saveError.name === 'MongoServerError' && saveError.message?.includes('duplicate key'))) {
        logger.warn(`Duplicate key error detected, attempting to find existing progress: ${saveError.message}`);
        const existingProgress = await ModuleProgress.findOne(query);
        if (existingProgress) {
          // Update existing progress instead of creating new
          if (action === 'video_complete' && videoId) {
            existingProgress.markVideoCompleted(videoId);
            existingProgress.pointsEarned += pointsEarned;
            existingProgress.xpEarned += xpEarned;
            if (totalVideos && existingProgress.completedVideos.length >= totalVideos) {
              existingProgress.isCompleted = true;
              existingProgress.completedAt = new Date();
            }
          } else if (action === 'module_complete') {
            existingProgress.isCompleted = true;
            existingProgress.completedAt = new Date();
          }
          await existingProgress.save();
          moduleProgress = existingProgress;
          logger.info(`✅ Updated existing module progress: ${moduleType} - ${moduleId}`);
        } else {
          logger.error('Duplicate key error but existing progress not found:', saveError);
          throw saveError;
        }
      } else {
        logger.error('Error saving module progress:', saveError);
        throw saveError;
      }
    }

    // Update user's total points and XP
    const user = await User.findById(userId);
    if (user) {
      user.progress = user.progress || {};
      user.progress.points = (user.progress.points || 0) + pointsEarned;
      user.progress.xp = (user.progress.xp || 0) + xpEarned;
      user.progress.totalXP = (user.progress.totalXP || 0) + xpEarned;
      
      // Calculate level from totalXP: Level = floor(sqrt(totalXP / 100)) + 1
      if (user.progress.totalXP) {
        user.progress.level = Math.floor(Math.sqrt(user.progress.totalXP / 100)) + 1;
      }
      
      await user.save();
    }

    // Trigger preparedness score update (non-blocking)
    const { recalculateScore } = await import('../services/preparednessScore.service.js');
    recalculateScore(userId).catch(err => {
      logger.warn('Failed to update preparedness score after module progress:', err);
    });

    logger.info(`Module progress tracked: User ${userId} - ${moduleType} - ${moduleId} - Action: ${action}`);

    return successResponse(res, {
      moduleProgress: {
        moduleId: moduleProgress.moduleId,
        moduleType: moduleProgress.moduleType,
        language: moduleProgress.language,
        completedVideos: moduleProgress.completedVideos,
        isCompleted: moduleProgress.isCompleted,
        progressPercentage: totalVideos 
          ? moduleProgress.calculateProgress(totalVideos)
          : 0,
        pointsEarned: moduleProgress.pointsEarned,
        xpEarned: moduleProgress.xpEarned,
        completedAt: moduleProgress.completedAt
      },
      pointsEarned,
      xpEarned
    }, 'Module progress tracked successfully');
  } catch (error) {
    logger.error('Track module progress error:', error);
    return errorResponse(res, error.message || 'Failed to track module progress', 500);
  }
};

/**
 * Get module progress
 * GET /api/modules/progress/:moduleId
 */
export const getModuleProgress = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { moduleType, language } = req.query;
    const userId = req.userId;

    if (!moduleType) {
      return errorResponse(res, 'moduleType query parameter is required', 400);
    }

    const query = { userId, moduleId, moduleType };
    if (language) query.language = language;

    const moduleProgress = await ModuleProgress.findOne(query);

    if (!moduleProgress) {
      return successResponse(res, {
        moduleProgress: null,
        progressPercentage: 0,
        isCompleted: false
      }, 'No progress found for this module');
    }

    // Get total videos count (this would need to be passed or fetched)
    // For now, return what we have
    return successResponse(res, {
      moduleProgress: {
        moduleId: moduleProgress.moduleId,
        moduleType: moduleProgress.moduleType,
        language: moduleProgress.language,
        completedVideos: moduleProgress.completedVideos,
        isCompleted: moduleProgress.isCompleted,
        pointsEarned: moduleProgress.pointsEarned,
        xpEarned: moduleProgress.xpEarned,
        completedAt: moduleProgress.completedAt,
        lastUpdated: moduleProgress.lastUpdated
      }
    }, 'Module progress retrieved successfully');
  } catch (error) {
    logger.error('Get module progress error:', error);
    return errorResponse(res, error.message || 'Failed to get module progress', 500);
  }
};

/**
 * Get user's overall progress
 * GET /api/users/:userId/progress
 */
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.userId;

    // Users can only view their own progress (unless admin/teacher)
    if (requestingUserId !== userId && req.user?.role !== 'admin' && req.user?.role !== 'teacher') {
      return errorResponse(res, 'Unauthorized to view this user\'s progress', 403);
    }

    // Get completion stats by module type
    const stats = await ModuleProgress.getCompletionStats(userId);

    // Get NDMA modules (from User.progress.completedModules)
    const user = await User.findById(userId).select('progress');
    const ndmaCompleted = user?.progress?.completedModules?.length || 0;

    // Get total modules count (this is approximate, would need proper counting)
    const totalNdma = await Module.countDocuments({ isActive: true, type: { $exists: true } });

    // Format stats
    const formattedStats = {
      ndma: {
        completed: ndmaCompleted,
        total: totalNdma,
        percentage: totalNdma > 0 ? Math.round((ndmaCompleted / totalNdma) * 100) : 0
      },
      ndrf: {
        completed: 0,
        total: 0,
        percentage: 0
      },
      hearing_impaired: {
        completed: 0,
        total: 0,
        percentage: 0
      },
      overall: {
        completed: ndmaCompleted,
        total: totalNdma,
        percentage: totalNdma > 0 ? Math.round((ndmaCompleted / totalNdma) * 100) : 0
      }
    };

    // Update from stats
    stats.forEach(stat => {
      if (stat._id === 'ndrf') {
        formattedStats.ndrf.completed = stat.completed;
        formattedStats.ndrf.total = stat.total;
        formattedStats.ndrf.percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      } else if (stat._id === 'hearing_impaired') {
        formattedStats.hearing_impaired.completed = stat.completed;
        formattedStats.hearing_impaired.total = stat.total;
        formattedStats.hearing_impaired.percentage = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
      }
    });

    // Recalculate overall
    formattedStats.overall.completed = 
      formattedStats.ndma.completed + 
      formattedStats.ndrf.completed + 
      formattedStats.hearing_impaired.completed;
    formattedStats.overall.total = 
      formattedStats.ndma.total + 
      formattedStats.ndrf.total + 
      formattedStats.hearing_impaired.total;
    formattedStats.overall.percentage = formattedStats.overall.total > 0
      ? Math.round((formattedStats.overall.completed / formattedStats.overall.total) * 100)
      : 0;

    return successResponse(res, {
      progress: formattedStats,
      user: {
        points: user?.progress?.points || 0,
        xp: user?.progress?.xp || 0,
        totalXP: user?.progress?.totalXP || 0,
        level: user?.progress?.level || 1
      }
    }, 'User progress retrieved successfully');
  } catch (error) {
    logger.error('Get user progress error:', error);
    return errorResponse(res, error.message || 'Failed to get user progress', 500);
  }
};
