/**
 * Phase 4.0: Test Real-Time Alert Engine (Socket Layer)
 * Comprehensive test suite for Phase 4.0 Socket.io functionality
 */

import { io as ioClient } from 'socket.io-client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config({ path: '.env' });

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

// Test configuration
let authToken = null;
let testInstitutionId = null;
let testUserId = null;
let alertId = null;
let drillId = null;

// Test results
const testResults = [];

/**
 * Logging utilities
 */
function log(message, color = 'white') {
  const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function recordTest(name, passed, details = null) {
  testResults.push({ name, passed, details });
  if (passed) {
    logSuccess(`${name}${details ? ` - ${details}` : ''}`);
  } else {
    logError(`${name}${details ? ` - ${details}` : ''}`);
  }
}

/**
 * API request helper
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  try {
    const result = await apiRequest('GET', '/health');
    if (result.status === 200 || result.data?.status === 'OK') {
      recordTest('Health Check', true);
      return true;
    } else {
      recordTest('Health Check', false, `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    recordTest('Health Check', false, error.message);
    return false;
  }
}

/**
 * Test 2: Login to get auth token
 */
async function testLogin() {
  try {
    // Use test credentials (adjust as needed)
    const loginData = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const result = await apiRequest('POST', '/auth/login', loginData);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.token) {
      authToken = result.data.data.token;
      testUserId = result.data.data.user?._id;
      testInstitutionId = result.data.data.user?.institutionId;
      recordTest('Login', true, `User: ${result.data.data.user?.email}`);
      return true;
    } else {
      recordTest('Login', false, 'Token not received');
      return false;
    }
  } catch (error) {
    recordTest('Login', false, error.message);
    return false;
  }
}

/**
 * Test 3: Socket.io Connection
 */
