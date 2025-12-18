/**
 * Comprehensive Test Script for Phase 2 Endpoints
 * Tests all new API endpoints with proper error handling
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
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

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

// Test helper
async function testEndpoint(name, method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true // Don't throw on any status
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    // 401/403 means endpoint exists and requires auth (good!)
    if (response.status === 401 || response.status === 403) {
      logSuccess(`${name}: Endpoint exists and requires authentication (${response.status})`);
      return { success: true, status: response.status, requiresAuth: true };
    }
    
    // 400 means endpoint exists but validation failed (good!)
    if (response.status === 400) {
      logSuccess(`${name}: Endpoint exists, validation working (${response.status})`);
      return { success: true, status: response.status, validationWorking: true };
    }
    
    // 200-299 means success
    if (response.status >= 200 && response.status < 300) {
      logSuccess(`${name}: Success (${response.status})`);
      return { success: true, status: response.status, data: response.data };
    }
    
    // 404 means endpoint not found
    if (response.status === 404) {
      logError(`${name}: Endpoint not found (404)`);
      return { success: false, status: 404 };
    }
    
    logInfo(`${name}: Status ${response.status}`);
    return { success: response.status < 400, status: response.status };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError(`${name}: Server not running`);
      return { success: false, error: 'Server not running' };
    }
    logError(`${name}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  log('\n🚀 Phase 2 Comprehensive Endpoint Testing\n', 'cyan');
  
  // Test 1: Health Check
  logSection('1. Health Check');
  await testEndpoint('Health Check', 'GET', '/health');
  
  // Test 2: Activity Tracking Endpoints
  logSection('2. Activity Tracking Endpoints');
  await testEndpoint(
    'Track Activity',
    'POST',
    '/activity/track',
    {
      studentId: '507f1f77bcf86cd799439011',
      activityType: 'module_complete',
      activityData: { moduleId: 'test', moduleName: 'Test Module' }
    }
  );
  
  await testEndpoint(
    'Get Student Timeline',
    'GET',
    '/activity/student/507f1f77bcf86cd799439011?limit=10&page=1'
  );
  
  await testEndpoint(
    'Get Class Activity',
    'GET',
    '/activity/class/507f1f77bcf86cd799439011'
  );
  
  // Test 3: QR Code Endpoints
  logSection('3. Parent QR Code Endpoints');
  await testEndpoint(
    'Generate QR Code',
    'POST',
    '/qr/parent/generate',
    {
      parentId: '507f1f77bcf86cd799439011',
      studentId: '507f1f77bcf86cd799439012'
    }
  );
  
  await testEndpoint(
    'Verify QR Code',
    'POST',
    '/qr/parent/verify',
    {
      qrCodeData: 'test-encrypted-data',
      location: { lat: 12.9716, lng: 77.5946 }
    }
  );
  
  await testEndpoint(
    'Get Student QR Codes',
    'GET',
    '/qr/parent/student/507f1f77bcf86cd799439011'
  );
  
  await testEndpoint(
    'Get Parent QR Codes',
    'GET',
    '/qr/parent/qr-codes'
  );
  
  await testEndpoint(
    'Get QR Code Details',
    'GET',
    '/qr/parent/507f1f77bcf86cd799439011'
  );
  
  await testEndpoint(
    'Refresh QR Code',
    'POST',
    '/qr/parent/507f1f77bcf86cd799439011/refresh'
  );
  
  // Test 4: Teacher Parent Visibility Endpoints
  logSection('4. Teacher Parent Visibility Endpoints');
  await testEndpoint(
    'Get Student Parents',
    'GET',
    '/teacher/students/507f1f77bcf86cd799439011/parents'
  );
  
  await testEndpoint(
    'Get Class Parents',
    'GET',
    '/teacher/classes/507f1f77bcf86cd799439011/parents'
  );
  
  await testEndpoint(
    'Verify Parent by QR',
    'POST',
    '/teacher/parents/verify-qr',
    {
      qrCodeData: 'test-encrypted-data',
      location: { lat: 12.9716, lng: 77.5946 }
    }
  );
  
  // Test 5: Parent Activity & QR Code Endpoints
  logSection('5. Parent Activity & QR Code Endpoints');
  await testEndpoint(
    'Get Child Activity Timeline',
    'GET',
    '/parent/children/507f1f77bcf86cd799439011/activity?limit=10&page=1'
  );
  
  await testEndpoint(
    'Get Parent QR Codes',
    'GET',
    '/parent/qr-codes'
  );
  
  await testEndpoint(
    'Get Child QR Code',
    'GET',
    '/parent/qr-code/507f1f77bcf86cd799439011'
  );
  
  // Summary
  logSection('Test Summary');
  logSuccess('All endpoints have been tested!');
  logInfo('Expected results:');
  logInfo('  - 401/403: Endpoint exists and requires authentication ✅');
  logInfo('  - 400: Endpoint exists and validation is working ✅');
  logInfo('  - 404: Endpoint not found or route not registered ❌');
  logInfo('  - 200-299: Endpoint working with provided credentials ✅');
  log('\n💡 To test with full functionality:', 'yellow');
  logInfo('1. Login via POST /api/auth/login');
  logInfo('2. Use the accessToken in Authorization: Bearer <token> header');
  logInfo('3. Use valid IDs from your database');
  log('\n');
}

main().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  process.exit(1);
});

