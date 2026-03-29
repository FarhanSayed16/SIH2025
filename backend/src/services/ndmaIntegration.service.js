/**
 * Phase 4.10: NDMA/IMD National CAP Integration Service
 * Polls national alert feeds and processes alerts
 */

import axios from 'axios';
import xml2js from 'xml2js';
import School from '../models/School.js';
import { processNDMAAlert } from './alertPipeline.service.js';
import logger from '../config/logger.js';
import { calculateDistance } from '../utils/geospatial.js';

// NDMA/IMD feed URLs (replace with actual URLs)
const NDMA_FEED_URL = process.env.NDMA_FEED_URL || 'https://ndma.gov.in/rss-feeds';
const IMD_FEED_URL = process.env.IMD_FEED_URL || 'https://mausam.imd.gov.in/rss-feed';

/**
 * Parse CAP (Common Alerting Protocol) XML/JSON
 * @param {String} capData - CAP XML or JSON string
 * @returns {Promise<Array>} - Parsed alert objects
 */
export const parseCAPFeed = async (capData, format = 'xml') => {
  try {
    if (format === 'json') {
      return JSON.parse(capData);
    }

    // Parse XML
    const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
    const result = await parser.parseStringPromise(capData);

    // Extract alerts from CAP feed
    const alerts = [];
    
    // Handle RSS/Atom feed format
    if (result.rss?.channel?.item) {
      const items = Array.isArray(result.rss.channel.item) 
        ? result.rss.channel.item 
        : [result.rss.channel.item];
      
      for (const item of items) {
        try {
          const alert = {
            capId: item.guid?._ || item.guid || item.id || null,
            title: item.title || item.description?.substring(0, 100) || 'NDMA Alert',
            description: item.description || item.content || item.summary || '',
            publishedAt: item.pubDate || item.published || new Date().toISOString(),
            link: item.link || null,
            category: item.category || 'other',
            severity: extractSeverity(item),
            type: extractAlertType(item),
            location: extractLocation(item),
            geofence: extractGeofence(item)
          };
          alerts.push(alert);
        } catch (parseError) {
          logger.warn('Error parsing feed item:', parseError);
        }
      }
    }

    return alerts;
  } catch (error) {
    logger.error('Error parsing CAP feed:', error);
    throw error;
  }
};

/**
 * Extract severity from feed item
 * @param {Object} item - Feed item
 * @returns {String} - Severity level
 */
const extractSeverity = (item) => {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  
  if (text.includes('critical') || text.includes('extreme')) {
    return 'critical';
  }
  if (text.includes('high') || text.includes('severe')) {
    return 'high';
  }
  if (text.includes('medium') || text.includes('moderate')) {
    return 'medium';
  }
  
  return 'high'; // Default to high for safety
};

/**
 * Extract alert type from feed item
 * @param {Object} item - Feed item
 * @returns {String} - Alert type
 */
const extractAlertType = (item) => {
  const text = `${item.title || ''} ${item.description || ''}`.toLowerCase();
  
  if (text.includes('fire')) return 'fire';
  if (text.includes('earthquake') || text.includes('quake')) return 'earthquake';
  if (text.includes('flood') || text.includes('inundation')) return 'flood';
  if (text.includes('cyclone') || text.includes('storm')) return 'cyclone';
  if (text.includes('medical')) return 'medical';
  
  return 'other';
};

/**
 * Extract location from feed item
 * @param {Object} item - Feed item
 * @returns {Object|null} - GeoJSON Point or null
 */
const extractLocation = (item) => {
  // Try to extract coordinates from description or geo fields
  // This is a simplified version - actual implementation would parse CAP geometry
  const geoPattern = /(\d+\.?\d*)[,\s]+(\d+\.?\d*)/g;
  const text = item.description || item.title || '';
  const match = geoPattern.exec(text);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        type: 'Point',
        coordinates: [lng, lat] // GeoJSON format: [longitude, latitude]
      };
    }
  }
  
  return null;
};

/**
 * Extract geofence area from feed item
 * @param {Object} item - Feed item
 * @returns {Object|null} - Geofence polygon or null
 */
const extractGeofence = (item) => {
  // Simplified - would parse CAP polygon/circle geometry in production
  return null;
};

/**
 * Check if school location is within alert geofence
 * @param {Object} school - School document with location
 * @param {Object} alertLocation - Alert location (GeoJSON Point)
 * @param {Object} alertGeofence - Alert geofence area
 * @param {Number} maxRadiusKm - Maximum radius in km (default: 50km)
 * @returns {Boolean} - True if school is affected
 */
export const checkGeofenceMatch = (school, alertLocation, alertGeofence = null, maxRadiusKm = 50) => {
  try {
    if (!school.location || !school.location.coordinates || !alertLocation || !alertLocation.coordinates) {
      return false;
    }

    const schoolCoords = school.location.coordinates; // [lng, lat]
    const alertCoords = alertLocation.coordinates; // [lng, lat]

    // Calculate distance in meters, then convert to kilometers
    const distanceMeters = calculateDistance(
      schoolCoords[1], // lat
      schoolCoords[0], // lng
      alertCoords[1], // lat
      alertCoords[0] // lng
    );

    const distanceKm = distanceMeters / 1000; // Convert to kilometers

    // Check if within radius
    return distanceKm <= maxRadiusKm;
  } catch (error) {
    logger.error('Error checking geofence match:', error);
    return false;
  }
};

