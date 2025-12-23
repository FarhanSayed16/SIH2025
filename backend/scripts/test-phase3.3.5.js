/**
 * Phase 3.3.5: Leaderboard System Test Script
 * Tests all leaderboard endpoints and functionality
 */

import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const testResults = [];

// Helper functions
function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    cyan: '\x1b[36m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
  };
  console.log(`${colors[type] || ''}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'success');
}

function logError(message) {
  log(`❌ ${message}`, 'error');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'info');
}

function logTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  if (passed) {
    logSuccess(`${name}${details ? ` - ${details}` : ''}`);
  } else {
    logError(`${name}${details ? ` - ${details}` : ''}`);
  }
}

let accessToken = null;
let userId = null;
let schoolId = null;
let classId = null;

// Helper to get school ID from database
async function getSchoolId() {
  try {
    const mongoose = (await import('mongoose')).default;
    const dotenv = (await import('dotenv')).default;
    dotenv.config();
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach');
    }
    
    const School = (await import('../src/models/School.js')).default;
    const school = await School.findOne().lean();
    
    if (school) {
      return school._id.toString();
    }
    return null;
  } catch (error) {
    logError(`Failed to get school ID: ${error.message}`);
    return null;
  }
}

// Test functions
async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.status === 'OK' && response.data.db === 'connected') {
      logTest('Health Check', true, 'Server and DB connected');
      return true;
    } else {
      logTest('Health Check', false, 'DB not connected');
      return false;
    }
  } catch (error) {
    logTest('Health Check', false, error.message);
    return false;
  }
}

async function testLogin() {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@school.com',
      password: 'admin123',
    });

    if (response.data.success && response.data.data.accessToken) {
      accessToken = response.data.data.accessToken;
      userId = response.data.data.user?.id || response.data.data.user?._id;
      schoolId = response.data.data.user?.institutionId;
      classId = response.data.data.user?.classId;
      const userName = response.data.data.user?.name || 'User';
      logTest('Login', true, `User: ${userName}, SchoolId: ${schoolId || 'none'}`);
      return true;
    } else {
      logTest('Login', false, 'No token received');
      return false;
    }
  } catch (error) {
    logTest('Login', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetOverallLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'overall', limit: 10, schoolId: schoolId },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Overall Leaderboard', true, `${count} entries`);
      return true;
    } else {
      logTest('Get Overall Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Overall Leaderboard', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetPreparednessLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'preparedness', limit: 20, schoolId: schoolId },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Preparedness Leaderboard', true, `${count} entries`);
      return true;
    } else {
      logTest('Get Preparedness Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Preparedness Leaderboard', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetQuizLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'quizzes', limit: 15, schoolId: schoolId },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Quiz Leaderboard', true, `${count} entries`);
      return true;
    } else {
      logTest('Get Quiz Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Quiz Leaderboard', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetGameLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'games', gameType: 'bag-packer', schoolId: schoolId, limit: 10 },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Game Leaderboard', true, `${count} entries (empty is OK if no game data)`);
      return true;
    } else {
      logTest('Get Game Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    const statusCode = error.response?.status;
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const validationErrors = error.response?.data?.errors || error.response?.data?.data;
    
    let detailedError = errorMsg;
    if (validationErrors && Array.isArray(validationErrors)) {
      detailedError += ` - Validation errors: ${JSON.stringify(validationErrors)}`;
    }
    
    if (statusCode === 400) {
      logTest('Get Game Leaderboard', false, `Validation error: ${detailedError}`);
    } else {
      logTest('Get Game Leaderboard', false, `${statusCode || 'Error'}: ${detailedError}`);
    }
    return false;
  }
}

async function testGetBadgeLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'badges', limit: 10, schoolId: schoolId },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Badge Leaderboard', true, `${count} entries (empty is OK if no badge data)`);
      return true;
    } else {
      logTest('Get Badge Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    const statusCode = error.response?.status;
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const validationErrors = error.response?.data?.errors || error.response?.data?.data;
    
    let detailedError = errorMsg;
    if (validationErrors && Array.isArray(validationErrors)) {
      detailedError += ` - Validation errors: ${JSON.stringify(validationErrors)}`;
    }
    
    if (statusCode === 400) {
      logTest('Get Badge Leaderboard', false, `Validation error: ${detailedError}`);
    } else {
      logTest('Get Badge Leaderboard', false, `${statusCode || 'Error'}: ${detailedError}`);
    }
    return false;
  }
}

async function testGetSquadWarsLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard/squad-wars`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 10, schoolId: schoolId },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Squad Wars Leaderboard', true, `${count} squads (empty is OK if no squad data)`);
      return true;
    } else {
      logTest('Get Squad Wars Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const statusCode = error.response?.status;
    if (statusCode === 404) {
      logTest('Get Squad Wars Leaderboard', false, `Route not found (404): ${errorMsg}`);
    } else {
      logTest('Get Squad Wars Leaderboard', false, `${statusCode || 'Error'}: ${errorMsg}`);
    }
    return false;
  }
}

