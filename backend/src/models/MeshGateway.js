/**
 * Phase 5.9: Mesh Gateway Model
 * Represents a gateway device (e.g., Raspberry Pi) that bridges mesh networks to internet
 */

import mongoose from 'mongoose';

const meshGatewaySchema = new mongoose.Schema(
  {
    gatewayId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    room: {
      type: String,
    },
    hardwareType: {
      type: String,
      enum: ['raspberry-pi', 'esp32-gateway', 'custom'],
      default: 'raspberry-pi',
    },
    meshProtocol: {
      type: String,
      enum: ['nearby-connections', 'ble-mesh', 'lora', 'wifi-direct'],
      default: 'nearby-connections',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance', 'offline'],
      default: 'active',
    },
    configuration: {
      meshRange: { type: Number, default: 100 }, // meters
      syncInterval: { type: Number, default: 30 }, // seconds
      maxNodes: { type: Number, default: 100 },
      powerLevel: { type: Number, default: 50 }, // 0-100%
    },
    statistics: {
      messagesBridged: { type: Number, default: 0 },
      bytesTransferred: { type: Number, default: 0 },
      lastSyncTime: { type: Date },
      uptime: { type: Number, default: 0 }, // seconds
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
meshGatewaySchema.index({ location: '2dsphere' });
meshGatewaySchema.index({ schoolId: 1, status: 1 });

const MeshGateway = mongoose.model('MeshGateway', meshGatewaySchema);

export default MeshGateway;

