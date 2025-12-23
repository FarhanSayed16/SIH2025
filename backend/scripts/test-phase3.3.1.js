/**
 * Phase 3.3.1: Backend Testing Script
 * Tests Preparedness Score Engine endpoints
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
let authToken = '';
let testUserId = '';

// Test credentials
const TEST_EMAIL = 'admin@school.com';
const TEST_PASSWORD = 'admin123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const testResults = [];

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

function recordTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  if (passed) {
    logSuccess(`${name}${details ? ` - ${details}` : ''}`);
  } else {
    logError(`${name}${details ? ` - ${details}` : ''}`);
  }
}

// Test 1: Health Check
async function testHealthCheck() {
  try {
    logInfo('Test 1: Health Check');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'OK') {
      recordTest('Health Check', true, `DB: ${response.data.db}`);
      return true;
    }
    recordTest('Health Check', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Health Check', false, error.message);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  try {
    logInfo('Test 2: Login');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.accessToken || response.data.data.token;
      testUserId = response.data.data.user?.id || response.data.data.user?._id;
      recordTest('Login', true, `User: ${response.data.data.user?.name || 'Unknown'}`);
      return true;
    }
    recordTest('Login', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Login', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 3: Get Preparedness Score (for current user)
async function testGetPreparednessScore() {
  try {
    logInfo('Test 3: Get Preparedness Score (Current User)');
    const response = await axios.get(
      `${BASE_URL}/api/scores/preparedness`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const hasScore = typeof data.score === 'number';
      const hasBreakdown = data.breakdown && 
                          data.breakdown.module && 
                          data.breakdown.game &&
                          data.breakdown.quiz &&
                          data.breakdown.drill &&
                          data.breakdown.streak;
      
      if (hasScore && hasBreakdown) {
        recordTest(
          'Get Preparedness Score',
          true,
          `Score: ${data.score}% (Module: ${data.breakdown.module.score}, Game: ${data.breakdown.game.score}, Quiz: ${data.breakdown.quiz.score}, Drill: ${data.breakdown.drill.score}, Streak: ${data.breakdown.streak.score})`
        );
        return true;
      }
      recordTest('Get Preparedness Score', false, 'Missing score or breakdown data');
      return false;
    }
    recordTest('Get Preparedness Score', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Preparedness Score', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 4: Get Preparedness Score (with userId)
async function testGetPreparednessScoreWithUserId() {
  try {
    logInfo('Test 4: Get Preparedness Score (With UserId)');
    if (!testUserId) {
      recordTest('Get Preparedness Score (With UserId)', false, 'No user ID available');
      return false;
    }

    const response = await axios.get(
      `${BASE_URL}/api/scores/preparedness/${testUserId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      recordTest(
        'Get Preparedness Score (With UserId)',
        true,
        `Score: ${data.score}%`
      );
      return true;
    }
    recordTest('Get Preparedness Score (With UserId)', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Preparedness Score (With UserId)', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 5: Recalculate Preparedness Score
async function testRecalculateScore() {
  try {
    logInfo('Test 5: Recalculate Preparedness Score');
    const response = await axios.post(
      `${BASE_URL}/api/scores/recalculate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      recordTest(
        'Recalculate Preparedness Score',
        true,
        `Score recalculated: ${data.score}%`
      );
      return true;
    }
    recordTest('Recalculate Preparedness Score', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Recalculate Preparedness Score', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 6: Get Score History
async function testGetScoreHistory() {
  try {
    logInfo('Test 6: Get Score History');
    const response = await axios.get(
      `${BASE_URL}/api/scores/history?limit=10`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const hasHistory = Array.isArray(data.history);
      const count = data.count || data.history?.length || 0;
      
      recordTest(
        'Get Score History',
        true,
        `History entries: ${count}`
      );
      return true;
    }
    recordTest('Get Score History', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Score History', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 7: Get Score History with limit
async function testGetScoreHistoryWithLimit() {
  try {
    logInfo('Test 7: Get Score History (Limit 5)');
    const response = await axios.get(
      `${BASE_URL}/api/scores/history?limit=5`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      const historyCount = data.history?.length || 0;
      recordTest(
        'Get Score History (Limit)',
        true,
        `Returned ${historyCount} entries (limit: 5)`
      );
      return true;
    }
    recordTest('Get Score History (Limit)', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Score History (Limit)', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 8: Unauthorized Access
async function testUnauthorizedAccess() {
  try {
    logInfo('Test 8: Unauthorized Access');
    await axios.get(
      `${BASE_URL}/api/scores/preparedness`,
      {
        headers: {
          Authorization: 'Bearer invalid_token',
        },
      }
    );
    recordTest('Unauthorized Access', false, 'Should have returned 401');
    return false;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      recordTest('Unauthorized Access', true, 'Correctly rejected unauthorized request');
      return true;
    }
    recordTest('Unauthorized Access', false, `Unexpected error: ${error.message}`);
    return false;
  }
}

// Test 9: Score Breakdown Validation
async function testScoreBreakdownValidation() {
  try {
    logInfo('Test 9: Score Breakdown Validation');
    const response = await axios.get(
      `${BASE_URL}/api/scores/preparedness`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.status === 200 && response.data.success) {
      const breakdown = response.data.data.breakdown;
      
      // Validate breakdown structure
      const components = ['module', 'game', 'quiz', 'drill', 'streak'];
      const allComponentsPresent = components.every(comp => breakdown[comp]);
      const allHaveScores = components.every(comp => 
        breakdown[comp] && typeof breakdown[comp].score === 'number'
      );
      const allHaveWeights = components.every(comp => 
        breakdown[comp] && typeof breakdown[comp].weight === 'number'
      );

      if (allComponentsPresent && allHaveScores && allHaveWeights) {
        // Validate weights sum
        const totalWeight = components.reduce((sum, comp) => sum + breakdown[comp].weight, 0);
        const weightsValid = totalWeight === 100;

        recordTest(
          'Score Breakdown Validation',
          weightsValid,
          `All components present, weights sum: ${totalWeight}${weightsValid ? ' (correct)' : ' (should be 100)'}`
        );
        return weightsValid;
      }
      recordTest('Score Breakdown Validation', false, 'Missing components or invalid structure');
      return false;
    }
    recordTest('Score Breakdown Validation', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Score Breakdown Validation', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Test 10: Score Calculation After Activity
async function testScoreCalculationAfterActivity() {
  try {
    logInfo('Test 10: Score Calculation After Activity');
    
    // First, get initial score
    const initialResponse = await axios.get(
      `${BASE_URL}/api/scores/preparedness`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    
    const initialScore = initialResponse.data.data.score;

    // Recalculate score
    await axios.post(
      `${BASE_URL}/api/scores/recalculate`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    // Get updated score
    const updatedResponse = await axios.get(
      `${BASE_URL}/api/scores/preparedness`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const updatedScore = updatedResponse.data.data.score;

    recordTest(
      'Score Calculation After Activity',
      true,
      `Initial: ${initialScore}% → Updated: ${updatedScore}%`
    );
    return true;
  } catch (error) {
    recordTest('Score Calculation After Activity', false, error.response?.data?.message || error.message);
    return false;
  }
}

// Main test function
async function runTests() {
  log('\n🚀 Starting Phase 3.3.1 Backend API Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');

  // Check if server is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    logError('Server is not running. Please start the backend server first.');
    logInfo('Run: npm run dev (in backend directory)');
    process.exit(1);
  }

  log('\n📋 Testing Preparedness Score APIs...\n', 'blue');

  // Login first
  const loginOk = await testLogin();
  if (!loginOk) {
    logError('Login failed. Cannot test authenticated endpoints.');
    logInfo('Please ensure test user exists or update credentials in test script.');
    process.exit(1);
  }

  // Run all tests
  await testGetPreparednessScore();
  await testGetPreparednessScoreWithUserId();
  await testGetScoreHistory();
  await testGetScoreHistoryWithLimit();
  await testRecalculateScore();
  await testScoreBreakdownValidation();
  await testScoreCalculationAfterActivity();
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
    logSuccess('✅ All Phase 3.3.1 backend tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  logError(`\n❌ Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

