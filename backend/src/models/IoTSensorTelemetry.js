/**
 * Phase 3.4.2: IoT Sensor Telemetry Model
 * Stores historical sensor data for IoT devices
 */

import mongoose from 'mongoose';

const iotSensorTelemetrySchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    index: true
  },
  institutionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true
  },
  sensorType: {
    type: String,
    required: true,
    enum: [
      'fire-sensor', 'flood-sensor', 'motion-sensor', 'temperature-sensor', 
      'smoke-sensor', 'panic-button', 'siren',
      // Phase 201: Multi-sensor IoT nodes
      'multi-sensor'
    ],
    index: true
  },
  // Sensor readings
  readings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Threshold breach status
  thresholdBreached: {
    type: Boolean,
    default: false,
    index: true
  },
  // Location if available
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
iotSensorTelemetrySchema.index({ deviceId: 1, timestamp: -1 });
iotSensorTelemetrySchema.index({ institutionId: 1, timestamp: -1 });
iotSensorTelemetrySchema.index({ sensorType: 1, timestamp: -1 });
iotSensorTelemetrySchema.index({ thresholdBreached: 1, timestamp: -1 });
// TTL index - auto-delete records older than 90 days
iotSensorTelemetrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

// Static method to get aggregated statistics
iotSensorTelemetrySchema.statics.getAggregatedStats = async function(deviceId, startDate, endDate) {
  const matchQuery = { deviceId };
  if (startDate || endDate) {
    matchQuery.timestamp = {};
    if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgTemperature: { $avg: '$readings.temperature' },
        maxTemperature: { $max: '$readings.temperature' },
        minTemperature: { $min: '$readings.temperature' },
        avgSmoke: { $avg: '$readings.smoke' },
        maxSmoke: { $max: '$readings.smoke' },
        thresholdBreaches: { $sum: { $cond: ['$thresholdBreached', 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    count: 0,
    avgTemperature: null,
    maxTemperature: null,
    minTemperature: null,
    avgSmoke: null,
    maxSmoke: null,
    thresholdBreaches: 0
  };
};

// Static method to get time-series data
iotSensorTelemetrySchema.statics.getTimeSeries = async function(deviceId, startDate, endDate, interval = 'hour') {
  const matchQuery = { deviceId };
  if (startDate || endDate) {
    matchQuery.timestamp = {};
    if (startDate) matchQuery.timestamp.$gte = new Date(startDate);
    if (endDate) matchQuery.timestamp.$lte = new Date(endDate);
  }

  let dateFormat;
  switch (interval) {
    case 'minute':
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:%M', date: '$timestamp' } };
      break;
    case 'hour':
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } };
      break;
    case 'day':
      dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } };
      break;
    default:
      dateFormat = { $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' } };
  }

  const timeSeries = await this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: dateFormat,
        avgTemperature: { $avg: '$readings.temperature' },
        maxTemperature: { $max: '$readings.temperature' },
        avgSmoke: { $avg: '$readings.smoke' },
        maxSmoke: { $max: '$readings.smoke' },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return timeSeries.map(item => ({
    timestamp: item._id,
    avgTemperature: item.avgTemperature,
    maxTemperature: item.maxTemperature,
    avgSmoke: item.avgSmoke,
    maxSmoke: item.maxSmoke,
    count: item.count
  }));
};

const IoTSensorTelemetry = mongoose.model('IoTSensorTelemetry', iotSensorTelemetrySchema);

export default IoTSensorTelemetry;

