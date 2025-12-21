/**
 * Complete Phase 3 Integration Test
 * Tests all Phase 3 features: Modules, Quizzes, Games, Scores, Group Activities
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testModuleId = '';
let testQuizId = '';
let testGameScoreId = '';
let testGroupActivityId = '';

// Test credentials
const TEST_EMAIL = 'admin@school.com';
const TEST_PASSWORD = 'admin123';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const testResults = [];
let passedCount = 0;
let failedCount = 0;

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

function recordTest(name, passed, details = '') {
  testResults.push({ name, passed, details });
  if (passed) {
    passedCount++;
    logSuccess(`${name}${details ? ` - ${details}` : ''}`);
  } else {
    failedCount++;
    logError(`${name}${details ? ` - ${details}` : ''}`);
  }
}

// ========== AUTHENTICATION ==========
async function testLogin() {
  try {
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

// ========== MODULES ==========
async function testGetModules() {
  try {
    const response = await axios.get(`${BASE_URL}/api/modules`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const modules = response.data.data?.modules || response.data.data || [];
      if (modules.length > 0) {
        testModuleId = modules[0]._id || modules[0].id;
        recordTest('Get Modules', true, `${modules.length} modules found`);
        return true;
      }
      recordTest('Get Modules', false, 'No modules found');
      return false;
    }
    recordTest('Get Modules', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Modules', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetModuleById() {
  if (!testModuleId) {
    recordTest('Get Module By ID', false, 'No module ID available');
    return false;
  }
  try {
    const response = await axios.get(`${BASE_URL}/api/modules/${testModuleId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      recordTest('Get Module By ID', true, `Module: ${response.data.data?.title || 'Unknown'}`);
      return true;
    }
    recordTest('Get Module By ID', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Module By ID', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ========== QUIZZES ==========
async function testGenerateAIQuiz() {
  if (!testModuleId) {
    recordTest('Generate AI Quiz', false, 'No module ID available');
    return false;
  }
  try {
    const response = await axios.post(
      `${BASE_URL}/api/ai/generate-quiz`,
      {
        moduleId: testModuleId,
        numQuestions: 3,
        difficulty: 'easy',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    if (response.status === 200 && response.data.success) {
      testQuizId = response.data.data?.quizId || response.data.data?.id;
      recordTest('Generate AI Quiz', true, `Quiz ID: ${testQuizId || 'Generated'}`);
      return true;
    }
    recordTest('Generate AI Quiz', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Generate AI Quiz', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetCachedQuiz() {
  if (!testQuizId) {
    recordTest('Get Cached Quiz', false, 'No quiz ID available');
    return false;
  }
  try {
    const response = await axios.get(`${BASE_URL}/api/ai/quiz/${testQuizId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const questions = response.data.data?.questions || [];
      recordTest('Get Cached Quiz', true, `${questions.length} questions retrieved`);
      return true;
    }
    recordTest('Get Cached Quiz', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Cached Quiz', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ========== GAMES ==========
async function testGetGameItems() {
  try {
    const response = await axios.get(`${BASE_URL}/api/games/items?gameType=bag-packer`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const items = response.data.data?.items || response.data.data || [];
      recordTest('Get Game Items', true, `${items.length} items found`);
      return true;
    }
    recordTest('Get Game Items', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Game Items', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testSubmitGameScore() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/games/scores`,
      {
        gameType: 'bag-packer',
        score: 85,
        maxScore: 100,
        level: 1,
        difficulty: 'easy',
        itemsCorrect: 8,
        itemsIncorrect: 2,
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    if (response.status === 200 || response.status === 201) {
      if (response.data.success !== false) {
        testGameScoreId = response.data.data?._id || response.data.data?.id;
        recordTest('Submit Game Score', true, `Score: ${response.data.data?.score || 85}`);
        return true;
      }
    }
    recordTest('Submit Game Score', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Submit Game Score', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetHazards() {
  try {
    const response = await axios.get(`${BASE_URL}/api/games/hazards?level=1&difficulty=easy`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const hazards = response.data.data?.hazards || [];
      recordTest('Get Hazards', true, `${hazards.length} hazards found`);
      return true;
    }
    recordTest('Get Hazards', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Hazards', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetLeaderboard() {
  try {
    const response = await axios.get(`${BASE_URL}/api/games/leaderboard/bag-packer`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const scores = response.data.data?.scores || response.data.data || [];
      recordTest('Get Leaderboard', true, `${scores.length} entries found`);
      return true;
    }
    recordTest('Get Leaderboard', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Leaderboard', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ========== SCORES ==========
async function testGetPreparednessScore() {
  try {
    const response = await axios.get(`${BASE_URL}/api/scores/preparedness`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const score = response.data.data?.score || 0;
      recordTest('Get Preparedness Score', true, `Score: ${score}%`);
      return true;
    }
    recordTest('Get Preparedness Score', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Preparedness Score', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetScoreHistory() {
  try {
    const response = await axios.get(`${BASE_URL}/api/scores/history?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      const history = response.data.data?.history || [];
      recordTest('Get Score History', true, `${history.length} entries`);
      return true;
    }
    recordTest('Get Score History', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Score History', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ========== GROUP ACTIVITIES ==========
async function testCreateGroupActivity() {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/group-activities/create`,
      {
        activityType: 'game',
        gameType: 'bag-packer',
        classId: 'test-class',
        deviceId: 'test-device-123',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    if (response.status === 200 || response.status === 201) {
      if (response.data.success !== false) {
        testGroupActivityId = response.data.data?._id || response.data.data?.id;
        recordTest('Create Group Activity', true, `Activity ID: ${testGroupActivityId || 'Created'}`);
        return true;
      }
    }
    recordTest('Create Group Activity', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Create Group Activity', false, error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetGroupActivity() {
  if (!testGroupActivityId) {
    recordTest('Get Group Activity', false, 'No activity ID available');
    return false;
  }
  try {
    const response = await axios.get(`${BASE_URL}/api/group-activities/${testGroupActivityId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (response.status === 200 && response.data.success) {
      recordTest('Get Group Activity', true, `Status: ${response.data.data?.status || 'Unknown'}`);
      return true;
    }
    recordTest('Get Group Activity', false, 'Invalid response');
    return false;
  } catch (error) {
    recordTest('Get Group Activity', false, error.response?.data?.message || error.message);
    return false;
  }
}

// ========== MAIN TEST RUNNER ==========
async function runTests() {
  log('\n🚀 Starting Complete Phase 3 Integration Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');

  // Authentication
  log('\n📋 Testing Authentication...\n', 'blue');
  await testLogin();
  if (!authToken) {
    logError('Cannot proceed without authentication token.');
    process.exit(1);
  }

  // Modules
  log('\n📚 Testing Modules...\n', 'blue');
  await testGetModules();
  await testGetModuleById();

  // Quizzes
  log('\n📝 Testing Quizzes...\n', 'blue');
  await testGenerateAIQuiz();
  await testGetCachedQuiz();

  // Games
  log('\n🎮 Testing Games...\n', 'blue');
  await testGetGameItems();
  await testSubmitGameScore();
  await testGetHazards();
  await testGetLeaderboard();

  // Scores
  log('\n📊 Testing Scores...\n', 'blue');
  await testGetPreparednessScore();
  await testGetScoreHistory();

  // Group Activities
  log('\n👥 Testing Group Activities...\n', 'blue');
  await testCreateGroupActivity();
  await testGetGroupActivity();

  // Summary
  log('\n' + '='.repeat(60) + '\n', 'cyan');
  log('📊 Test Results Summary\n', 'cyan');
  logSuccess(`✅ Passed: ${passedCount}`);
  if (failedCount > 0) {
    logError(`❌ Failed: ${failedCount}`);
  }
  logInfo(`📈 Total: ${testResults.length}\n`);

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
    logSuccess('✅ All Phase 3 integration tests passed successfully!\n');
    process.exit(0);
  }
}

runTests().catch(error => {
  logError(`\n❌ Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

