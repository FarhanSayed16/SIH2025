/**
 * Blueprint Image Processing Service
 * Handles image optimization, thumbnail generation, and processing
 * Map Integration Plan - Phase 1
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blueprintDir = path.join(__dirname, '../../uploads/blueprints');
const thumbnailDir = path.join(__dirname, '../../uploads/blueprints/thumbnails');

/**
 * Process uploaded blueprint image
 * - Validates format
 * - Resizes if too large
 * - Generates thumbnail
 * - Extracts dimensions
 * - Returns URLs
 */
export const processUploadedImage = async (filePath, originalFilename) => {
  try {
    // Ensure thumbnail directory exists
    await fs.mkdir(thumbnailDir, { recursive: true });

    // Get image metadata
    const metadata = await sharp(filePath).metadata();
    const { width, height, format } = metadata;

    // Validate format
    const allowedFormats = ['png', 'jpeg', 'jpg', 'webp'];
    if (!allowedFormats.includes(format)) {
      throw new Error(`Unsupported image format: ${format}. Allowed: ${allowedFormats.join(', ')}`);
    }

    // Resize if too large (max 10MB or 4000px on longest side)
    const maxDimension = 4000;
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const fileStats = await fs.stat(filePath);
    
    let processedPath = filePath;
    let processedWidth = width;
    let processedHeight = height;

    if (width > maxDimension || height > maxDimension || fileStats.size > maxFileSize) {
      logger.info(`Resizing blueprint image: ${width}x${height} (${(fileStats.size / 1024 / 1024).toFixed(2)}MB)`);
      
      const scale = Math.min(maxDimension / width, maxDimension / height);
      processedWidth = Math.round(width * scale);
      processedHeight = Math.round(height * scale);

      const resizedPath = path.join(blueprintDir, `resized-${path.basename(filePath)}`);
      await sharp(filePath)
        .resize(processedWidth, processedHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(resizedPath);

      // Replace original with resized
      await fs.unlink(filePath);
      await fs.rename(resizedPath, filePath);
      processedPath = filePath;
      
      logger.info(`Resized to: ${processedWidth}x${processedHeight}`);
    }

    // Generate thumbnail (500x500, maintaining aspect ratio)
    const thumbnailFilename = `thumb-${path.basename(filePath)}`;
    const thumbnailPath = path.join(thumbnailDir, thumbnailFilename);
    
    await sharp(processedPath)
      .resize(500, 500, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(thumbnailPath);

    const thumbnailUrl = `/uploads/blueprints/thumbnails/${thumbnailFilename}`;
    const imageUrl = `/uploads/blueprints/${path.basename(processedPath)}`;

    logger.info(`Blueprint processed: ${processedWidth}x${processedHeight}, thumbnail generated`);

    return {
      imageUrl,
      thumbnailUrl,
      width: processedWidth,
      height: processedHeight,
      originalWidth: width,
      originalHeight: height,
      format,
      fileSize: (await fs.stat(processedPath)).size
    };
  } catch (error) {
    logger.error('Blueprint image processing error:', error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

/**
 * Generate marker overlay image (optional - for printing/offline use)
 * Creates an image with markers baked in
 */
export const generateMarkerOverlay = async (blueprintUrl, markers) => {
  try {
    // This is an optional feature for future implementation
    // Would use sharp to composite markers onto blueprint image
    logger.info('Marker overlay generation not yet implemented');
    return null;
  } catch (error) {
    logger.error('Marker overlay generation error:', error);
    return null;
  }
};

/**
 * Get thumbnail URL for a blueprint
 */
export const getThumbnailUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const filename = path.basename(imageUrl);
  return `/uploads/blueprints/thumbnails/thumb-${filename}`;
};

