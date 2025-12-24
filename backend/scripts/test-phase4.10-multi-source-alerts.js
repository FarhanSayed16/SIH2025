/**
 * Phase 4.10: Multi-Source Alerts & Incident Management - Backend Test Script
 * Tests alert pipeline, incident logging, and NDMA integration
 */

import axios from 'axios';
import { io as ioClient } from 'socket.io-client';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3000';

let authToken = null;
let testInstitutionId = null;
let testUserId = null;
let testAlertId = null;
let testIncidentId = null;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

function logTest(testName, status, details = '') {
  const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  const statusColor = status === 'PASS' ? colors.green : status === 'FAIL' ? colors.red : colors.yellow;
  console.log(`${statusIcon} ${statusColor}${status}${colors.reset}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@school.com',
      password: 'admin123',
    }, {
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data.success && response.data.data?.accessToken) {
      authToken = response.data.data.accessToken;
      testUserId = response.data.data.user?._id || response.data.data.userId;
      testInstitutionId = response.data.data.user?.institutionId || response.data.data.institutionId;
      
      // If no institutionId, try to get one from schools list
      if (!testInstitutionId) {
        const schoolsResponse = await axios.get(`${API_URL}/schools`, {
          headers: { Authorization: `Bearer ${authToken}` },
          validateStatus: () => true,
        });
        
        if (schoolsResponse.status === 200 && schoolsResponse.data.success && schoolsResponse.data.data?.length > 0) {
          testInstitutionId = schoolsResponse.data.data[0]._id;
        }
      }

      logTest('Login', 'PASS', `Token received, Institution ID: ${testInstitutionId}`);
      return true;
    } else {
      logTest('Login', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Token not received'}`);
      return false;
    }
  } catch (error) {
    logTest('Login', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testCreateAdminAlert() {
  try {
    const response = await axios.post(
      `${API_URL}/alerts`,
      {
        institutionId: testInstitutionId,
        type: 'fire',
        severity: 'high',
        title: 'Test Alert - Admin Triggered (Phase 4.10)',
        description: 'Testing alert pipeline from admin source',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 201 && response.data.success && response.data.data?.alert) {
      testAlertId = response.data.data.alert._id;
      logTest('Create Admin Alert', 'PASS', `Alert ID: ${testAlertId}`);
      return true;
    } else {
      logTest('Create Admin Alert', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Alert not created'}`);
      return false;
    }
  } catch (error) {
    logTest('Create Admin Alert', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testGetIncidentHistory() {
  try {
    const response = await axios.get(
      `${API_URL}/incidents?institutionId=${testInstitutionId}&limit=10`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data.success && response.data.data?.incidents) {
      const incidents = response.data.data.incidents;
      
      // Find our test alert
      const testIncident = incidents.find(i => i.alertId === testAlertId);
      if (testIncident) {
        testIncidentId = testIncident._id;
        logTest('Get Incident History', 'PASS', `Found ${incidents.length} incidents, Test incident ID: ${testIncidentId}`);
        return true;
      } else {
        logTest('Get Incident History', 'FAIL', `Found ${incidents.length} incidents, but test incident not found`);
        return false;
      }
    } else {
      logTest('Get Incident History', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Incidents not retrieved'}`);
      return false;
    }
  } catch (error) {
    logTest('Get Incident History', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testGetIncidentDetails() {
  if (!testIncidentId) {
    logTest('Get Incident Details', 'FAIL', 'No incident ID available');
    return false;
  }

  try {
    const response = await axios.get(
      `${API_URL}/incidents/${testIncidentId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data.success && response.data.data) {
      const incident = response.data.data;
      logTest('Get Incident Details', 'PASS', `Source: ${incident.source}, Status: ${incident.status}, Affected Users: ${incident.affectedUsers?.length || 0}`);
      return true;
    } else {
      logTest('Get Incident Details', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Incident not found'}`);
      return false;
    }
  } catch (error) {
    logTest('Get Incident Details', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testGetIncidentStats() {
  try {
    const response = await axios.get(
      `${API_URL}/incidents/stats?institutionId=${testInstitutionId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data.success && response.data.data) {
      const stats = response.data.data;
      logTest('Get Incident Stats', 'PASS', `Total: ${stats.total}, By Source: ${JSON.stringify(stats.bySource)}`);
      return true;
    } else {
      logTest('Get Incident Stats', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Stats not retrieved'}`);
      return false;
    }
  } catch (error) {
    logTest('Get Incident Stats', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testTeacherAlertTrigger() {
  try {
    const response = await axios.post(
      `${API_URL}/alerts/teacher`,
      {
        type: 'medical',
        severity: 'critical',
        title: 'Test Alert - Teacher Triggered (Phase 4.10)',
        description: 'Testing teacher alert trigger from mobile app',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
        validateStatus: () => true,
      }
    );

    if (response.status === 201 && response.data.success && response.data.data?.alert) {
      const alert = response.data.data.alert;
      logTest('Teacher Alert Trigger', 'PASS', `Alert ID: ${alert._id}, Source: ${response.data.data.alertLog?.source || 'teacher'}`);
      return true;
    } else {
      logTest('Teacher Alert Trigger', 'FAIL', `Status: ${response.status}, Message: ${response.data.message || 'Alert not created'}`);
      return false;
    }
  } catch (error) {
    logTest('Teacher Alert Trigger', 'FAIL', `Error: ${error.message}`);
    return false;
  }
}

async function testSocketIOConnection() {
  return new Promise((resolve) => {
    const socket = ioClient(SOCKET_URL, {
      auth: {
        token: authToken,
      },
      transports: ['websocket'],
    });

    let connected = false;
    let alertReceived = false;

    socket.on('connect', () => {
      connected = true;
      logTest('Socket.io Connection', 'PASS', 'Connected to server');

      // Join school room
      if (testInstitutionId) {
        socket.emit('join_school', { schoolId: testInstitutionId });
      }

      // Listen for crisis alerts
      socket.on('CRISIS_ALERT', (data) => {
        if (!alertReceived) {
          alertReceived = true;
          logTest('CRISIS_ALERT Event', 'PASS', `Received alert: ${data.alertType || data.type}, Source: ${data.source || 'unknown'}`);
          
          socket.disconnect();
          resolve(true);
        }
      });

      // Trigger a test alert after connection
      setTimeout(async () => {
        if (!alertReceived) {
          await testCreateAdminAlert();
          // Wait a bit more for the alert event
          setTimeout(() => {
            if (!alertReceived) {
              logTest('CRISIS_ALERT Event', 'FAIL', 'Event not received within 5 seconds');
              socket.disconnect();
              resolve(false);
            }
          }, 5000);
        }
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      logTest('Socket.io Connection', 'FAIL', `Connection error: ${error.message}`);
      resolve(false);
    });

    setTimeout(() => {
      if (!connected) {
        logTest('Socket.io Connection', 'FAIL', 'Connection timeout');
        resolve(false);
      }
    }, 5000);
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Phase 4.10: Multi-Source Alerts & Incident Management Tests');
  console.log('='.repeat(60) + '\n');

  // Run tests sequentially
  const results = {
    login: await testLogin(),
    createAdminAlert: await testCreateAdminAlert(),
    getIncidentHistory: await testGetIncidentHistory(),
    getIncidentDetails: testIncidentId ? await testGetIncidentDetails() : false,
    getIncidentStats: await testGetIncidentStats(),
    teacherAlertTrigger: await testTeacherAlertTrigger(),
    socketIO: await testSocketIOConnection(),
  };

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}`);
  });

  console.log(`\n${passed}/${total} tests passed\n`);

  if (passed === total) {
    console.log(`${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}⚠️  Some tests failed. Please review the output above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

