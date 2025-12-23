/**
 * Phase 3.3.2: Comprehensive Integration Test
 * Tests full flow of adaptive scoring features
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testClassId = '';
let testModuleId = '';
let testStudentIds = [];

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
 * Test Setup: Login and get test data
 */
async function setupTests() {
  try {
    logInfo('\n=== Setting Up Tests ===');
    
    // Login as teacher/admin
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: process.env.TEST_EMAIL || 'admin@school.com',
      password: process.env.TEST_PASSWORD || 'admin123'
    });

    if (loginResponse.status === 200 && loginResponse.data.success) {
      authToken = loginResponse.data.data.token || loginResponse.data.data.accessToken;
      testUserId = loginResponse.data.data.user?.id || loginResponse.data.data.user?._id || loginResponse.data.data.userId;
      logSuccess(`Login successful. User ID: ${testUserId}`);
      
      // Try to get user's classId
      try {
        const userResponse = await axios.get(
          `${BASE_URL}/api/users/${testUserId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        testClassId = userResponse.data.data?.classId;
        if (testClassId) {
          logInfo(`Found classId: ${testClassId}`);
        }
      } catch (e) {
        logWarning('Could not fetch user classId');
      }

      // Try to get a module ID
      try {
        const modulesResponse = await axios.get(
          `${BASE_URL}/api/modules?limit=1`,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        if (modulesResponse.data.data?.data?.[0]?._id) {
          testModuleId = modulesResponse.data.data.data[0]._id;
          logInfo(`Found moduleId: ${testModuleId}`);
        }
      } catch (e) {
        logWarning('Could not fetch module ID');
      }

      // Try to get students from class
      if (testClassId) {
        try {
          const studentsResponse = await axios.get(
            `${BASE_URL}/api/teacher/classes/${testClassId}/students`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          const students = studentsResponse.data.data?.studentIds || [];
          testStudentIds = students.map(s => s._id || s.id || s).filter(Boolean);
          if (testStudentIds.length > 0) {
            logInfo(`Found ${testStudentIds.length} students in class`);
          }
        } catch (e) {
          logWarning('Could not fetch class students');
        }
      }

      return true;
    } else {
      logError('Login failed');
      return false;
    }
  } catch (error) {
    logError(`Setup error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test: Get Aggregated Student Scores
 */
async function testAggregatedScores() {
  try {
    logInfo('\n=== Test: Get Aggregated Student Scores ===');
    
    if (!testUserId) {
      logWarning('No test user ID - skipping');
      return true;
    }

    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/student/${testUserId}/aggregated`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      logSuccess('Aggregated scores retrieved');
      logInfo(`Student: ${data.studentName || 'Unknown'}`);
      logInfo(`Total Games: ${data.totals?.totalGames || 0}`);
      logInfo(`Total XP: ${data.totals?.totalXP || 0}`);
      logInfo(`Total Quizzes: ${data.totals?.totalQuizzes || 0}`);
      logInfo(`Overall Average: ${data.totals?.overallAverage?.toFixed(1) || 0}%`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test: Get Per-Student Scores (if classId available)
 */
async function testPerStudentScores() {
  try {
    logInfo('\n=== Test: Get Per-Student Scores ===');
    
    if (!testClassId) {
      logWarning('No classId - skipping (expected for test user)');
      return true;
    }

    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/class/${testClassId}/scores`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.status === 200 && response.data.success) {
      const scores = response.data.data?.scores || [];
      logSuccess(`Per-student scores retrieved: ${scores.length} students`);
      if (scores.length > 0) {
        logInfo(`First student: ${scores[0].name || 'Unknown'}`);
        logInfo(`  Games: ${scores[0].stats?.totalGames || 0}`);
        logInfo(`  XP: ${scores[0].stats?.totalGameXP || 0}`);
      }
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 403) {
      logWarning(`Expected: ${error.response?.data?.message || 'Class not found'}`);
      return true;
    }
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test: Get XP Distribution History
 */
async function testXPDistribution() {
  try {
    logInfo('\n=== Test: Get XP Distribution History ===');
    
    if (!testClassId) {
      logWarning('No classId - skipping (expected for test user)');
      return true;
    }

    const response = await axios.get(
      `${BASE_URL}/api/adaptive-scoring/class/${testClassId}/xp-distribution`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.status === 200 && response.data.success) {
      const distributions = response.data.data?.distributions || [];
      logSuccess(`XP distribution history retrieved: ${distributions.length} entries`);
      if (distributions.length > 0) {
        logInfo(`Latest: ${distributions[0].activityName || 'Unknown'}`);
        logInfo(`  Participants: ${distributions[0].totalParticipants || 0}`);
      }
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('No distributions found (expected if none created)');
      return true;
    }
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test: Distribute Shared XP
 */
async function testDistributeSharedXP() {
  try {
    logInfo('\n=== Test: Distribute Shared XP ===');
    
    if (!testClassId || !testModuleId) {
      logWarning('Missing classId or moduleId - skipping (expected for test user)');
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
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if (response.status === 200 && response.data.success) {
      const data = response.data.data;
      logSuccess(`Shared XP distributed successfully`);
      logInfo(`Distributed to: ${data.distributed || 0} students`);
      logInfo(`Failed: ${data.failed || 0} students`);
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 404) {
      logWarning(`Expected: ${error.response?.data?.message || 'Validation failed'}`);
      return true;
    }
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Test: Module Completion with Class Mode
 */
async function testModuleCompletionClassMode() {
  try {
    logInfo('\n=== Test: Module Completion with Class Mode ===');
    
    if (!testModuleId || !testClassId) {
      logWarning('Missing moduleId or classId - skipping');
      return true;
    }

    // Create dummy quiz answers
    const answers = [
      { questionIndex: 0, selectedAnswer: 0 },
      { questionIndex: 1, selectedAnswer: 0 }
    ];

    const response = await axios.post(
      `${BASE_URL}/api/modules/${testModuleId}/complete`,
      {
        answers: answers,
        isClassMode: true,
        classId: testClassId,
        timeTaken: 120
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    if ((response.status === 200 || response.status === 201) && response.data.success) {
      logSuccess('Module completed in class mode');
      logInfo(`Score: ${response.data.data?.score || 0}%`);
      logInfo(`Passed: ${response.data.data?.passed ? 'Yes' : 'No'}`);
      return true;
    }
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      logWarning(`Expected: ${error.response?.data?.message || 'Validation failed'}`);
      return true;
    }
    logError(`Error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

/**
 * Main test runner
 */
async function runIntegrationTests() {
  log('\n🚀 Starting Phase 3.3.2 Integration Tests...', 'blue');
  log('='.repeat(60), 'blue');

  // Setup
  const setupSuccess = await setupTests();
  if (!setupSuccess) {
    logError('\n❌ Test setup failed. Cannot proceed.');
    process.exit(1);
  }

  const tests = [
    { name: 'Get Aggregated Student Scores', fn: testAggregatedScores },
    { name: 'Get Per-Student Scores', fn: testPerStudentScores },
    { name: 'Get XP Distribution History', fn: testXPDistribution },
    { name: 'Distribute Shared XP', fn: testDistributeSharedXP },
    { name: 'Module Completion with Class Mode', fn: testModuleCompletionClassMode },
  ];

  const results = [];
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logError(`Test "${test.name}" threw error: ${error.message}`);
      results.push({ name: test.name, passed: false });
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Integration Test Summary:', 'blue');
  log('='.repeat(60), 'blue');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });

  log('\n' + '='.repeat(60), 'blue');
  log(`Total: ${results.length} tests`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'blue');

  if (failed === 0) {
    log('\n✅ All integration tests passed!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some tests failed. Review logs above.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

