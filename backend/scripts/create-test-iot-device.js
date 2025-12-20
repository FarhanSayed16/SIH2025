/**
 * Create Test IoT Device for Phase 4.3 Testing
 * 
 * This script creates an IoT device directly in MongoDB with a deviceToken
 * for testing the IoT alert endpoint.
 * 
 * Usage:
 *   node backend/scripts/create-test-iot-device.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Device from '../src/models/Device.js';
import { generateDeviceToken } from '../src/utils/helpers.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

async function createTestDevice() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Get institution ID from command line or use default
    const institutionId = process.argv[2] || null;
    
    if (!institutionId) {
      console.log('⚠️  No institution ID provided. Searching for existing schools...');
      const School = (await import('../src/models/School.js')).default;
      const schools = await School.find().limit(1);
      
      if (schools.length === 0) {
        console.error('❌ No schools found in database. Please seed the database first or provide institution ID as argument.');
        process.exit(1);
      }
      
      const schoolId = schools[0]._id.toString();
      console.log(`✅ Using school: ${schools[0].name} (${schoolId})\n`);
      
      // Create device
      const deviceId = `test-iot-device-${Date.now()}`;
      const deviceToken = generateDeviceToken();
      
      // Check if device already exists
      const existingDevice = await Device.findOne({ deviceId });
      if (existingDevice) {
        console.log(`⚠️  Device ${deviceId} already exists. Using existing device...`);
        if (existingDevice.deviceToken) {
          console.log(`✅ Found existing device with token: ${existingDevice.deviceToken.substring(0, 20)}...\n`);
          console.log('🔑 Device Token (use this for authentication):');
          console.log(`   ${existingDevice.deviceToken}\n`);
          await mongoose.disconnect();
          process.exit(0);
        } else {
          // Update existing device with token
          existingDevice.deviceToken = deviceToken;
          await existingDevice.save();
          console.log(`✅ Updated existing device with token: ${deviceToken.substring(0, 20)}...\n`);
        }
      } else {
        // Create new device - use lean() to avoid schema default for registrationToken
        const deviceData = {
          deviceId: deviceId,
          deviceName: 'Test IoT Alert Device',
          deviceType: 'fire-sensor',
          institutionId: schoolId,
          deviceToken: deviceToken,
          status: 'active',
          location: {
            type: 'Point',
            coordinates: [77.2090, 28.6139]
          },
          room: 'Main-Building-2-201'
        };
        
        // Only set registrationToken if we need to avoid null conflict
        // For IoT devices, we don't need registrationToken, so we'll generate a unique one
        const crypto = await import('crypto');
        deviceData.registrationToken = crypto.randomBytes(16).toString('hex');
        
        const device = await Device.create(deviceData);
        
        console.log('✅ Test IoT Device Created Successfully!\n');
        console.log('📋 Device Details:');
        console.log(`   Device ID: ${device.deviceId}`);
        console.log(`   Device Name: ${device.deviceName}`);
        console.log(`   Device Type: ${device.deviceType}`);
        console.log(`   Institution ID: ${device.institutionId}`);
        console.log(`   Status: ${device.status}\n`);
        console.log('🔑 Device Token (use this for authentication):');
        console.log(`   ${deviceToken}\n`);
        console.log('📝 Use this token in your test requests:');
        console.log(`   Authorization: Bearer ${deviceToken}\n`);
      }
      
      await mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
      process.exit(0);
      
    } else {
      // Use provided institution ID
      const deviceId = `test-iot-device-${Date.now()}`;
      const deviceToken = generateDeviceToken();
      
      // Check if device already exists
      const existingDevice = await Device.findOne({ deviceId });
      if (existingDevice && existingDevice.deviceToken) {
        console.log(`⚠️  Device ${deviceId} already exists with token: ${existingDevice.deviceToken.substring(0, 20)}...\n`);
        console.log('🔑 Device Token (use this for authentication):');
        console.log(`   ${existingDevice.deviceToken}\n`);
        await mongoose.disconnect();
        process.exit(0);
      }
      
      // Create new device
      const crypto = await import('crypto');
      const deviceData = {
        deviceId: deviceId,
        deviceName: 'Test IoT Alert Device',
        deviceType: 'fire-sensor',
        institutionId: institutionId,
        deviceToken: deviceToken,
        registrationToken: crypto.randomBytes(16).toString('hex'), // Generate unique token to avoid null conflict
        status: 'active',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139]
        },
        room: 'Main-Building-2-201'
      };
      
      const device = await Device.create(deviceData);
      
      console.log('✅ Test IoT Device Created Successfully!\n');
      console.log('📋 Device Details:');
      console.log(`   Device ID: ${device.deviceId}`);
      console.log(`   Device Token: ${deviceToken}\n`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test device:', error.message);
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createTestDevice();

