/**
 * Phase 5.9: Mesh Gateway Service
 * Manages mesh gateway devices (Raspberry Pi, ESP32 gateways, etc.)
 */

import MeshGateway from '../models/MeshGateway.js';
import logger from '../config/logger.js';

/**
 * Register a mesh gateway
 * @param {Object} gatewayData - Gateway data
 * @returns {Promise<Object>} Created gateway
 */
export const registerGateway = async (gatewayData) => {
  try {
    const gateway = await MeshGateway.create({
      gatewayId: gatewayData.gatewayId,
      name: gatewayData.name,
      schoolId: gatewayData.schoolId,
      location: gatewayData.location,
      room: gatewayData.room,
      hardwareType: gatewayData.hardwareType || 'raspberry-pi',
      meshProtocol: gatewayData.meshProtocol || 'nearby-connections',
      configuration: gatewayData.configuration || {},
    });

    logger.info(`Mesh gateway registered: ${gateway.gatewayId} (${gateway.name})`);
    return gateway;
  } catch (error) {
    logger.error('Error registering mesh gateway:', error);
    throw error;
  }
};

/**
 * Update gateway statistics
 * @param {string} gatewayId - Gateway ID
 * @param {Object} stats - Statistics to update
 * @returns {Promise<Object>} Updated gateway
 */
export const updateGatewayStats = async (gatewayId, stats) => {
  try {
    const gateway = await MeshGateway.findOne({ gatewayId });
    if (!gateway) {
      throw new Error('Gateway not found');
    }

    if (stats.messagesBridged) {
      gateway.statistics.messagesBridged += stats.messagesBridged;
    }
    if (stats.bytesTransferred) {
      gateway.statistics.bytesTransferred += stats.bytesTransferred;
    }
    if (stats.lastSyncTime) {
      gateway.statistics.lastSyncTime = new Date(stats.lastSyncTime);
    }
    gateway.lastSeen = new Date();

    await gateway.save();
    return gateway;
  } catch (error) {
    logger.error('Error updating gateway stats:', error);
    throw error;
  }
};

/**
 * Get gateways for a school
 * @param {string} schoolId - School ID
 * @returns {Promise<Array>} Gateways
 */
export const getSchoolGateways = async (schoolId) => {
  try {
    const gateways = await MeshGateway.find({ schoolId })
      .sort({ createdAt: -1 })
      .lean();

    return gateways;
  } catch (error) {
    logger.error('Error getting school gateways:', error);
    throw error;
  }
};

/**
 * Get gateway by ID
 * @param {string} gatewayId - Gateway ID
 * @returns {Promise<Object>} Gateway
 */
export const getGatewayById = async (gatewayId) => {
  try {
    const gateway = await MeshGateway.findOne({ gatewayId }).lean();
    return gateway;
  } catch (error) {
    logger.error('Error getting gateway:', error);
    throw error;
  }
};

