/**
 * Phase 4.4: Emergency Acknowledgment & Triage Testing
 * 
 * Tests all Phase 4.4 endpoints and Dead Man's Switch functionality
 * 
 * Usage:
 *   node backend/scripts/test-phase4.4-status-triage.js
 */

import { io as ioClient } from 'socket.io-client';
import axios from 'axios';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Alert from '../src/models/Alert.js';
import User from '../src/models/User.js';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api`;
const SOCKET_URL = process.env.SOCKET_URL || BACKEND_URL;
const MONGODB_URI = process.env.MONGODB_URI;

let authToken = null;
let testInstitutionId = null;
let testUserId = null;
let testAlertId = null;
let testStudentId = null;
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

async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
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
    
    // Debug logging
    if (result.status !== 200) {
      log(`   ❌ Login returned status ${result.status}`, 'red');
      if (result.data) {
        log(`   Full Response: ${JSON.stringify(result.data, null, 2)}`, 'yellow');
      }
      if (result.error) {
        log(`   Error: ${result.error}`, 'red');
      }
      logTest('Login', false, `HTTP ${result.status}: ${result.data?.message || result.error || 'Unknown error'}`);
      return false;
    }
    
    if (result.status === 200 && result.data?.success && result.data?.data?.accessToken) {
      authToken = result.data.data.accessToken;
      testInstitutionId = result.data.data.user?.institutionId;
      testUserId = result.data.data.user?._id;
      
      // If admin doesn't have institutionId, get first school
      if (!testInstitutionId && result.data.data.user?.role === 'admin') {
        log('   Admin user - fetching school ID...', 'yellow');
        const schoolResult = await apiRequest('GET', '/schools?limit=1', null, authToken);
        if (schoolResult.status === 200 && schoolResult.data?.success) {
          const schools = schoolResult.data?.data?.docs || schoolResult.data?.data || [];
          if (schools.length > 0) {
            testInstitutionId = schools[0]._id || schools[0].id;
            log(`   Using school: ${schools[0].name || testInstitutionId}`, 'green');
          }
        }
      }
      
      logTest('Login', true, `User: ${result.data.data.user?.email || 'unknown'}, Institution: ${testInstitutionId || 'none'}`);
      return true;
    } else {
      logTest('Login', false, result.data?.message || 'Token not received');
      if (result.data) {
        log(`   Response: ${JSON.stringify(result.data).substring(0, 300)}`, 'yellow');
      }
      return false;
    }
  } catch (error) {
    logTest('Login', false, error.message);
    return false;
  }
}

// Test 2: Create Test Alert
async function testCreateAlert() {
  console.log('\n🚨 Test 2: Create Test Alert');
  try {
    if (!authToken || !testInstitutionId) {
      logTest('Create Alert', false, 'Auth token or institution ID missing');
      return false;
    }

    const alertData = {
      type: 'fire',
      title: 'Phase 4.4 Test Alert',
      description: 'Testing status tracking functionality',
      severity: 'high',
      institutionId: testInstitutionId
    };

    const result = await apiRequest('POST', '/alerts', alertData, authToken);

    if (result.status === 201 && result.data?.success && result.data?.data?.alert?._id) {
      testAlertId = result.data.data.alert._id;
      logTest('Create Alert', true, `Alert ID: ${testAlertId}`);
      return true;
    } else {
      logTest('Create Alert', false, result.data?.message || 'Failed to create alert');
      if (result.data) {
        log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}`, 'yellow');
      }
      return false;
    }
  } catch (error) {
    logTest('Create Alert', false, error.message);
    return false;
  }
}

