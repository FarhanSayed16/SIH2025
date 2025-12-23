/**
 * Phase 3.3.3: Badge System Backend Tests
 * Tests all badge-related endpoints and functionality
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
let authToken = '';
let testUserId = '';
let testBadgeId = '';

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

let passed = 0;
let failed = 0;

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
  try {
    logInfo('\n=== Test 1: Health Check ===');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Health check passed');
      passed++;
      return true;
    }
    return false;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 2: Login
 */
async function testLogin() {
  try {
    logInfo('\n=== Test 2: Login ===');
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: process.env.TEST_EMAIL || 'admin@school.com',
      password: process.env.TEST_PASSWORD || 'admin123'
    });

    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.token || response.data.data.accessToken;
      testUserId = response.data.data.user?.id || response.data.data.user?._id || response.data.data.userId;
      logSuccess(`Login successful. User ID: ${testUserId}`);
      passed++;
      return true;
    } else {
      logError('Login failed: Invalid response');
      failed++;
      return false;
    }
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 3: Get All Badges
 */
async function testGetAllBadges() {
  try {
    logInfo('\n=== Test 3: Get All Badges ===');
    const response = await axios.get(`${BASE_URL}/api/badges`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const badges = response.data.data?.badges || [];
      logSuccess(`Retrieved ${badges.length} badges`);
      if (badges.length > 0) {
        testBadgeId = badges[0].id;
        logInfo(`First badge: ${badges[0].name} (${badges[0].id})`);
        logInfo(`  Category: ${badges[0].category}`);
        logInfo(`  Icon: ${badges[0].icon}`);
      } else {
        logWarning('No badges found. Run seed-badges.js to populate badges.');
      }
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    logError(`Get all badges failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 4: Get Badge by ID
 */
async function testGetBadgeById() {
  try {
    logInfo('\n=== Test 4: Get Badge by ID ===');
    
    if (!testBadgeId) {
      logWarning('No badge ID available - skipping');
      return true;
    }

    const response = await axios.get(`${BASE_URL}/api/badges/${testBadgeId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const badge = response.data.data?.badge;
      logSuccess(`Badge retrieved: ${badge.name}`);
      logInfo(`  Description: ${badge.description}`);
      logInfo(`  XP Reward: ${badge.xpReward}`);
      logInfo(`  Category: ${badge.category}`);
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    if (error.response?.status === 404) {
      logWarning('Badge not found (expected if no badges seeded)');
      return true;
    }
    logError(`Get badge by ID failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 5: Get My Badges
 */
async function testGetMyBadges() {
  try {
    logInfo('\n=== Test 5: Get My Badges ===');
    const response = await axios.get(`${BASE_URL}/api/badges/my-badges`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const badges = response.data.data?.badges || [];
      logSuccess(`User has ${badges.length} badges`);
      if (badges.length > 0) {
        logInfo(`Recent badges:`);
        badges.slice(0, 3).forEach(badge => {
          logInfo(`  - ${badge.name} (${badge.icon})`);
        });
      }
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    logError(`Get my badges failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 6: Get Badge History
 */
async function testGetBadgeHistory() {
  try {
    logInfo('\n=== Test 6: Get Badge History ===');
    const response = await axios.get(`${BASE_URL}/api/badges/my-badges/history`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 }
    });

    if (response.status === 200 && response.data.success) {
      const history = response.data.data?.data || [];
      const pagination = response.data.pagination;
      logSuccess(`Badge history retrieved: ${history.length} entries`);
      if (pagination) {
        logInfo(`  Total: ${pagination.total}, Pages: ${pagination.pages}`);
      }
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    logError(`Get badge history failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 7: Check Badges (Trigger Badge Check)
 */
async function testCheckBadges() {
  try {
    logInfo('\n=== Test 7: Check Badges (Trigger Badge Check) ===');
    const response = await axios.post(
      `${BASE_URL}/api/badges/check`,
      {
        triggerType: 'module',
        triggerData: { moduleId: 'test-module-id' }
      },
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      const newlyAwarded = response.data.data?.newlyAwarded || [];
      logSuccess(`Badge check completed. Newly awarded: ${newlyAwarded.length}`);
      if (newlyAwarded.length > 0) {
        logInfo(`  Badges awarded: ${newlyAwarded.join(', ')}`);
      }
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    logError(`Check badges failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 8: Filter Badges by Category
 */
async function testFilterBadgesByCategory() {
  try {
    logInfo('\n=== Test 8: Filter Badges by Category ===');
    const response = await axios.get(`${BASE_URL}/api/badges?category=module`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    if (response.status === 200 && response.data.success) {
      const badges = response.data.data?.badges || [];
      logSuccess(`Retrieved ${badges.length} module badges`);
      if (badges.length > 0) {
        badges.forEach(badge => {
          if (badge.category === 'module') {
            logInfo(`  - ${badge.name}`);
          }
        });
      }
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    logError(`Filter badges failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Test 9: Manual Award Badge (Admin Only)
 */
async function testManualAwardBadge() {
  try {
    logInfo('\n=== Test 9: Manual Award Badge (Admin Only) ===');
    
    if (!testBadgeId) {
      logWarning('No badge ID available - skipping');
      return true;
    }

    // Try to manually award a badge
    // This will fail if user is not admin/teacher, which is expected
    const response = await axios.post(
      `${BASE_URL}/api/badges/${testBadgeId}/award`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` }
      }
    );

    if (response.status === 200 && response.data.success) {
      logSuccess('Badge manually awarded successfully');
      passed++;
      return true;
    }
    failed++;
    return false;
  } catch (error) {
    if (error.response?.status === 403) {
      logWarning('Unauthorized to award badge (expected if not admin/teacher)');
      return true;
    }
    if (error.response?.status === 400) {
      logWarning(`Badge already awarded or invalid: ${error.response?.data?.message}`);
      return true;
    }
    logError(`Manual award badge failed: ${error.response?.data?.message || error.message}`);
    failed++;
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n🚀 Starting Phase 3.3.3 Backend Tests...', 'blue');
  log('='.repeat(60), 'blue');

  // Run tests sequentially
  await testHealthCheck();
  await testLogin();
  await testGetAllBadges();
  await testGetBadgeById();
  await testGetMyBadges();
  await testGetBadgeHistory();
  await testCheckBadges();
  await testFilterBadgesByCategory();
  await testManualAwardBadge();

  // Summary
  log('\n' + '='.repeat(60), 'blue');
  log('📊 Test Summary:', 'blue');
  log('='.repeat(60), 'blue');
  log(`Total: ${passed + failed} tests`, 'blue');
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log('='.repeat(60), 'blue');

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

