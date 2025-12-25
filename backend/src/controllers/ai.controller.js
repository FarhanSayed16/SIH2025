import { analyzeHazard } from '../services/ai.service.js';
import HazardReport from '../models/HazardReport.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';

/**
 * Analyze hazard in image (Add-on 3: AI Proxy)
 * POST /api/ai/analyze
 */
export const analyzeHazardImage = async (req, res) => {
  try {
    const { image, mimeType = 'image/jpeg' } = req.body;

    if (!image) {
      return errorResponse(res, 'Image is required', 400);
    }

    // Validate base64 image
    if (!image.startsWith('data:image/') && !/^[A-Za-z0-9+/=]+$/.test(image)) {
      return errorResponse(res, 'Invalid image format. Provide base64 encoded image', 400);
    }

    // Extract base64 data (remove data URL prefix if present)
    let imageBase64 = image;
    if (image.startsWith('data:image/')) {
      imageBase64 = image.split(',')[1];
    }

    // Analyze image
    const analysis = await analyzeHazard(imageBase64, mimeType);

    // Save hazard report if hazard detected
    if (analysis.hazardDetected) {
      try {
        const hazardReport = await HazardReport.create({
          reportedBy: req.userId || null,
          institutionId: req.user?.institutionId || null,
          type: analysis.hazardType || 'other',
          imageUrl: null, // Can store image URL if uploaded to S3
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

        // Emit Socket.io event if hazard is high severity
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
        // Still return analysis even if save fails
      }
    }

    return successResponse(res, {
      analysis
    }, 'Image analysis completed');
  } catch (error) {
    logger.error('AI analyze error:', error);
    return errorResponse(res, error.message || 'AI analysis failed', 500);
  }
};

