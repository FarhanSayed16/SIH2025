/**
 * Phase 4.3: IoT Emergency Trigger Integration Testing (Simplified)
 * 
 * This script tests the Phase 4.3 IoT alert endpoint by:
 * 1. Logging in as admin
 * 2. Finding an existing IoT device or creating one
 * 3. Testing device alert endpoint
 * 4. Testing Socket.io broadcasting
 * 
 * Usage:
 *   node backend/scripts/test-phase4.3-iot-alerts-simple.js
 */

import { io as ioClient } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Device from '../src/models/Device.js';
import { generateDeviceToken } from '../src/utils/helpers.js';
import School from '../src/models/School.js';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = process.env.SOCKET_URL || BACKEND_URL;
const MONGODB_URI = process.env.MONGODB_URI;

let authToken = null;
let testInstitutionId = null;
let testDeviceId = null;
let deviceToken = null;
let socket = null;

const testResults = [];
let passedCount = 0;
let failedCount = 0;

function log(message, color = 'white') {
  const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? 'green' : 'red';
  log(`${status} ${name}${details ? ` - ${details}` : ''}`, color);
  testResults.push({ name, passed, details });
  if (passed) {
    passedCount++;
  } else {
    failedCount++;
  }
}

async function apiRequest(method, endpoint, data = null, token = null, deviceTokenHeader = null) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(deviceTokenHeader && { Authorization: `Bearer ${deviceTokenHeader}` }),
      },
      timeout: 10000,
      validateStatus: () => true,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data, error: error.message };
    }
    return { status: 500, error: error.message };
  }
}

// Test 1: Login
async function testLogin() {
  console.log('\n🔐 Test 1: Login');
  try {
    const loginData = {
      email: 'admin@school.com',
      password: 'admin123'
    };

    const result = await apiRequest('POST', '/auth/login', loginData);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.accessToken) {
      authToken = result.data.data.accessToken;
      testInstitutionId = result.data.data.user?.institutionId;
      logTest('Login', true, `User: ${result.data.data.user?.email || 'unknown'}`);
      return true;
    } else {
      logTest('Login', false, result.data?.message || 'Token not received');
      return false;
    }
  } catch (error) {
    logTest('Login', false, error.message);
    return false;
  }
}

