/**
 * Phase 3.5.1: CDN Configuration
 * Centralized CDN URL management for static assets
 */

/**
 * CDN Configuration
 */
const cdnConfig = {
  enabled: process.env.CDN_ENABLED === 'true',
  url: process.env.CDN_URL || '',
  provider: process.env.CDN_PROVIDER || 'cloudflare',
  cloudflare: {
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN
  },
  cloudfront: {
    distributionId: process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID
  }
};

/**
 * Get CDN URL for a file path
 * @param {string} path - File path (relative or absolute)
 * @returns {string} CDN URL or original path
 */
export const getCDNUrl = (path) => {
  // Return original path if CDN not enabled or no URL configured
  if (!cdnConfig.enabled || !cdnConfig.url || !path) {
    return path;
  }
  
  // If path is already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Ensure CDN URL doesn't have trailing slash
  const cdnBase = cdnConfig.url.endsWith('/') 
    ? cdnConfig.url.slice(0, -1) 
    : cdnConfig.url;
  
  // Return CDN URL
  return `${cdnBase}/${cleanPath}`;
};

/**
 * Check if CDN is enabled
 * @returns {boolean}
 */
export const isCDNEnabled = () => {
  return cdnConfig.enabled && !!cdnConfig.url;
};

/**
 * Get CDN provider name
 * @returns {string}
 */
export const getCDNProvider = () => {
  return cdnConfig.provider;
};

export default cdnConfig;

