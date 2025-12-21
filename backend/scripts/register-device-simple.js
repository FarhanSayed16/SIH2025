/**
 * Simple IoT Device Registration Script
 * Usage: node scripts/register-device-simple.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Device from '../src/models/Device.js';
import { generateDeviceToken } from '../src/utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Device configuration
const DEVICE_ID = 'KAV-NODE-001';
const DEVICE_NAME = 'Safety Node 001';
const INSTITUTION_ID = '6924de10a721bc018818253c';
const ROOM = 'Lab';

async function registerDevice() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId: DEVICE_ID });
    if (existingDevice) {
      console.log(`⚠️  Device ${DEVICE_ID} already exists!`);
      console.log(`\nDevice Details:`);
      console.log(`  Device ID: ${existingDevice.deviceId}`);
      console.log(`  Device Name: ${existingDevice.deviceName}`);
      console.log(`  Device Type: ${existingDevice.deviceType}`);
      console.log(`  Status: ${existingDevice.status}`);
      console.log(`\n🔑 Device Token (USE THIS IN ESP32):`);
      console.log(`  ${existingDevice.deviceToken}`);
      console.log(`\n✅ Device is already registered!`);
      await mongoose.disconnect();
      return;
    }

    // Generate device token
    const deviceToken = generateDeviceToken();

    // Create device
    const device = await Device.create({
      deviceId: DEVICE_ID,
      deviceName: DEVICE_NAME,
      deviceType: 'multi-sensor',
      institutionId: INSTITUTION_ID,
      room: ROOM,
      deviceToken,
      configuration: {
        sensors: {
          fire: { enabled: true, pin: 35 },
          water: { enabled: true, pin: 33 },
          earthquake: { enabled: true }
        },
        thresholds: {
          waterWarning: 1500,
          waterDanger: 2000,
          earthquake: 2.5
        }
      },
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [0, 0]
      }
    });

    console.log('\n✅ Device registered successfully!');
    console.log(`\nDevice Details:`);
    console.log(`  Device ID: ${device.deviceId}`);
    console.log(`  Device Name: ${device.deviceName}`);
    console.log(`  Device Type: ${device.deviceType}`);
    console.log(`  Institution ID: ${device.institutionId}`);
    console.log(`  Room: ${device.room}`);
    console.log(`  Status: ${device.status}`);
    console.log(`\n🔑 Device Token (SAVE THIS!):`);
    console.log(`  ${deviceToken}`);
    console.log(`\n📝 This token will be stored automatically by ESP32 after first connection.`);
    console.log(`\n✅ Device is ready for ESP32 connection!`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`  - ${key}: ${error.errors[key].message}`);
      });
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

registerDevice();

