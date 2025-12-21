/**
 * Helper Script: Register IoT Device
 * 
 * Usage:
 *   node scripts/register-iot-device.js <admin-email> <admin-password> <device-id> <device-name> <institution-id> [room]
 * 
 * Example:
 *   node scripts/register-iot-device.js admin@school.com password123 KAV-NODE-001 "Chemistry Lab Node" 507f1f77bcf86cd799439011 "Chemistry Lab"
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Device from '../src/models/Device.js';
import { generateDeviceToken } from '../src/utils/helpers.js';
import logger from '../src/config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const args = process.argv.slice(2);

if (args.length < 5) {
  console.log(`
Usage: node scripts/register-iot-device.js <device-id> <device-name> <institution-id> <room> [device-token]

Example:
  node scripts/register-iot-device.js KAV-NODE-001 "Chemistry Lab Node" 507f1f77bcf86cd799439011 "Chemistry Lab"

Arguments:
  device-id: Unique device ID (e.g., KAV-NODE-001)
  device-name: Device name (e.g., "Chemistry Lab Safety Node")
  institution-id: MongoDB ObjectId of the school/institution
  room: Room location (e.g., "Chemistry Lab")
  device-token: (Optional) Pre-generated token. If not provided, will generate one.
  `);
  process.exit(1);
}

const [deviceId, deviceName, institutionId, room, providedToken] = args;

async function registerDevice() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      console.log(`\n⚠️  Device ${deviceId} already exists!`);
      console.log(`   Device Token: ${existingDevice.deviceToken}`);
      console.log(`   Device Name: ${existingDevice.deviceName}`);
      console.log(`   Status: ${existingDevice.status}`);
      await mongoose.disconnect();
      return;
    }

    // Generate or use provided token
    const deviceToken = providedToken || generateDeviceToken();

    // Create device
    const device = await Device.create({
      deviceId,
      deviceName,
      deviceType: 'multi-sensor',
      institutionId,
      room,
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
    console.log(`\n📝 Add this to your ESP32 code:`);
    console.log(`  const char* DEVICE_ID = "${deviceId}";`);
    console.log(`  const char* INSTITUTION_ID = "${institutionId}";`);
    console.log(`  // Token will be stored automatically after first connection`);
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

