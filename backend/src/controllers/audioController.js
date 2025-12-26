/**
 * Phase 3.1.3: Audio Controller
 * Handles audio file upload and retrieval
 */

import { uploadAudio, getAudioUrl, deleteAudioFile, audioFileExists } from '../services/audioService.js';
import Module from '../models/Module.js';
import { successResponse, errorResponse } from '../utils/response.js';
import logger from '../config/logger.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload audio file for module
 * POST /api/modules/:id/audio
 */
export const uploadModuleAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return errorResponse(res, 'No audio file uploaded', 400);
    }

    const module = await Module.findById(id);
    if (!module) {
      // Delete uploaded file if module doesn't exist
      await deleteAudioFile(file.filename);
      return errorResponse(res, 'Module not found', 404);
    }

    const audioUrl = getAudioUrl(file.filename);
    
    // Store audio URL in module (you can extend this to store in specific lesson/section)
    // For now, we'll just store it in the module metadata or content
    
    return successResponse(res, {
      audioUrl: audioUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype
    }, 'Audio file uploaded successfully', 201);
  } catch (error) {
    logger.error('Upload audio error:', error);
    if (req.file) {
      await deleteAudioFile(req.file.filename);
    }
    return errorResponse(res, 'Failed to upload audio file', 500);
  }
};

/**
 * Get audio file
 * GET /api/audio/:filename
 */
export const getAudioFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    if (!await audioFileExists(filename)) {
      return errorResponse(res, 'Audio file not found', 404);
    }

    const audioDir = path.join(__dirname, '../../uploads/audio');
    const filePath = path.join(audioDir, filename);
    
    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    logger.error('Get audio file error:', error);
    return errorResponse(res, 'Failed to retrieve audio file', 500);
  }
};

/**
 * Delete audio file
 * DELETE /api/audio/:filename
 */
export const deleteAudio = async (req, res) => {
  try {
    const { filename } = req.params;
    
    await deleteAudioFile(filename);
    
    return successResponse(res, null, 'Audio file deleted successfully');
  } catch (error) {
    logger.error('Delete audio error:', error);
    return errorResponse(res, 'Failed to delete audio file', 500);
  }
};

// Export multer middleware
export { uploadAudio };

