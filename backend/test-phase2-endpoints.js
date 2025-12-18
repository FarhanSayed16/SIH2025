/**
 * Test script for Phase 2 endpoints
 * Tests all new API endpoints for activity tracking, QR codes, and parent visibility
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testUserId = '';
let testStudentId = '';
let testParentId = '';
let testClassId = '';
let testQRCodeId = '';

// Test colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
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

// Test helper function
async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    logInfo(`Testing: ${name}`);
    logInfo(`  ${method} ${url}`);
    
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    logSuccess(`${name}: Success (${response.status})`);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    const status = error.response?.status || 'N/A';
    const message = error.response?.data?.message || error.message;
    logError(`${name}: Failed (${status}) - ${message}`);
    return { success: false, error: message, status };
  }
}

async function main() {
  log('\n🚀 Starting Phase 2 Endpoint Tests\n', 'blue');
  
  // Step 1: Test Health Check
  log('\n📋 Step 1: Health Check', 'yellow');
  await testEndpoint('Health Check', 'GET', '/health');
  
  // Step 2: Login as admin to get token (you'll need to provide valid credentials)
  log('\n📋 Step 2: Authentication', 'yellow');
  logWarning('Note: You need to provide valid admin credentials for full testing');
  logWarning('Skipping authentication tests - please login manually and set authToken');
  
  // For testing, we'll skip auth and test endpoints that might work without auth
  // or show what endpoints are available
  
  log('\n📋 Available Endpoints to Test:', 'yellow');
  logInfo('Activity Tracking:');
  logInfo('  POST /api/activity/track');
  logInfo('  GET /api/activity/student/:studentId');
  logInfo('  GET /api/activity/class/:classId');
  
  logInfo('\nQR Code Management:');
  logInfo('  POST /api/qr/parent/generate');
  logInfo('  POST /api/qr/parent/verify');
  logInfo('  POST /api/qr/parent/:qrCodeId/refresh');
  logInfo('  GET /api/qr/parent/student/:studentId');
  logInfo('  GET /api/qr/parent/qr-codes');
  logInfo('  GET /api/qr/parent/:qrCodeId');
  
  logInfo('\nTeacher Parent Visibility:');
  logInfo('  GET /api/teacher/students/:studentId/parents');
  logInfo('  GET /api/teacher/classes/:classId/parents');
  logInfo('  POST /api/teacher/parents/verify-qr');
  
  logInfo('\nParent Activity & QR Codes:');
  logInfo('  GET /api/parent/children/:studentId/activity');
  logInfo('  GET /api/parent/qr-codes');
  logInfo('  GET /api/parent/qr-code/:studentId');
  
  // Test endpoints that don't require auth (should return 401)
  log('\n📋 Step 3: Testing Endpoint Availability (Expected: 401 Unauthorized)', 'yellow');
  
  const endpoints = [
    { name: 'Track Activity', method: 'POST', url: '/activity/track', data: { studentId: 'test', activityType: 'module_complete' } },
    { name: 'Get Student Timeline', method: 'GET', url: '/activity/student/507f1f77bcf86cd799439011' },
    { name: 'Get Class Activity', method: 'GET', url: '/activity/class/507f1f77bcf86cd799439011' },
    { name: 'Generate QR Code', method: 'POST', url: '/qr/parent/generate', data: { parentId: 'test', studentId: 'test' } },
    { name: 'Verify QR Code', method: 'POST', url: '/qr/parent/verify', data: { qrCodeData: 'test' } },
    { name: 'Get Student Parents', method: 'GET', url: '/teacher/students/507f1f77bcf86cd799439011/parents' },
    { name: 'Get Class Parents', method: 'GET', url: '/teacher/classes/507f1f77bcf86cd799439011/parents' },
    { name: 'Get Parent QR Codes', method: 'GET', url: '/parent/qr-codes' },
    { name: 'Get Child Activity', method: 'GET', url: '/parent/children/507f1f77bcf86cd799439011/activity' }
  ];
  
  let successCount = 0;
  let failCount = 0;
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint.name, endpoint.method, endpoint.url, endpoint.data);
    if (result.status === 401 || result.status === 403) {
      // 401/403 means endpoint exists and is protected (good!)
      successCount++;
      logSuccess(`  Endpoint exists and requires authentication`);
    } else if (result.success) {
      successCount++;
    } else if (result.status === 404) {
      logWarning(`  Endpoint might not be registered or route not found`);
      failCount++;
    } else {
      failCount++;
    }
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  log('\n📊 Test Summary:', 'yellow');
  logSuccess(`Endpoints accessible: ${successCount}`);
  if (failCount > 0) {
    logError(`Endpoints with issues: ${failCount}`);
  }
  
  log('\n✅ Phase 2 Endpoint Testing Complete!', 'green');
  log('\n💡 To test with authentication:', 'blue');
  logInfo('1. Login via POST /api/auth/login');
  logInfo('2. Use the returned accessToken in Authorization header');
  logInfo('3. Run tests with valid user IDs from your database');
  log('\n');
}

main().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  process.exit(1);
});

