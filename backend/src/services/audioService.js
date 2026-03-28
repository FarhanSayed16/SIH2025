/**
 * Phase 3.1.3: Audio Service
 * Handles audio file storage and retrieval for modules
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '../../uploads/audio');
fs.mkdir(audioDir, { recursive: true }).catch(err => {
  logger.warn('Audio directory creation failed:', err.message);
});

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(audioDir, { recursive: true });
      cb(null, audioDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `audio-${uniqueSuffix}${ext}`);
  }
});

// File filter for audio files only
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files (MP3, WAV, OGG, WEBM) are allowed.'), false);
  }
};

// Configure upload middleware
export const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: fileFilter
});

/**
 * Get audio file URL
 */
export const getAudioUrl = (filename) => {
  if (!filename) return null;
  // Return relative URL - will be served as static file
  return `/uploads/audio/${filename}`;
};

/**
 * Get full audio file path
 */
export const getAudioPath = (filename) => {
  if (!filename) return null;
  return path.join(audioDir, filename);
};

/**
 * Delete audio file
 */
export const deleteAudioFile = async (filename) => {
  try {
    if (!filename) return;
    const filePath = getAudioPath(filename);
    await fs.unlink(filePath);
    logger.info(`Audio file deleted: ${filename}`);
  } catch (error) {
    // File might not exist, log but don't throw
    logger.warn(`Failed to delete audio file ${filename}:`, error.message);
  }
};

/**
 * Check if audio file exists
 */
export const audioFileExists = async (filename) => {
  try {
    if (!filename) return false;
    const filePath = getAudioPath(filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

