/**
 * Phase 3.2.1: Backend Testing Script - Bag Packer Game
 * Tests game score submission, item retrieval, and leaderboard
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
let authToken = '';
let institutionId = '';

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

async function testHealthCheck() {
  try {
    logInfo('Test 1: Health Check');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Server is running');
      return true;
    }
    return false;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  try {
    logInfo('Test 2: Login');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    const responseData = response.data;
    if ((responseData.success === true || responseData.success === 'true') && 
        (responseData.data?.accessToken || responseData.accessToken)) {
      authToken = responseData.data?.accessToken || responseData.accessToken;
      institutionId = responseData.data?.user?.institutionId || responseData.user?.institutionId;
      logSuccess('Login successful');
      return true;
    }
    logError('Login failed');
    return false;
  } catch (error) {
    logError(`Login failed: ${error.message}`);
    return false;
  }
}

async function testGetGameItems() {
  try {
    logInfo('Test 3: Get Game Items');
    const response = await axios.get(`${BASE_URL}/api/games/items`, {
      params: { gameType: 'bag-packer' },
    });

    if (response.status === 200) {
      const data = response.data.data || response.data;
      const items = data.items || [];
      const correctItems = items.filter(i => i.isCorrect).length;
      const wrongItems = items.filter(i => !i.isCorrect).length;
      logSuccess(`Retrieved ${items.length} items (${correctItems} correct, ${wrongItems} wrong)`);
      return items.length > 0;
    }
    return false;
  } catch (error) {
    logError(`Get game items failed: ${error.message}`);
    return false;
  }
}

async function testSubmitScore() {
  try {
    logInfo('Test 4: Submit Game Score');
    const scoreData = {
      gameType: 'bag-packer',
      score: 75,
      maxScore: 100,
      level: 1,
      difficulty: 'easy',
      itemsCorrect: 5,
      itemsIncorrect: 2,
      timeTaken: 120,
      isGroupMode: false,
    };

    const response = await axios.post(
      `${BASE_URL}/api/games/scores`,
      scoreData,
      {
        headers: authToken ? {
          Authorization: `Bearer ${authToken}`,
        } : {},
      }
    );

    if (response.status === 200 || response.status === 201) {
      const data = response.data.data || response.data;
      const gameScore = data.gameScore || data;
      logSuccess(`Score submitted: ${gameScore.score} (XP: ${gameScore.xpEarned || 0})`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Submit score failed: ${error.message}`);
    return false;
  }
}

async function testGetScores() {
  try {
    logInfo('Test 5: Get Game Scores');
    const response = await axios.get(`${BASE_URL}/api/games/scores`, {
      params: { gameType: 'bag-packer', limit: 5 },
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`,
      } : {},
    });

    if (response.status === 200) {
      const data = response.data.data || response.data;
      const scores = data.scores || [];
      logSuccess(`Retrieved ${scores.length} scores`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Get scores failed: ${error.message}`);
    return false;
  }
}

async function testLeaderboard() {
  try {
    logInfo('Test 6: Get Leaderboard');
    const response = await axios.get(
      `${BASE_URL}/api/games/leaderboard/bag-packer`,
      {
        params: { limit: 10 },
      }
    );

    if (response.status === 200) {
      const data = response.data.data || response.data;
      const leaderboard = data.leaderboard || [];
      logSuccess(`Retrieved leaderboard with ${leaderboard.length} entries`);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Get leaderboard failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('\n🧪 Phase 3.2.1: Bag Packer Game Testing\n', 'blue');
  log('='.repeat(50), 'blue');

  const results = {
    passed: 0,
    failed: 0,
  };

  if (!(await testHealthCheck())) {
    logError('Cannot proceed without server connection');
    return;
  }
  results.passed++;

  if (!(await testLogin())) {
    logError('Cannot proceed without authentication');
    return;
  }
  results.passed++;

  if (await testGetGameItems()) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (await testSubmitScore()) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (await testGetScores()) {
    results.passed++;
  } else {
    results.failed++;
  }

  if (await testLeaderboard()) {
    results.passed++;
  } else {
    results.failed++;
  }

  log('\n' + '='.repeat(50), 'blue');
  log('\n📊 Test Results Summary\n', 'blue');
  logSuccess(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    logError(`Failed: ${results.failed}`);
  }

  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  log(`\nPass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✅ All tests passed!', 'green');
  } else {
    log('\n⚠️  Some tests failed.', 'yellow');
  }
}

runTests().catch((error) => {
  logError(`Test runner error: ${error.message}`);
  process.exit(1);
});