/**
 * Fetch and process NDMA/IMD feeds
 * @returns {Promise<Array>} - Processed alerts
 */
export const fetchNDMAFeeds = async () => {
  try {
    const alerts = [];

    // Fetch NDMA feed
    try {
      const ndmaResponse = await axios.get(NDMA_FEED_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Kavach-Alert-System/1.0'
        }
      });
      
      const ndmaAlerts = await parseCAPFeed(ndmaResponse.data, 'xml');
      alerts.push(...ndmaAlerts.map(alert => ({ ...alert, feedSource: 'ndma' })));
      
      logger.info(`Fetched ${ndmaAlerts.length} alerts from NDMA feed`);
    } catch (ndmaError) {
      logger.warn('Failed to fetch NDMA feed:', ndmaError.message);
    }

    // Fetch IMD feed
    try {
      const imdResponse = await axios.get(IMD_FEED_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Kavach-Alert-System/1.0'
        }
      });
      
      const imdAlerts = await parseCAPFeed(imdResponse.data, 'xml');
      alerts.push(...imdAlerts.map(alert => ({ ...alert, feedSource: 'imd' })));
      
      logger.info(`Fetched ${imdAlerts.length} alerts from IMD feed`);
    } catch (imdError) {
      logger.warn('Failed to fetch IMD feed:', imdError.message);
    }

    return alerts;
  } catch (error) {
    logger.error('Error fetching NDMA/IMD feeds:', error);
    throw error;
  }
};

/**
 * Process NDMA alerts and create alerts for affected schools
 * @returns {Promise<Object>} - Processing results
 */
export const processNDMAAlerts = async () => {
  try {
    logger.info('🔄 Starting NDMA/IMD alert processing...');

    // Fetch alerts from feeds
    const feedAlerts = await fetchNDMAFeeds();

    if (feedAlerts.length === 0) {
      logger.info('No alerts found in feeds');
      return {
        processed: 0,
        created: 0,
        skipped: 0,
        errors: 0
      };
    }

    // Filter only HIGH/CRITICAL severity alerts
    const highSeverityAlerts = feedAlerts.filter(alert => 
      alert.severity === 'high' || alert.severity === 'critical'
    );

    logger.info(`Found ${highSeverityAlerts.length} high/critical severity alerts`);

    // Get all schools with locations
    const schools = await School.find({
      location: { $exists: true, $ne: null },
      'location.coordinates': { $exists: true }
    }).select('_id location name address');

    logger.info(`Checking ${schools.length} schools for alert matches`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    // Process each alert
    for (const feedAlert of highSeverityAlerts) {
      if (!feedAlert.location) {
        skipped++;
        continue; // Skip alerts without location
      }

      // Check each school
      for (const school of schools) {
        try {
          const isAffected = checkGeofenceMatch(
            school,
            feedAlert.location,
            feedAlert.geofence,
            50 // 50km radius
          );

          if (isAffected) {
            // Create alert for this school
            const alertData = {
              institutionId: school._id,
              type: feedAlert.type,
              severity: feedAlert.severity,
              title: `${feedAlert.title} - NDMA/IMD Alert`,
              description: feedAlert.description || `National alert: ${feedAlert.title}`,
              location: feedAlert.location,
              capId: feedAlert.capId,
              feedSource: feedAlert.feedSource,
              publishedAt: feedAlert.publishedAt
            };

            await processNDMAAlert({
              ...alertData,
              geofenceMatch: true,
              originalSeverity: feedAlert.severity
            });

            created++;
            logger.info(`✅ Created alert for school ${school.name} (${school._id}) from ${feedAlert.feedSource} alert`);
          }
        } catch (schoolError) {
          errors++;
          logger.error(`Error processing alert for school ${school._id}:`, schoolError);
        }
      }
    }

    const result = {
      processed: highSeverityAlerts.length,
      created,
      skipped,
      errors,
      schoolsChecked: schools.length
    };

    logger.info(`✅ NDMA/IMD processing complete: ${created} alerts created, ${skipped} skipped, ${errors} errors`);

    return result;
  } catch (error) {
    logger.error('Error processing NDMA alerts:', error);
    throw error;
  }
};

/**
 * Start NDMA polling cron job (runs every 5 minutes)
 * @returns {Function} - Stop function
 */
export const startNDMAPolling = () => {
  let intervalId = null;
  let isRunning = false;

  const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const poll = async () => {
    if (isRunning) {
      logger.warn('NDMA polling already in progress, skipping...');
      return;
    }

    try {
      isRunning = true;
      await processNDMAAlerts();
    } catch (error) {
      logger.error('Error in NDMA polling:', error);
    } finally {
      isRunning = false;
    }
  };

  // Start polling
  intervalId = setInterval(poll, POLLING_INTERVAL);
  
  // Run immediately on startup (after 30 seconds delay)
  setTimeout(poll, 30000);

  logger.info(`🔄 NDMA/IMD polling started (every ${POLLING_INTERVAL / 1000}s)`);

  // Return stop function
  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      logger.info('🛑 NDMA/IMD polling stopped');
    }
  };
};