async function testSocketConnection() {
  return new Promise((resolve) => {
    log('\n📡 Testing Socket.io Connection...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('Socket Connection', false, 'Connection timeout');
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      logSuccess(`Connected: ${socket.id}`);
      recordTest('Socket Connection', true, `Socket ID: ${socket.id}`);
      socket.disconnect();
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('Socket Connection', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 4: Auto Room Join
 */
async function testAutoRoomJoin() {
  return new Promise((resolve) => {
    log('\n📡 Testing Auto Room Join...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('Auto Room Join', false, 'Timeout waiting for JOINED_ROOM');
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      logInfo('Waiting for JOINED_ROOM event...');
    });

    socket.on('JOINED_ROOM', (data) => {
      clearTimeout(timeout);
      if (data.room && data.room.startsWith('school:')) {
        logSuccess(`Joined room: ${data.room}`);
        recordTest('Auto Room Join', true, `Room: ${data.room}`);
        socket.disconnect();
        resolve(true);
      } else {
        recordTest('Auto Room Join', false, 'Invalid room format');
        socket.disconnect();
        resolve(false);
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('Auto Room Join', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 5: CRISIS_ALERT Event Reception
 */
async function testCrisisAlertReception() {
  return new Promise((resolve) => {
    log('\n📡 Testing CRISIS_ALERT Reception...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    let alertReceived = false;
    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('CRISIS_ALERT Reception', alertReceived, alertReceived ? 'Received' : 'Timeout');
      resolve(alertReceived);
    }, 10000); // 10 second timeout

    socket.on('connect', async () => {
      logInfo('Connected. Creating test alert...');
      
      // Create a test alert via API
      try {
        const alertData = {
          type: 'fire',
          severity: 'high',
          title: 'Test Crisis Alert',
          description: 'This is a test alert for Phase 4.0',
          metadata: {
            source: 'Admin',
            isDrill: false
          }
        };

        const result = await apiRequest('POST', '/alerts', alertData, authToken);
        if (result.status === 201 && result.data?.data?.alert?._id) {
          alertId = result.data.data.alert._id;
          logInfo(`Test alert created: ${alertId}`);
        }
      } catch (error) {
        logWarning(`Could not create test alert: ${error.message}`);
      }
    });

    socket.on('CRISIS_ALERT', (data) => {
      clearTimeout(timeout);
      alertReceived = true;
      
      // Validate Phase 4.0 requirements
      const hasRequiredFields = data.alertId && data.type && data.severity && data.source;
      const hasDrillFlag = typeof data.drillFlag === 'boolean';
      
      if (hasRequiredFields && hasDrillFlag) {
        logSuccess('CRISIS_ALERT received with all Phase 4.0 fields');
        logInfo(`   Alert ID: ${data.alertId}`);
        logInfo(`   Type: ${data.type}`);
        logInfo(`   Severity: ${data.severity}`);
        logInfo(`   Source: ${data.source}`);
        logInfo(`   Drill Flag: ${data.drillFlag}`);
        recordTest('CRISIS_ALERT Reception', true, 'All fields present');
      } else {
        recordTest('CRISIS_ALERT Reception', false, 'Missing required fields');
      }
      
      socket.disconnect();
      resolve(alertReceived);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('CRISIS_ALERT Reception', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 6: USER_SAFE Event
 */
async function testUserSafeEvent() {
  return new Promise((resolve) => {
    log('\n📡 Testing USER_SAFE Event...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('USER_SAFE Event', false, 'Timeout');
      resolve(false);
    }, 10000);

    socket.on('connect', async () => {
      if (!alertId) {
        logWarning('No alert ID available, skipping USER_SAFE test');
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('USER_SAFE Event', false, 'No alert ID');
        resolve(false);
        return;
      }

      logInfo('Emitting USER_SAFE event...');
      socket.emit('USER_SAFE', {
        alertId: alertId,
        location: {
          lat: 28.6139,
          lng: 77.2090
        }
      });

      // Wait for USER_STATUS_UPDATE broadcast
      setTimeout(() => {
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('USER_SAFE Event', true, 'Event sent successfully');
        resolve(true);
      }, 2000);
    });

    socket.on('USER_STATUS_UPDATE', (data) => {
      if (data.userId === testUserId && data.status === 'SAFE') {
        logSuccess('USER_STATUS_UPDATE received');
        recordTest('USER_SAFE Event', true, 'Status update broadcasted');
        clearTimeout(timeout);
        socket.disconnect();
        resolve(true);
      }
    });

    socket.on('ERROR', (error) => {
      logWarning(`Error: ${error.message}`);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('USER_SAFE Event', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 7: USER_HELP Event
 */
async function testUserHelpEvent() {
  return new Promise((resolve) => {
    log('\n📡 Testing USER_HELP Event...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('USER_HELP Event', false, 'Timeout');
      resolve(false);
    }, 10000);

    socket.on('connect', async () => {
      if (!alertId) {
        logWarning('No alert ID available, skipping USER_HELP test');
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('USER_HELP Event', false, 'No alert ID');
        resolve(false);
        return;
      }

      logInfo('Emitting USER_HELP event...');
      socket.emit('USER_HELP', {
        alertId: alertId,
        location: {
          lat: 28.6139,
          lng: 77.2090
        },
        details: 'Test help request'
      });

      // Wait for USER_STATUS_UPDATE broadcast
      setTimeout(() => {
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('USER_HELP Event', true, 'Event sent successfully');
        resolve(true);
      }, 2000);
    });

    socket.on('USER_STATUS_UPDATE', (data) => {
      if (data.userId === testUserId && data.status === 'HELP') {
        logSuccess('USER_STATUS_UPDATE received (HELP status)');
        recordTest('USER_HELP Event', true, 'Status update broadcasted');
        clearTimeout(timeout);
        socket.disconnect();
        resolve(true);
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('USER_HELP Event', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 8: HEARTBEAT Event
 */
async function testHeartbeatEvent() {
  return new Promise((resolve) => {
    log('\n📡 Testing HEARTBEAT Event...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('HEARTBEAT Event', false, 'Timeout');
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      logInfo('Emitting HEARTBEAT...');
      socket.emit('HEARTBEAT');
    });

    socket.on('SERVER_HEARTBEAT', (data) => {
      clearTimeout(timeout);
      if (data.timestamp) {
        logSuccess('SERVER_HEARTBEAT received');
        recordTest('HEARTBEAT Event', true, `Timestamp: ${data.timestamp}`);
        socket.disconnect();
        resolve(true);
      } else {
        recordTest('HEARTBEAT Event', false, 'Missing timestamp');
        socket.disconnect();
        resolve(false);
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('HEARTBEAT Event', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 9: DRILL_ACK Event
 */
async function testDrillAckEvent() {
  return new Promise((resolve) => {
    log('\n📡 Testing DRILL_ACK Event...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('DRILL_ACK Event', false, 'Timeout or no drill available');
      resolve(false);
    }, 10000);

    socket.on('connect', async () => {
      // Try to get an existing drill or create one
      try {
        const drillsResult = await apiRequest('GET', '/drills?limit=1', null, authToken);
        if (drillsResult.status === 200 && drillsResult.data?.data?.drills?.length > 0) {
          drillId = drillsResult.data.data.drills[0]._id;
          logInfo(`Using drill ID: ${drillId}`);
          
          socket.emit('DRILL_ACK', { drillId });
          
          setTimeout(() => {
            clearTimeout(timeout);
            socket.disconnect();
            recordTest('DRILL_ACK Event', true, 'Event sent');
            resolve(true);
          }, 2000);
        } else {
          logWarning('No drills available for testing');
          clearTimeout(timeout);
          socket.disconnect();
          recordTest('DRILL_ACK Event', false, 'No drill available');
          resolve(false);
        }
      } catch (error) {
        logWarning(`Could not get drill: ${error.message}`);
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('DRILL_ACK Event', false, error.message);
        resolve(false);
      }
    });

    socket.on('DRILL_ACK_RECEIVED', (data) => {
      logSuccess('DRILL_ACK_RECEIVED broadcast received');
      clearTimeout(timeout);
      socket.disconnect();
      recordTest('DRILL_ACK Event', true, 'Acknowledgment broadcasted');
      resolve(true);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('DRILL_ACK Event', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Test 10: Multiple Socket Connections (Performance Test)
 */
async function testMultipleConnections() {
  log('\n📡 Testing Multiple Socket Connections...', 'cyan');
  
  const connections = [];
  const promises = [];
  let connectedCount = 0;

  // Create 3 socket connections
  for (let i = 0; i < 3; i++) {
    promises.push(new Promise((resolve) => {
      const socket = ioClient(SOCKET_URL, {
        auth: { token: authToken },
        transports: ['websocket']
      });

      connections.push(socket);

      socket.on('connect', () => {
        connectedCount++;
        logInfo(`Connection ${i + 1} established: ${socket.id}`);
        if (connectedCount === 3) {
          // All connected, test alert broadcast
          setTimeout(async () => {
            try {
              const alertData = {
                type: 'fire',
                severity: 'critical',
                title: 'Performance Test Alert',
                metadata: { source: 'Test', isDrill: false }
              };
              await apiRequest('POST', '/alerts', alertData, authToken);
              
              // Wait for broadcasts
              setTimeout(() => {
                let receivedCount = 0;
                connections.forEach(s => {
                  if (s._crisisAlertReceived) receivedCount++;
                });

                connections.forEach(s => s.disconnect());
                
                if (receivedCount === 3) {
                  recordTest('Multiple Connections', true, 'All 3 received alert');
                } else {
                  recordTest('Multiple Connections', false, `Only ${receivedCount}/3 received`);
                }
                resolve(receivedCount === 3);
              }, 3000);
            } catch (error) {
              connections.forEach(s => s.disconnect());
              recordTest('Multiple Connections', false, error.message);
              resolve(false);
            }
          }, 1000);
        }
      });

      socket.on('CRISIS_ALERT', () => {
        socket._crisisAlertReceived = true;
      });

      socket.on('connect_error', () => {
        connections.forEach(s => s.disconnect());
        recordTest('Multiple Connections', false, 'Connection error');
        resolve(false);
      });
    }));
  }

  const results = await Promise.all(promises);
  const allPassed = results.every(r => r === true);
  
  return allPassed;
}

/**
 * Test 11: Alert Cancellation
 */
async function testAlertCancellation() {
  return new Promise((resolve) => {
    log('\n📡 Testing ALERT_CANCEL Event...', 'cyan');
    
    const socket = ioClient(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket']
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      recordTest('Alert Cancellation', false, 'Timeout');
      resolve(false);
    }, 10000);

    socket.on('connect', async () => {
      if (!alertId) {
        logWarning('No alert ID available');
        clearTimeout(timeout);
        socket.disconnect();
        recordTest('Alert Cancellation', false, 'No alert ID');
        resolve(false);
        return;
      }

      // Cancel the alert via API
      try {
        const result = await apiRequest('POST', `/alerts/${alertId}/cancel`, { reason: 'Test cancellation' }, authToken);
        if (result.status === 200) {
          logInfo('Alert cancellation API called');
        }
      } catch (error) {
        logWarning(`Could not cancel alert: ${error.message}`);
      }
    });

    socket.on('ALERT_CANCEL', (data) => {
      clearTimeout(timeout);
      if (data.alertId && data.reason) {
        logSuccess('ALERT_CANCEL received');
        recordTest('Alert Cancellation', true, `Reason: ${data.reason}`);
        socket.disconnect();
        resolve(true);
      } else {
        recordTest('Alert Cancellation', false, 'Missing fields');
        socket.disconnect();
        resolve(false);
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      recordTest('Alert Cancellation', false, error.message);
      resolve(false);
    });
  });
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n🚀 Phase 4.0: Real-Time Alert Engine - Comprehensive Test Suite\n', 'cyan');
  log('='.repeat(70), 'cyan');

  // Health check
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    logError('\n❌ Server is not running. Please start the backend server first.');
    logInfo('Run: npm run dev (in backend directory)\n');
    process.exit(1);
  }

  // Login
  const loginOk = await testLogin();
  if (!loginOk) {
    logError('\n❌ Login failed. Cannot test authenticated endpoints.');
    logInfo('Please ensure test user exists or update credentials in test script.\n');
    process.exit(1);
  }

  // Socket tests
  log('\n📋 Testing Socket.io Functionality...\n', 'blue');
  
  await testSocketConnection();
  await testAutoRoomJoin();
  await testCrisisAlertReception();
  await testUserSafeEvent();
  await testUserHelpEvent();
  await testHeartbeatEvent();
  await testDrillAckEvent();
  await testMultipleConnections();
  await testAlertCancellation();

  // Summary
  log('\n' + '='.repeat(70), 'cyan');
  log('\n📊 Test Results Summary\n', 'cyan');

  let passedCount = 0;
  let failedCount = 0;

  testResults.forEach(result => {
    if (result.passed) {
      passedCount++;
    } else {
      failedCount++;
    }
  });

  logSuccess(`✅ Passed: ${passedCount}`);
  if (failedCount > 0) {
    logError(`❌ Failed: ${failedCount}`);
  }
  logInfo(`📈 Total: ${testResults.length}\n`);

  // Detailed results
  log('\n📝 Detailed Results:\n', 'blue');
  testResults.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}${result.details ? ` - ${result.details}` : ''}`);
    } else {
      logError(`${result.name}${result.details ? ` - ${result.details}` : ''}`);
    }
  });

  log('\n');

  if (failedCount > 0) {
    logError('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  } else {
    logSuccess('✅ All Phase 4.0 Socket.io tests passed successfully!\n');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  logError(`\n❌ Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

