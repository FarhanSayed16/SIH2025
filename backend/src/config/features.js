/**
 * Feature flags from environment (toggle without code changes).
 */

function parseBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  const v = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(v)) return true;
  if (['false', '0', 'no', 'off'].includes(v)) return false;
  return defaultValue;
}

/**
 * IoT sensors, telemetry, device alerts, and mesh hardware path.
 * Default: false — no ESP32/sensor traffic processed until you turn it on.
 */
export const isIotEnabled = () => parseBool(process.env.IOT_ENABLED, false);

/**
 * NDMA/IMD national feed polling. Default false — public feed URLs often fail and spam logs.
 */
export const isNdmaEnabled = () => parseBool(process.env.NDMA_ENABLED, false);

/**
 * Sensor device types (not class tablets / teacher devices).
 */
export const IOT_SENSOR_DEVICE_TYPES = [
  'multi-sensor',
  'fire-sensor',
  'flood-sensor',
  'motion-sensor',
  'temperature-sensor',
  'smoke-sensor',
  'panic-button',
  'siren',
  'led-strip',
];

export const isIotSensorDeviceType = (deviceType) =>
  IOT_SENSOR_DEVICE_TYPES.includes(deviceType);

export default {
  isIotEnabled,
  isIotSensorDeviceType,
  IOT_SENSOR_DEVICE_TYPES,
};
