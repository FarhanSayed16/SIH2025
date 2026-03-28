/**
 * Blueprint upload service
 * Handles blueprint image/PDF storage
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blueprintDir = path.join(__dirname, '../../uploads/blueprints');

fs.mkdir(blueprintDir, { recursive: true }).catch((err) => {
  logger.warn('Blueprint directory creation failed:', err.message);
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(blueprintDir, { recursive: true });
      cb(null, blueprintDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `blueprint-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPG, JPEG, or PDF are allowed.'), false);
  }
};

export const uploadBlueprint = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024 // 15MB limit
  },
  fileFilter
});

export const getBlueprintUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/blueprints/${filename}`;
};

export const getBlueprintPath = (filename) => {
  if (!filename) return null;
  return path.join(blueprintDir, filename);
};

export const deleteBlueprintFile = async (filename) => {
  try {
    if (!filename) return;
    const filePath = getBlueprintPath(filename);
    await fs.unlink(filePath);
    logger.info(`Blueprint file deleted: ${filename}`);
  } catch (error) {
    logger.warn(`Failed to delete blueprint file ${filename}:`, error.message);
  }
};