// Test 2: Get School and Create IoT Device
async function testSetupDevice() {
  console.log('\n🔌 Test 2: Setup IoT Device');
  try {
    if (!MONGODB_URI) {
      logTest('Setup Device', false, 'MONGODB_URI not configured');
      return false;
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    
    // Get school ID
    if (!testInstitutionId) {
      const schools = await School.find().limit(1);
      if (schools.length === 0) {
        logTest('Setup Device', false, 'No schools found in database');
        await mongoose.disconnect();
        return false;
      }
      testInstitutionId = schools[0]._id.toString();
    }

    // Check for existing IoT device with deviceToken
    const existingDevice = await Device.findOne({
      institutionId: testInstitutionId,
      deviceToken: { $exists: true, $ne: null },
      deviceType: { $in: ['fire-sensor', 'flood-sensor', 'smoke-sensor', 'panic-button'] }
    });

    if (existingDevice && existingDevice.deviceToken) {
      testDeviceId = existingDevice.deviceId;
      deviceToken = existingDevice.deviceToken;
      logTest('Setup Device', true, `Found existing device: ${testDeviceId}`);
      await mongoose.disconnect();
      return true;
    }

    // Create new IoT device
    const deviceId = `test-iot-${Date.now()}`;
    deviceToken = generateDeviceToken();
    const crypto = await import('crypto');

    const device = await Device.create({
      deviceId: deviceId,
      deviceName: 'Test IoT Alert Device',
      deviceType: 'fire-sensor',
      institutionId: testInstitutionId,
      deviceToken: deviceToken,
      registrationToken: crypto.randomBytes(16).toString('hex'),
      status: 'active',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139]
      },
      room: 'Main-Building-2-201'
    });

    testDeviceId = device.deviceId;
    logTest('Setup Device', true, `Created device: ${testDeviceId}`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    logTest('Setup Device', false, error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    return false;
  }
}

// Test 3: Device Authentication
async function testDeviceAuth() {
  console.log('\n🔑 Test 3: Device Authentication');
  try {
    if (!deviceToken || !testDeviceId) {
      logTest('Device Auth', false, 'Device token or ID missing');
      return false;
    }

    // Test authentication by making a request with device token
    const result = await apiRequest(
      'POST',
      `/devices/${testDeviceId}/alert`,
      { alertType: 'FIRE', severity: 'LOW' },
      null,
      deviceToken
    );

    // Should either succeed (if minimal data accepted) or fail with validation error (not auth error)
    if (result.status === 201 || (result.status === 400 && !result.data?.message?.includes('token'))) {
      logTest('Device Auth', true, 'Bearer token authentication working');
      return true;
    } else if (result.status === 401 || result.status === 403) {
      logTest('Device Auth', false, `Authentication failed: ${result.data?.message}`);
      return false;
    } else {
      logTest('Device Auth', true, `Auth passed (got ${result.status})`);
      return true;
    }
  } catch (error) {
    logTest('Device Auth', false, error.message);
    return false;
  }
}

// Test 4: Create Alert
async function testCreateAlert() {
  console.log('\n🚨 Test 4: Create Alert');
  try {
    if (!deviceToken || !testDeviceId) {
      logTest('Create Alert', false, 'Device token or ID missing');
      return false;
    }

    const alertData = {
      alertType: 'FIRE',
      severity: 'HIGH',
      sensorData: {
        temperature: 85,
        smokeLevel: 350
      },
      location: {
        building: 'Main Building',
        floor: '2',
        room: '201'
      },
      title: 'Fire Alert - Test',
      description: 'Test alert from IoT device'
    };

    const result = await apiRequest(
      'POST',
      `/devices/${testDeviceId}/alert`,
      alertData,
      null,
      deviceToken
    );

    if (result.status === 201 && result.data?.success && result.data?.data?.alert?._id) {
      logTest('Create Alert', true, `Alert ID: ${result.data.data.alert._id}`);
      return true;
    } else {
      logTest('Create Alert', false, result.data?.message || 'Failed to create alert');
      return false;
    }
  } catch (error) {
    logTest('Create Alert', false, error.message);
    return false;
  }
}

// Test 5: Socket.io Connection
async function testSocketConnection() {
  console.log('\n🔌 Test 5: Socket.io Connection');
  try {
    if (!authToken || !testInstitutionId) {
      logTest('Socket Connection', false, 'Auth token or institution ID missing');
      return false;
    }

    return new Promise((resolve) => {
      socket = ioClient(SOCKET_URL, {
        auth: {
          token: authToken
        },
        transports: ['websocket'],
        timeout: 5000
      });

      let connected = false;

      socket.on('connect', () => {
        connected = true;
        logTest('Socket Connection', true, `Connected: ${socket.id}`);
        
        if (testInstitutionId) {
          socket.emit('JOIN_ROOM', { schoolId: testInstitutionId });
        }
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        logTest('Socket Connection', false, `Connection error: ${error.message}`);
        resolve(false);
      });

      setTimeout(() => {
        if (!connected) {
          logTest('Socket Connection', false, 'Connection timeout');
          if (socket) socket.disconnect();
          resolve(false);
        }
      }, 10000);
    });
  } catch (error) {
    logTest('Socket Connection', false, error.message);
    return false;
  }
}

// Test 6: Alert Broadcast
async function testAlertBroadcast() {
  console.log('\n📡 Test 6: Alert Broadcast via Socket.io');
  try {
    if (!socket || !deviceToken || !testDeviceId) {
      logTest('Alert Broadcast', false, 'Socket, device token, or device ID missing');
      return false;
    }

    return new Promise((resolve) => {
      let alertReceived = false;

      socket.on('CRISIS_ALERT', (data) => {
        alertReceived = true;
        log('   ✅ Received CRISIS_ALERT event', 'green');
        log(`   Alert: ${data.alertId}, Type: ${data.type}, Source: ${data.source}`, 'cyan');
        logTest('Alert Broadcast', true, `Broadcast received: ${data.type} from ${data.source}`);
        resolve(true);
      });

      // Create alert
      const alertData = {
        alertType: 'SMOKE',
        severity: 'CRITICAL',
        title: 'Socket.io Test Alert',
        description: 'Testing Socket.io broadcast'
      };

      apiRequest(
        'POST',
        `/devices/${testDeviceId}/alert`,
        alertData,
        null,
        deviceToken
      ).then((result) => {
        if (result.status === 201) {
          log('   ✅ Alert created successfully', 'green');
          
          setTimeout(() => {
            if (alertReceived) {
              resolve(true);
            } else {
              logTest('Alert Broadcast', false, 'Alert created but broadcast not received');
              resolve(false);
            }
          }, 5000);
        } else {
          logTest('Alert Broadcast', false, `Failed to create alert: ${result.data?.message}`);
          resolve(false);
        }
      }).catch((error) => {
        logTest('Alert Broadcast', false, error.message);
        resolve(false);
      });
    });
  } catch (error) {
    logTest('Alert Broadcast', false, error.message);
    return false;
  }
}

// Cleanup
async function cleanup() {
  if (socket) {
    socket.disconnect();
  }
}

async function runTests() {
  console.log('\n============================================================');
  log('🧪 Phase 4.3: IoT Emergency Trigger Integration Testing', 'cyan');
  console.log('============================================================');
  console.log('\n🔧 Configuration:');
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   API URL: ${API_URL}`);

  await testLogin();
  await testSetupDevice();
  
  if (deviceToken && testDeviceId) {
    await testDeviceAuth();
    await testCreateAlert();
    await testSocketConnection();
    await testAlertBroadcast();
  } else {
    log('\n⚠️  Skipping device-related tests (no device token available)', 'yellow');
  }

  await cleanup();

  console.log('\n============================================================');
  log('📊 Test Summary', 'cyan');
  console.log('============================================================');
  log(`✅ Passed: ${passedCount}`, 'green');
  log(`❌ Failed: ${failedCount}`, failedCount > 0 ? 'red' : 'green');
  log(`📝 Total: ${testResults.length}`);
  console.log('============================================================');

  if (failedCount > 0) {
    log('\n⚠️  Some tests failed. Please check the errors above.', 'yellow');
    process.exit(1);
  } else {
    log('\n✅ All tests passed successfully!', 'green');
    process.exit(0);
  }
}

runTests().catch(error => {
  log(`\n❌ Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