// Test 3: Get Test Student
async function testGetTestStudent() {
  console.log('\n👤 Test 3: Get Test Student');
  try {
    if (!authToken || !testInstitutionId) {
      logTest('Get Student', false, 'Auth token or institution ID missing');
      return false;
    }

    if (!MONGODB_URI) {
      logTest('Get Student', false, 'MONGODB_URI not configured');
      return false;
    }

    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    
    // Find a student in the institution
    const student = await User.findOne({
      institutionId: testInstitutionId,
      role: 'student',
      isActive: true
    });

    if (student) {
      testStudentId = student._id.toString();
      logTest('Get Student', true, `Student ID: ${testStudentId}`);
      await mongoose.disconnect();
      return true;
    } else {
      logTest('Get Student', false, 'No student found in institution');
      await mongoose.disconnect();
      return false;
    }
  } catch (error) {
    logTest('Get Student', false, error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    return false;
  }
}

// Test 4: Update User Status (SAFE)
async function testUpdateStatusSafe() {
  console.log('\n✅ Test 4: Update Status to SAFE');
  try {
    if (!authToken || !testAlertId || !testUserId) {
      logTest('Update Status (SAFE)', false, 'Missing required data');
      return false;
    }

    const statusData = {
      status: 'safe',
      userId: testUserId
    };

    const result = await apiRequest('POST', `/alerts/${testAlertId}/status`, statusData, authToken);

    if (result.status === 200 && result.data?.success) {
      logTest('Update Status (SAFE)', true, 'Status updated to SAFE');
      return true;
    } else {
      logTest('Update Status (SAFE)', false, result.data?.message || 'Failed to update status');
      return false;
    }
  } catch (error) {
    logTest('Update Status (SAFE)', false, error.message);
    return false;
  }
}

// Test 5: Update User Status (HELP)
async function testUpdateStatusHelp() {
  console.log('\n🆘 Test 5: Update Status to HELP');
  try {
    if (!authToken || !testAlertId || !testUserId) {
      logTest('Update Status (HELP)', false, 'Missing required data');
      return false;
    }

    const statusData = {
      status: 'help',
      userId: testUserId
    };

    const result = await apiRequest('POST', `/alerts/${testAlertId}/status`, statusData, authToken);

    if (result.status === 200 && result.data?.success) {
      logTest('Update Status (HELP)', true, 'Status updated to HELP');
      return true;
    } else {
      logTest('Update Status (HELP)', false, result.data?.message || 'Failed to update status');
      return false;
    }
  } catch (error) {
    logTest('Update Status (HELP)', false, error.message);
    return false;
  }
}

// Test 6: Get All User Statuses
async function testGetStatuses() {
  console.log('\n📊 Test 6: Get All User Statuses');
  try {
    if (!authToken || !testAlertId) {
      logTest('Get Statuses', false, 'Missing required data');
      return false;
    }

    const result = await apiRequest('GET', `/alerts/${testAlertId}/status`, null, authToken);

    if (result.status === 200 && result.data?.success && result.data?.data?.statuses) {
      const statuses = result.data.data.statuses;
      logTest('Get Statuses', true, `Found ${statuses.length} status entries`);
      return true;
    } else {
      logTest('Get Statuses', false, result.data?.message || 'Failed to get statuses');
      return false;
    }
  } catch (error) {
    logTest('Get Statuses', false, error.message);
    return false;
  }
}

// Test 7: Get Status Summary
async function testGetSummary() {
  console.log('\n📈 Test 7: Get Status Summary');
  try {
    if (!authToken || !testAlertId) {
      logTest('Get Summary', false, 'Missing required data');
      return false;
    }

    const result = await apiRequest('GET', `/alerts/${testAlertId}/summary`, null, authToken);

    if (result.status === 200 && result.data?.success && result.data?.data?.counts) {
      const counts = result.data.data.counts;
      log(`   Safe: ${counts.safe}`, 'green');
      log(`   Help: ${counts.help}`, 'red');
      log(`   Missing: ${counts.missing}`, 'yellow');
      log(`   Potentially Trapped: ${counts.potentially_trapped}`, 'yellow');
      log(`   Total: ${counts.total}`, 'cyan');
      logTest('Get Summary', true, `Summary retrieved with ${counts.total} total users`);
      return true;
    } else {
      logTest('Get Summary', false, result.data?.message || 'Failed to get summary');
      return false;
    }
  } catch (error) {
    logTest('Get Summary', false, error.message);
    return false;
  }
}

// Test 8: Mark User as Missing (Admin)
async function testMarkMissing() {
  console.log('\n⚠️  Test 8: Mark User as Missing');
  try {
    if (!authToken || !testAlertId || !testStudentId) {
      logTest('Mark Missing', false, 'Missing required data');
      return false;
    }

    const markData = {
      userId: testStudentId
    };

    const result = await apiRequest('POST', `/alerts/${testAlertId}/mark-missing`, markData, authToken);

    if (result.status === 200 && result.data?.success) {
      logTest('Mark Missing', true, `User ${testStudentId} marked as missing`);
      return true;
    } else {
      logTest('Mark Missing', false, result.data?.message || 'Failed to mark as missing');
      return false;
    }
  } catch (error) {
    logTest('Mark Missing', false, error.message);
    return false;
  }
}

// Test 9: Socket.io Connection
async function testSocketConnection() {
  console.log('\n🔌 Test 9: Socket.io Connection');
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

// Test 10: USER_STATUS_UPDATE Event
async function testStatusUpdateEvent() {
  console.log('\n📡 Test 10: USER_STATUS_UPDATE Event Broadcast');
  try {
    if (!socket || !authToken || !testAlertId || !testUserId) {
      logTest('Status Update Event', false, 'Socket, auth token, or test data missing');
      return false;
    }

    return new Promise((resolve) => {
      let eventReceived = false;

      socket.on('USER_STATUS_UPDATE', (data) => {
        eventReceived = true;
        log('   ✅ Received USER_STATUS_UPDATE event', 'green');
        log(`   User: ${data.userName || data.userId}, Status: ${data.status}`, 'cyan');
        logTest('Status Update Event', true, `Broadcast received: ${data.status}`);
        resolve(true);
      });

      // Update status to trigger event
      const statusData = {
        status: 'safe',
        userId: testUserId
      };

      apiRequest('POST', `/alerts/${testAlertId}/status`, statusData, authToken)
        .then((result) => {
          if (result.status === 200) {
            log('   ✅ Status updated successfully', 'green');
            
            setTimeout(() => {
              if (eventReceived) {
                resolve(true);
              } else {
                logTest('Status Update Event', false, 'Status updated but event not received');
                resolve(false);
              }
            }, 3000);
          } else {
            logTest('Status Update Event', false, `Failed to update status: ${result.data?.message}`);
            resolve(false);
          }
        })
        .catch((error) => {
          logTest('Status Update Event', false, error.message);
          resolve(false);
        });
    });
  } catch (error) {
    logTest('Status Update Event', false, error.message);
    return false;
  }
}

// Cleanup
async function cleanup() {
  if (socket) {
    socket.disconnect();
  }
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  } catch (error) {
    // Ignore disconnect errors
  }
}

async function runTests() {
  console.log('\n============================================================');
  log('🧪 Phase 4.4: Emergency Acknowledgment & Triage Testing', 'cyan');
  console.log('============================================================');
  console.log('\n🔧 Configuration:');
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   API URL: ${API_URL}`);
  console.log(`   Socket URL: ${SOCKET_URL}`);

  await testLogin();
  await testCreateAlert();
  await testGetTestStudent();
  
  if (testAlertId) {
    await testUpdateStatusSafe();
    await testUpdateStatusHelp();
    await testGetStatuses();
    await testGetSummary();
    await testMarkMissing();
    await testSocketConnection();
    await testStatusUpdateEvent();
  } else {
    log('\n⚠️  Skipping status-related tests (no alert created)', 'yellow');
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

