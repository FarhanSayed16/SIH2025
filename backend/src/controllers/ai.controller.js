import {
  analyzeHazard,
  checkEvacuationRoute,
  analyzeFloorPlan,
  scanDamage,
  describeImageForAccessibility,
  summariseDrill,
  getTodaysSafetyTip,
  answerSafetyQuestion,
  summariseIncidentReport,
  draftAlertMessage,
  draftCrisisParentMessage,
  summariseGuideline,
  getDrillFeedbackForStudent,
  recommendNextModule,
  suggestQuizDifficulty,
  translateSafetyText,
  simplifyContentForGrade,
  scenarioNext,
  generateReportCard,
  gameTurn,
  isGeminiQuotaError
} from '../services/ai.service.js';
import HazardReport from '../models/HazardReport.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

function isGeminiQuotaErrorLocal(error) {
  return isGeminiQuotaError(error);
}

function handleAiError(res, error, defaultMessage = 'Request failed') {
  if (isGeminiQuotaErrorLocal(error)) {
    logger.warn('Gemini quota/429:', error.message);
    return errorResponse(
      res,
      'AI is temporarily unavailable due to quota. Cached or practice content may still work. Try again in a minute.',
      503
    );
  }
  logger.error(defaultMessage, error);
  return errorResponse(res, error.message || defaultMessage, 500);
}

function getImageBase64AndMime(req) {
  const { image, mimeType = 'image/jpeg' } = req.body;
  if (!image) return { error: 'Image is required' };
  if (!image.startsWith('data:image/') && !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return { error: 'Invalid image format. Provide base64 encoded image' };
  }
  let imageBase64 = image;
  if (image.startsWith('data:image/')) {
    imageBase64 = image.split(',')[1];
  }
  return { imageBase64, mimeType };
}

/**
 * Analyze hazard in image
 * POST /api/ai/analyze
 */
export const analyzeHazardImage = async (req, res) => {
  try {
    const parsed = getImageBase64AndMime(req);
    if (parsed.error) return errorResponse(res, parsed.error, 400);

    const analysis = await analyzeHazard(parsed.imageBase64, parsed.mimeType);

    if (analysis.hazardDetected) {
      try {
        const hazardReport = await HazardReport.create({
          reportedBy: req.userId || null,
          institutionId: req.user?.institutionId || null,
          type: analysis.hazardType || 'other',
          imageUrl: null,
          location: req.user?.currentLocation || {
            type: 'Point',
            coordinates: [0, 0]
          },
          aiConfidence: analysis.confidence || 0.7,
          severity: analysis.severity || 'medium',
          description: analysis.description,
          recommendations: analysis.recommendations || [],
          status: 'pending',
          aiAnalysis: analysis
        });

        logger.info(`Hazard report created: ${hazardReport._id} (Type: ${analysis.hazardType})`);

        if (analysis.severity === 'high' || analysis.severity === 'critical') {
          const io = req.app.get('io');
          if (io && hazardReport.institutionId) {
            const { broadcastToSchool } = await import('../socket/rooms.js');
            broadcastToSchool(io, hazardReport.institutionId, 'CRISIS_ALERT', {
              type: 'hazard',
              hazardType: analysis.hazardType,
              severity: analysis.severity,
              description: analysis.description,
              location: hazardReport.location
            });
          }
        }

        return successResponse(res, {
          analysis,
          hazardReport: {
            id: hazardReport._id,
            status: hazardReport.status
          }
        }, 'Hazard detected and reported');
      } catch (saveError) {
        logger.error('Error saving hazard report:', saveError);
      }
    }

    return successResponse(res, { analysis }, 'Image analysis completed');
  } catch (error) {
    return handleAiError(res, error, 'AI analysis failed');
  }
};

export const checkEvacuationRouteHandler = async (req, res) => {
  try {
    const parsed = getImageBase64AndMime(req);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    const data = await checkEvacuationRoute(parsed.imageBase64, parsed.mimeType);
    return successResponse(res, data, 'Evacuation check completed');
  } catch (error) {
    return handleAiError(res, error, 'Evacuation check failed');
  }
};

export const analyzeFloorPlanHandler = async (req, res) => {
  try {
    const parsed = getImageBase64AndMime(req);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    const data = await analyzeFloorPlan(parsed.imageBase64, parsed.mimeType);
    return successResponse(res, data, 'Floor plan analysis completed');
  } catch (error) {
    return handleAiError(res, error, 'Floor plan analysis failed');
  }
};

export const scanDamageHandler = async (req, res) => {
  try {
    const parsed = getImageBase64AndMime(req);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    const data = await scanDamage(parsed.imageBase64, parsed.mimeType);
    return successResponse(res, data, 'Damage scan completed');
  } catch (error) {
    return handleAiError(res, error, 'Damage scan failed');
  }
};

