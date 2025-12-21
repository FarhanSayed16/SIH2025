/**
 * Get Device Token
 * Usage: node scripts/get-device-token.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Device from '../src/models/Device.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const DEVICE_ID = 'KAV-NODE-001';

async function getDeviceToken() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const device = await Device.findOne({ deviceId: DEVICE_ID });
    
    if (!device) {
      console.log(`❌ Device ${DEVICE_ID} not found!`);
      console.log('   Please register the device first.\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Device Found: ${DEVICE_ID}\n`);
    console.log('Device Details:');
    console.log(`  Device ID: ${device.deviceId}`);
    console.log(`  Device Name: ${device.deviceName}`);
    console.log(`  Device Type: ${device.deviceType}`);
    console.log(`  Status: ${device.status}`);
    console.log(`  Last Seen: ${device.lastSeen || 'Never'}`);
    
    if (device.deviceToken) {
      console.log(`\n🔑 Device Token:`);
      console.log(`  ${device.deviceToken}`);
      console.log(`\n✅ Use this token in your ESP32 code!`);
    } else {
      console.log(`\n⚠️  Device has no token!`);
      console.log('   Generating new token...');
      
      const { generateDeviceToken } = await import('../src/utils/helpers.js');
      device.deviceToken = generateDeviceToken();
      await device.save();
      
      console.log(`\n🔑 New Device Token:`);
      console.log(`  ${device.deviceToken}`);
      console.log(`\n✅ Token generated and saved!`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

getDeviceToken();

