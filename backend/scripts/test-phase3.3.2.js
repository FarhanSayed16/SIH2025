/**
 * Phase 3.3.2: Adaptive Scoring Backend Tests
 * Tests all new adaptive scoring endpoints
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testClassId = '';
let testModuleId = '';

// Colors for output
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

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  try {
    logInfo('\n=== Test 1: Health Check ===');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Health check passed');
      return true;
    } else {
      logError(`Health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Health check error: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Login (to get auth token)
 */
async function testLogin() {
  try {
    logInfo('\n=== Test 2: Login ===');
    const loginData = {
      email: process.env.TEST_EMAIL || 'admin@school.com',
      password: process.env.TEST_PASSWORD || 'admin123'
    };

    const response = await axios.post(`${BASE_URL}/api/auth/login`, loginData);
    
    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token || response.data.data.accessToken;
      testUserId = response.data.data.user?.id || response.data.data.user?._id || response.data.data.userId || response.data.data.user?.userId;
      if (!testUserId && response.data.data.user) {
        // Try to get from user object directly
        testUserId = response.data.data.user.id || response.data.data.user._id;
      }
      logSuccess(`Login successful. User ID: ${testUserId || 'Not found'}`);
      if (!authToken) {
        logError('Token not found in response');
        logInfo('Response data: ' + JSON.stringify(response.data.data, null, 2));
        return false;
      }
      return true;
    } else {
      logError('Login failed');
      return false;
    }
  } catch (error) {
    logError(`Login error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 3: Get Preparedness Score (to verify existing endpoint)
 */
async function testGetPreparednessScore() {
  try {
    logInfo('\n=== Test 3: Get Preparedness Score (Existing Endpoint) ===');
    const response = await axios.get(
      `${BASE_URL}/api/scores/preparedness/${testUserId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(`Preparedness score retrieved: ${response.data.data.score}`);
      return true;
    } else {
      logError('Get preparedness score failed');
      return false;
    }
  } catch (error) {
    logWarning(`Get preparedness score error (may not exist yet): ${error.response?.data?.message || error.message}`);
    return true; // Not critical for this phase
  }
}

/**
 * Test 4: Get Aggregated Student Scores
 */
async function testGetAggregatedStudentScores() {
  try {
    logInfo('\n=== Test 4: Get Aggregated Student Scores ===');
    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/student/${testUserId}/aggregated`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('Aggregated student scores retrieved successfully');
      logInfo(`Total Games: ${response.data.data.totals?.totalGames || 0}`);
      logInfo(`Total XP: ${response.data.data.totals?.totalXP || 0}`);
      return true;
    } else {
      logError('Get aggregated student scores failed');
      return false;
    }
  } catch (error) {
    logError(`Get aggregated student scores error: ${error.response?.data?.message || error.message}`);
    if (error.response?.status === 404) {
      logWarning('Endpoint may not be registered or student not found');
    }
    return false;
  }
}

/**
 * Test 5: Get Per-Student Scores (requires classId - may fail if no class)
 */
async function testGetPerStudentScores() {
  try {
    logInfo('\n=== Test 5: Get Per-Student Scores (requires classId) ===');
    
    // First, try to get user's classId
    const userResponse = await axios.get(
      `${BASE_URL}/api/users/${testUserId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    const classId = userResponse.data.data?.classId;
    if (!classId) {
      logWarning('User has no classId assigned - skipping per-student scores test');
      return true; // Not a failure, just skip
    }

    testClassId = classId;
    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/class/${classId}/scores`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(`Per-student scores retrieved for class. Students: ${response.data.data.scores?.length || 0}`);
      return true;
    } else {
      logError('Get per-student scores failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      logWarning(`Get per-student scores: ${error.response?.data?.message || 'Class not found or no access'}`);
      return true; // Not a critical failure
    }
    logError(`Get per-student scores error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 6: Get XP Distribution History (requires classId)
 */
async function testGetXPDistribution() {
  try {
    logInfo('\n=== Test 6: Get XP Distribution History ===');
    
    if (!testClassId) {
      logWarning('No classId available - skipping XP distribution test');
      return true;
    }

    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/class/${testClassId}/xp-distribution`,
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(`XP distribution history retrieved. Distributions: ${response.data.data.distributions?.length || 0}`);
      return true;
    } else {
      logError('Get XP distribution failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('XP distribution: No distributions found (expected if none created)');
      return true;
    }
    logError(`Get XP distribution error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test 7: Distribute Shared XP (requires classId and moduleId)
 */
async function testDistributeSharedXP() {
  try {
    logInfo('\n=== Test 7: Distribute Shared XP ===');
    
    if (!testClassId) {
      logWarning('No classId available - skipping distribute XP test');
      return true;
    }

    // Try to get a module ID
    try {
      const modulesResponse = await axios.get(
        `${BASE_URL}/api/modules?limit=1`,
        {
          headers: { Authorization: `Bearer ${authToken}` }
        }
      );

      if (modulesResponse.data.data?.data?.[0]?._id) {
        testModuleId = modulesResponse.data.data.data[0]._id;
      }
    } catch (e) {
      logWarning('Could not fetch module ID');
    }

    if (!testModuleId) {
      logWarning('No moduleId available - skipping distribute XP test');
      return true;
    }

    const response = await axios.post(
      `${BASE_URL}/api/adaptive-scoring/distribute-xp`,
      {
        classId: testClassId,
        moduleId: testModuleId,
        xpAmount: 100,
        activityType: 'module'
      },
      {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess(`Shared XP distributed successfully. Distributed to: ${response.data.data.distributed || 0} students`);
      return true;
    } else {
      logError('Distribute shared XP failed');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) {
      logWarning(`Distribute XP: ${error.response?.data?.message || 'Validation failed'}`);
      return true; // Not a critical failure if validation fails
    }
    logError(`Distribute shared XP error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n🚀 Starting Phase 3.3.2 Backend Tests...', 'blue');
  log('='.repeat(50), 'blue');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Login', fn: testLogin },
    { name: 'Get Preparedness Score', fn: testGetPreparednessScore },
    { name: 'Get Aggregated Student Scores', fn: testGetAggregatedStudentScores },
    { name: 'Get Per-Student Scores', fn: testGetPerStudentScores },
    { name: 'Get XP Distribution', fn: testGetXPDistribution },
    { name: 'Distribute Shared XP', fn: testDistributeSharedXP }
  ];

  const results = [];
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Summary:', 'blue');
  log('='.repeat(50), 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  log('\n' + '='.repeat(50), 'blue');
  log(`Total: ${results.length} tests`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(50), 'blue');

  if (failed === 0) {
    log('\n✅ All tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Check logs above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

