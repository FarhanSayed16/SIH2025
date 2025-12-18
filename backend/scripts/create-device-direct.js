/**
 * Create Device Directly (Bypass API)
 * Usage: node scripts/create-device-direct.js
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

const DEVICE_ID = 'KAV-NODE-001';
const DEVICE_NAME = 'Safety Node 001';
const INSTITUTION_ID = '6924de10a721bc018818253c';
const ROOM = 'Lab';

async function createDevice() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if device already exists
    let device = await Device.findOne({ deviceId: DEVICE_ID });
    
    if (device) {
      console.log(`⚠️  Device ${DEVICE_ID} already exists!`);
      
      // Generate token if missing
      if (!device.deviceToken) {
        console.log('   Generating device token...');
        device.deviceToken = generateDeviceToken();
        await device.save();
      }
      
      console.log(`\n✅ Device Details:`);
      console.log(`  Device ID: ${device.deviceId}`);
      console.log(`  Device Name: ${device.deviceName}`);
      console.log(`  Device Type: ${device.deviceType}`);
      console.log(`  Status: ${device.status}`);
      console.log(`\n🔑 Device Token:`);
      console.log(`  ${device.deviceToken}`);
      await mongoose.disconnect();
      return;
    }

    // Generate device token
    const deviceToken = generateDeviceToken();

    // Create device (without registrationToken to avoid unique constraint)
    device = await Device.create({
      deviceId: DEVICE_ID,
      deviceName: DEVICE_NAME,
      deviceType: 'multi-sensor',
      institutionId: INSTITUTION_ID,
      room: ROOM,
      deviceToken,
      registrationToken: null, // Explicitly set to null
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

    console.log('\n✅ Device created successfully!');
    console.log(`\nDevice Details:`);
    console.log(`  Device ID: ${device.deviceId}`);
    console.log(`  Device Name: ${device.deviceName}`);
    console.log(`  Device Type: ${device.deviceType}`);
    console.log(`  Institution ID: ${device.institutionId}`);
    console.log(`  Room: ${device.room}`);
    console.log(`  Status: ${device.status}`);
    console.log(`\n🔑 Device Token (SAVE THIS!):`);
    console.log(`  ${deviceToken}`);
    console.log(`\n✅ Device is ready! ESP32 will use this token automatically.`);

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code === 11000) {
      console.error('   Duplicate key error. Device might already exist with different field.');
      console.error('   Trying to find existing device...');
      
      const existing = await Device.findOne({ deviceId: DEVICE_ID });
      if (existing) {
        console.log(`\n✅ Found existing device!`);
        if (!existing.deviceToken) {
          existing.deviceToken = generateDeviceToken();
          await existing.save();
        }
        console.log(`🔑 Device Token: ${existing.deviceToken}`);
      }
    }
    await mongoose.disconnect();
    process.exit(1);
  }
}

createDevice();

