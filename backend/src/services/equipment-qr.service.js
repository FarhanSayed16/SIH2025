/**
 * Safety Equipment QR Code Generation Service
 * Generates QR codes for safety equipment for quick lookup
 * Map Integration Plan - Phase 3
 */

import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import logger from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const qrCodeDir = path.join(__dirname, '../../uploads/qr-codes');

// Ensure directory exists
fs.mkdir(qrCodeDir, { recursive: true }).catch((err) => {
  logger.warn('QR code directory creation failed:', err.message);
});

/**
 * Generate QR code for safety equipment
 * @param {string} equipmentId - Equipment ID
 * @param {string} schoolId - School ID
 * @param {string} equipmentName - Equipment name (for display)
 * @returns {Promise<string>} QR code image URL
 */
export const generateEquipmentQRCode = async (equipmentId, schoolId, equipmentName = '') => {
  try {
    // Ensure directory exists
    await fs.mkdir(qrCodeDir, { recursive: true });

    // Create QR code data (JSON string with equipment info)
    const qrData = JSON.stringify({
      type: 'safety-equipment',
      equipmentId,
      schoolId,
      name: equipmentName,
      timestamp: Date.now()
    });

    // Generate QR code filename
    const filename = `equipment-${equipmentId}-${Date.now()}.png`;
    const filePath = path.join(qrCodeDir, filename);

    // Generate QR code image
    await QRCode.toFile(filePath, qrData, {
      errorCorrectionLevel: 'M',
      type: 'png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrCodeUrl = `/uploads/qr-codes/${filename}`;
    logger.info(`QR code generated for equipment: ${equipmentId}`);

    return qrCodeUrl;
  } catch (error) {
    logger.error('QR code generation error:', error);
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

/**
 * Generate QR code as data URL (base64) for immediate use
 * @param {string} equipmentId - Equipment ID
 * @param {string} schoolId - School ID
 * @param {string} equipmentName - Equipment name
 * @returns {Promise<string>} Base64 data URL
 */
export const generateEquipmentQRCodeDataURL = async (equipmentId, schoolId, equipmentName = '') => {
  try {
    const qrData = JSON.stringify({
      type: 'safety-equipment',
      equipmentId,
      schoolId,
      name: equipmentName,
      timestamp: Date.now()
    });

    const dataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return dataURL;
  } catch (error) {
    logger.error('QR code data URL generation error:', error);
    throw new Error(`Failed to generate QR code data URL: ${error.message}`);
  }
};

/**
 * Parse QR code data
 * @param {string} qrDataString - QR code data string
 * @returns {Object} Parsed QR code data
 */
export const parseQRCodeData = (qrDataString) => {
  try {
    const data = JSON.parse(qrDataString);
    if (data.type === 'safety-equipment') {
      return {
        type: data.type,
        equipmentId: data.equipmentId,
        schoolId: data.schoolId,
        name: data.name,
        timestamp: data.timestamp
      };
    }
    return null;
  } catch (error) {
    logger.warn('Invalid QR code data:', error.message);
    return null;
  }
};

