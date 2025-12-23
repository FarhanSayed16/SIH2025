/**
 * Phase 3.4.3: Enhanced Communication - Test Script
 * Tests communication features (SMS, Email, Push, Broadcast, Templates)
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

let authToken = null;
let userId = null;
let institutionId = null;

/**
 * Test utilities
 */
const log = {
  info: (msg) => console.log(`\n✅ ${msg}`),
  error: (msg) => console.error(`\n❌ ${msg}`),
  test: (name) => console.log(`\n🧪 Testing: ${name}`),
  success: (msg) => console.log(`   ✓ ${msg}`),
};

/**
 * Helper: Make API request
 */
async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(data && { data }),
    };

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      status: error.response?.status,
    };
  }
}

/**
 * Test 1: Health check
 */
async function testHealthCheck() {
  log.test('Health Check');
  const result = await apiRequest('GET', '/health');
  if (result.success) {
    log.success('Server is running');
    return true;
  } else {
    log.error(`Server not responding: ${result.error}`);
    return false;
  }
}

/**
 * Test 2: User login
 */
async function testLogin() {
  log.test('User Login');
  const result = await apiRequest('POST', '/auth/login', {
    email: 'admin@school.com',
    password: 'admin123',
  });

  if (result.success && result.data?.data?.token) {
    authToken = result.data.data.token;
    userId = result.data.data.user?._id;
    institutionId = result.data.data.user?.institutionId;
    log.success('Login successful');
    log.info(`Token: ${authToken.substring(0, 20)}...`);
    return true;
  } else {
    log.error(`Login failed: ${result.error}`);
    return false;
  }
}

/**
 * Test 3: Create message template
 */
async function testCreateTemplate() {
  log.test('Create Message Template');
  const templateData = {
    name: 'Test Emergency Template',
    category: 'emergency',
    channels: ['push', 'email'],
    content: {
      push: {
        title: 'Emergency Alert',
        body: '{{alertType}} - {{message}}',
      },
      email: {
        subject: 'Emergency: {{alertType}}',
        body: 'Emergency alert: {{message}}',
      },
    },
  };

  const result = await apiRequest('POST', '/templates', templateData, authToken);
  if (result.success && result.data?.data) {
    log.success('Template created');
    log.info(`Template ID: ${result.data.data._id}`);
    return result.data.data._id;
  } else {
    log.error(`Template creation failed: ${result.error}`);
    return null;
  }
}

/**
 * Test 4: Get templates
 */
async function testGetTemplates() {
  log.test('Get Templates');
  const result = await apiRequest('GET', '/templates', null, authToken);
  if (result.success && result.data?.data) {
    log.success(`Retrieved ${result.data.data.length} templates`);
    return true;
  } else {
    log.error(`Failed to get templates: ${result.error}`);
    return false;
  }
}

/**
 * Test 5: Send broadcast (push notification only - safe test)
 */
async function testSendBroadcast() {
  log.test('Send Broadcast Message');
  const broadcastData = {
    type: 'announcement',
    priority: 'medium',
    recipients: {
      type: 'admins', // Only send to admins for testing
    },
    channels: ['push'], // Only push, no SMS/Email to avoid costs
    title: 'Test Broadcast',
    message: 'This is a test broadcast message from Phase 3.4.3',
  };

  const result = await apiRequest('POST', '/broadcast/send', broadcastData, authToken);
  if (result.success) {
    log.success('Broadcast sent successfully');
    log.info(`Broadcast ID: ${result.data?.data?.broadcastId}`);
    return result.data?.data?.broadcastId;
  } else {
    log.error(`Broadcast failed: ${result.error}`);
    return null;
  }
}

/**
 * Test 6: Get broadcast logs
 */
async function testGetBroadcasts() {
  log.test('Get Broadcast History');
  const result = await apiRequest('GET', '/broadcast', null, authToken);
  if (result.success && result.data?.data) {
    const broadcasts = result.data.data.broadcasts || result.data.data || [];
    log.success(`Retrieved ${broadcasts.length} broadcasts`);
    if (broadcasts.length > 0) {
      log.info(`Latest: ${broadcasts[0].type} - ${broadcasts[0].status}`);
    }
    return true;
  } else {
    log.error(`Failed to get broadcasts: ${result.error}`);
    return false;
  }
}

/**
 * Test 7: Get communication logs
 */
async function testGetCommunicationLogs() {
  log.test('Get Communication Logs');
  const result = await apiRequest('GET', '/communication/logs?limit=10', null, authToken);
  if (result.success && result.data?.data) {
    const logs = result.data.data.logs || result.data.data || [];
    log.success(`Retrieved ${logs.length} communication logs`);
    return true;
  } else {
    log.error(`Failed to get communication logs: ${result.error}`);
    return false;
  }
}

/**
 * Test 8: Get delivery statistics
 */
async function testGetStatistics() {
  log.test('Get Delivery Statistics');
  const result = await apiRequest('GET', '/communication/statistics', null, authToken);
  if (result.success && result.data?.data) {
    log.success('Statistics retrieved');
    log.info(`Total messages: ${result.data.data.total || 0}`);
    return true;
  } else {
    log.error(`Failed to get statistics: ${result.error}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 Phase 3.4.3: Enhanced Communication - Test Suite\n');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'User Login', fn: testLogin, critical: true },
    { name: 'Create Template', fn: testCreateTemplate, critical: false },
    { name: 'Get Templates', fn: testGetTemplates, critical: false },
    { name: 'Send Broadcast', fn: testSendBroadcast, critical: false },
    { name: 'Get Broadcasts', fn: testGetBroadcasts, critical: false },
    { name: 'Get Communication Logs', fn: testGetCommunicationLogs, critical: false },
    { name: 'Get Statistics', fn: testGetStatistics, critical: false },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result !== false && result !== null) {
        passed++;
      } else {
        failed++;
        if (test.critical) {
          log.error(`Critical test failed: ${test.name}`);
          console.log('\n⚠️  Stopping tests due to critical failure');
          break;
        }
      }
    } catch (error) {
      failed++;
      log.error(`Test ${test.name} threw error: ${error.message}`);
      if (test.critical) break;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log(`\n✅ Phase 3.4.3: Enhanced Communication tests completed!\n`);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});