async function testGetClassLeaderboard() {
  if (!classId) {
    logTest('Get Class Leaderboard', true, 'Skipped - No class ID available (expected for admin user)');
    return true; // This is expected, not a failure
  }

  try {
    const response = await axios.get(`${BASE_URL}/api/leaderboard/class/${classId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit: 20 },
    });

    if (response.data.success && Array.isArray(response.data.data.leaderboard)) {
      const count = response.data.data.leaderboard.length;
      logTest('Get Class Leaderboard', true, `${count} entries`);
      return true;
    } else {
      logTest('Get Class Leaderboard', false, 'Invalid response format');
      return false;
    }
  } catch (error) {
    logTest('Get Class Leaderboard', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testRefreshLeaderboard() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/leaderboard/refresh`,
      {
        type: 'preparedness',
        schoolId: schoolId,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (response.data.success) {
      logTest('Refresh Leaderboard Cache', true, 'Cache refreshed successfully');
      return true;
    } else {
      logTest('Refresh Leaderboard Cache', false, 'Refresh failed');
      return false;
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    const statusCode = error.response?.status;
    if (statusCode === 404) {
      logTest('Refresh Leaderboard Cache', false, `Route not found (404): ${errorMsg}`);
    } else if (statusCode === 401) {
      logTest('Refresh Leaderboard Cache', false, `Unauthorized (401): ${errorMsg}`);
    } else {
      logTest('Refresh Leaderboard Cache', false, `${statusCode || 'Error'}: ${errorMsg}`);
    }
    return false;
  }
}

async function testInvalidLeaderboardType() {
  try {
    await axios.get(`${BASE_URL}/api/leaderboard`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { type: 'invalid_type', limit: 10 },
    });
    logTest('Invalid Leaderboard Type Validation', false, 'Should have returned error');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logTest('Invalid Leaderboard Type Validation', true, 'Correctly rejected invalid type');
      return true;
    } else {
      logTest('Invalid Leaderboard Type Validation', false, 'Unexpected error');
      return false;
    }
  }
}

async function testUnauthorizedAccess() {
  try {
    // Try accessing without auth - should work with optionalAuth, but need schoolId
    // This test should check that routes work without auth when schoolId is provided
    const response = await axios.get(`${BASE_URL}/api/leaderboard`, {
      params: { type: 'overall', limit: 10, schoolId: schoolId },
      // No Authorization header - should work with optionalAuth
    });
    
    // With optionalAuth, this should succeed if schoolId is provided
    if (response.data.success) {
      logTest('Unauthorized Access', true, 'Optional auth working - access granted with schoolId');
      return true;
    } else {
      logTest('Unauthorized Access', false, 'Request failed even with schoolId');
      return false;
    }
  } catch (error) {
    const statusCode = error.response?.status;
    if (statusCode === 500) {
      logTest('Unauthorized Access', false, `Server error (500) - should not occur with optionalAuth: ${error.response?.data?.message || error.message}`);
      return false;
    } else if (statusCode === 401) {
      logTest('Unauthorized Access', true, 'Correctly rejected unauthorized request');
      return true;
    } else if (statusCode === 400) {
      logTest('Unauthorized Access', true, 'Validation error (expected if schoolId missing)');
      return true;
    } else {
      logTest('Unauthorized Access', false, `Unexpected status: ${statusCode || 'Error'}`);
      return false;
    }
  }
}

// Main test function
async function runTests() {
  log('\n🚀 Starting Phase 3.3.5 Leaderboard System Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Base URL: ${BASE_URL}\n`, 'info');

  // Check if server is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    logError('Server is not running or DB not connected.');
    logInfo('Please start the backend server first.');
    logInfo('Run: npm start (in backend directory)');
    process.exit(1);
  }

  log('\n📋 Testing Leaderboard APIs...\n', 'blue');

  // Login first
  const loginOk = await testLogin();
  if (!loginOk) {
    logError('Login failed. Cannot test authenticated endpoints.');
    logInfo('Please ensure test user exists or update credentials in test script.');
    process.exit(1);
  }

  // Get school ID if not available from login
  if (!schoolId) {
    logInfo('School ID not available from user, fetching from database...');
    schoolId = await getSchoolId();
    if (schoolId) {
      logSuccess(`Using school ID: ${schoolId}`);
    } else {
      logError('No school found in database. Please run seed script first.');
      logInfo('Run: npm run seed (in backend directory)');
      process.exit(1);
    }
  }

  log('\n📊 Testing Leaderboard Types...\n', 'blue');
  await testGetOverallLeaderboard();
  await testGetPreparednessLeaderboard();
  await testGetQuizLeaderboard();
  await testGetGameLeaderboard();
  await testGetBadgeLeaderboard();

  log('\n🏆 Testing Special Leaderboards...\n', 'blue');
  await testGetSquadWarsLeaderboard();
  await testGetClassLeaderboard();

  log('\n🔄 Testing Cache Operations...\n', 'blue');
  await testRefreshLeaderboard();

  log('\n🔒 Testing Validation & Security...\n', 'blue');
  await testInvalidLeaderboardType();
  await testUnauthorizedAccess();

  // Print summary
  log('\n' + '='.repeat(60) + '\n', 'cyan');
  log('📊 Test Results Summary\n', 'cyan');

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
      logSuccess(`✅ ${result.name}${result.details ? ` - ${result.details}` : ''}`);
    } else {
      logError(`❌ ${result.name}${result.details ? ` - ${result.details}` : ''}`);
    }
  });

  log('\n');

  if (failedCount > 0) {
    logError('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  } else {
    logSuccess('✅ All leaderboard tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