export const describeImageHandler = async (req, res) => {
  try {
    const parsed = getImageBase64AndMime(req);
    if (parsed.error) return errorResponse(res, parsed.error, 400);
    const data = await describeImageForAccessibility(parsed.imageBase64, parsed.mimeType);
    return successResponse(res, data, 'Image described');
  } catch (error) {
    return handleAiError(res, error, 'Describe image failed');
  }
};

export const summariseDrillController = async (req, res) => {
  try {
    const data = await summariseDrill(req.body);
    return successResponse(res, data, 'Drill summarised');
  } catch (error) {
    return handleAiError(res, error, 'Drill summary failed');
  }
};

export const getTodaysTipController = async (req, res) => {
  try {
    const lang = req.query.lang || 'en';
    const data = await getTodaysSafetyTip(lang);
    return successResponse(res, data, 'Today tip');
  } catch (error) {
    return handleAiError(res, error, 'Tip failed');
  }
};

export const askKavachController = async (req, res) => {
  try {
    const { question, preferredResponseLang, lang } = req.body;
    const data = await answerSafetyQuestion(question, preferredResponseLang || lang);
    const msg = data.quotaLimited
      ? 'Using fallback while AI quota recovers'
      : 'Answer generated';
    return successResponse(res, data, msg);
  } catch (error) {
    return handleAiError(res, error, 'Answer failed');
  }
};

export const summariseIncidentReportController = async (req, res) => {
  try {
    const data = await summariseIncidentReport(req.body.text);
    return successResponse(res, data, 'Incident summarised');
  } catch (error) {
    return handleAiError(res, error, 'Incident summary failed');
  }
};

export const draftAlertMessageController = async (req, res) => {
  try {
    const data = await draftAlertMessage(req.body.type, req.body.severity);
    return successResponse(res, data, 'Alert drafted');
  } catch (error) {
    return handleAiError(res, error, 'Alert draft failed');
  }
};

export const crisisParentMessageController = async (req, res) => {
  try {
    const incidentType = req.body.incidentType || req.body.type;
    const desc = req.body.oneLineDescription || req.body.description;
    const data = await draftCrisisParentMessage(incidentType, req.body.severity, desc);
    return successResponse(res, data, 'Parent message drafted');
  } catch (error) {
    return handleAiError(res, error, 'Crisis parent message failed');
  }
};

export const summariseGuidelineController = async (req, res) => {
  try {
    const data = await summariseGuideline(req.body.text);
    return successResponse(res, data, 'Guideline summarised');
  } catch (error) {
    return handleAiError(res, error, 'Guideline summary failed');
  }
};

export const getDrillFeedbackController = async (req, res) => {
  try {
    const data = await getDrillFeedbackForStudent(req.body);
    return successResponse(res, data, 'Drill feedback');
  } catch (error) {
    return handleAiError(res, error, 'Drill feedback failed');
  }
};

export const recommendNextModuleController = async (req, res) => {
  try {
    const data = await recommendNextModule(req.body);
    return successResponse(res, data, 'Recommendation');
  } catch (error) {
    return handleAiError(res, error, 'Recommendation failed');
  }
};

export const suggestQuizDifficultyController = async (req, res) => {
  try {
    const data = await suggestQuizDifficulty(req.body);
    return successResponse(res, data, 'Difficulty suggested');
  } catch (error) {
    return handleAiError(res, error, 'Difficulty suggestion failed');
  }
};

export const translateController = async (req, res) => {
  try {
    const data = await translateSafetyText(req.body.text, req.body.targetLang);
    return successResponse(res, data, 'Translated');
  } catch (error) {
    return handleAiError(res, error, 'Translate failed');
  }
};

export const simplifyController = async (req, res) => {
  try {
    const age = req.body.ageOrGrade || req.body.gradeLevel;
    const data = await simplifyContentForGrade(req.body.text, age);
    return successResponse(res, data, 'Simplified');
  } catch (error) {
    return handleAiError(res, error, 'Simplify failed');
  }
};

export const scenarioNextController = async (req, res) => {
  try {
    const data = await scenarioNext(req.body);
    const msg = data.quotaLimited
      ? 'Practice scenario (AI quota paused)'
      : 'Scenario step';
    return successResponse(res, data, msg);
  } catch (error) {
    return handleAiError(res, error, 'Scenario failed');
  }
};

export const reportCardController = async (req, res) => {
  try {
    const data = await generateReportCard(req.body);
    return successResponse(res, data, 'Report card');
  } catch (error) {
    return handleAiError(res, error, 'Report card failed');
  }
};

export const gameTurnController = async (req, res) => {
  try {
    const data = await gameTurn({
      systemPrompt: req.body.systemPrompt,
      message: req.body.message,
      history: req.body.history
    });
    return successResponse(res, data, 'Game turn');
  } catch (error) {
    return handleAiError(res, error, 'Game turn failed');
  }
};
