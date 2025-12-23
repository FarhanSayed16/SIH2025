/**
 * Phase 3.4.4: Security & Compliance - Test Script
 * Tests security features (Audit Logs, GDPR, Encryption, Security Monitoring)
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
 * Test 3: Get audit logs
 */
async function testGetAuditLogs() {
  log.test('Get Audit Logs');
  const result = await apiRequest('GET', '/audit/logs?limit=10', null, authToken);
  if (result.success && result.data?.data) {
    const logs = result.data.data.logs || result.data.data || [];
    log.success(`Retrieved ${logs.length} audit logs`);
    if (logs.length > 0) {
      log.info(`Latest: ${logs[0].action} - ${logs[0].status}`);
    }
    return true;
  } else {
    log.error(`Failed to get audit logs: ${result.error}`);
    return false;
  }
}

/**
 * Test 4: Get security events
 */
async function testGetSecurityEvents() {
  log.test('Get Security Events');
  const result = await apiRequest('GET', '/audit/security', null, authToken);
  if (result.success && result.data?.data) {
    const events = result.data.data || [];
    log.success(`Retrieved ${events.length} security events`);
    return true;
  } else {
    log.error(`Failed to get security events: ${result.error}`);
    return false;
  }
}

/**
 * Test 5: Get security statistics
 */
async function testGetSecurityStats() {
  log.test('Get Security Statistics');
  const result = await apiRequest('GET', '/security/stats?timeRange=24h', null, authToken);
  if (result.success && result.data?.data) {
    log.success('Security statistics retrieved');
    log.info(`Total events: ${result.data.data.totalEvents || 0}`);
    return true;
  } else {
    log.error(`Failed to get security stats: ${result.error}`);
    return false;
  }
}

/**
 * Test 6: GDPR export (safe test - just verify endpoint exists)
 */
async function testGDPRExport() {
  log.test('GDPR Export Endpoint');
  const result = await apiRequest('GET', '/gdpr/export', null, authToken);
  // This should work or return a specific error (not 404)
  if (result.status !== 404) {
    log.success('GDPR export endpoint exists');
    return true;
  } else {
    log.error('GDPR export endpoint not found');
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🔒 Phase 3.4.4: Security & Compliance - Test Suite\n');
  console.log('='.repeat(60));

  const tests = [
    { name: 'Health Check', fn: testHealthCheck, critical: true },
    { name: 'User Login', fn: testLogin, critical: true },
    { name: 'Get Audit Logs', fn: testGetAuditLogs, critical: false },
    { name: 'Get Security Events', fn: testGetSecurityEvents, critical: false },
    { name: 'Get Security Stats', fn: testGetSecurityStats, critical: false },
    { name: 'GDPR Export Endpoint', fn: testGDPRExport, critical: false },
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
  console.log(`\n✅ Phase 3.4.4: Security & Compliance tests completed!\n`);
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite error:', error);
  process.exit(1);
});

