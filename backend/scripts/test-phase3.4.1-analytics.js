/**
 * Phase 3.4.1: Analytics API Test Script
 * Tests all analytics endpoints
 */

import axios from 'axios';
import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000/api';
const BASE_URL_NO_API = process.env.BASE_URL_NO_API || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const logInfo = (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`);
const logSuccess = (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`);
const logError = (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`);
const logWarning = (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);

let authToken = null;
let userId = null;
let institutionId = null;

const results = [];

// Test helper function
const test = async (name, testFn) => {
  try {
    logInfo(`Testing: ${name}...`);
    const result = await testFn();
    logSuccess(`${name} passed`);
    results.push({ name, passed: true, details: result });
    return { name, passed: true, details: result };
  } catch (error) {
    const errorMsg = error.message || error.toString() || 'Unknown error';
    logError(`${name} failed: ${errorMsg}`);
    if (error.stack && process.env.DEBUG) {
      console.error('Stack trace:', error.stack);
    }
    results.push({ name, passed: false, error: errorMsg });
    return { name, passed: false, error: errorMsg };
  }
};

// Login function
const login = async () => {
  const credentials = [
    { email: 'admin@school.com', password: 'admin123' },
    { email: 'admin@kavach.com', password: 'admin123' },
    { email: 'teacher@kavach.com', password: 'teacher123' },
    { email: 'rohan.sharma@student.com', password: 'student123' }
  ];

  let lastError = null;
  for (const cred of credentials) {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: cred.email,
        password: cred.password
      }, { timeout: 5000 });

      if (response.data.token || response.data.data?.accessToken || response.data.data?.token) {
        authToken = response.data.token || response.data.data?.accessToken || response.data.data?.token;
        const user = response.data.user || response.data.data?.user;
        userId = user?.id || user?._id || user?.userId;
        institutionId = user?.institutionId;
        logSuccess(`Logged in as: ${cred.email}`);
        return { token: authToken, userId, institutionId };
      }
    } catch (error) {
      lastError = error;
      if (error.response) {
        logWarning(`Login failed for ${cred.email}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      continue;
    }
  }

  throw new Error(`Failed to login with any test credentials. Last error: ${lastError?.message || 'Unknown'}`);
};

// Get axios config with auth
const getAxiosConfig = () => ({
  headers: {
    Authorization: `Bearer ${authToken}`
  },
  timeout: 10000
});

// Main test function
const runTests = async () => {
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Phase 3.4.1: Analytics API Testing${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  // Test 1: Health Check
  await test('Health Check', async () => {
    const response = await axios.get(`${BASE_URL_NO_API}/health`, { 
      timeout: 10000,
      validateStatus: () => true  // Don't throw on non-2xx
    });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}: ${JSON.stringify(response.data)}`);
    }
    if (response.data && response.data.db !== 'connected') {
      throw new Error(`Database not connected. Status: ${response.data.db}`);
    }
    return response.data;
  });

  // Test 2: Login
  await test('Login', async () => {
    const loginResult = await login();
    if (!loginResult.token) {
      throw new Error('No token received');
    }
    return loginResult;
  });

  if (!authToken) {
    logError('Cannot proceed without authentication token');
    process.exit(1);
  }

  // Test 3: Get Drill Performance Metrics
  await test('Get Drill Performance Metrics', async () => {
    const response = await axios.get(
      `${BASE_URL}/analytics/drills${institutionId ? `?institutionId=${institutionId}` : ''}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!data) {
      throw new Error('No data in response');
    }
    
    logInfo(`  Total Participants: ${data.totalParticipants || 0}`);
    logInfo(`  Avg Evacuation Time: ${data.avgEvacuationTime ? Math.round(data.avgEvacuationTime) : 0}s`);
    
    return data;
  });

  // Test 4: Get Student Progress Metrics
  await test('Get Student Progress Metrics', async () => {
    const queryParams = institutionId ? `?institutionId=${institutionId}` : '';
    const response = await axios.get(
      `${BASE_URL}/analytics/students/progress${queryParams}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!data) {
      throw new Error('No data in response');
    }
    
    logInfo(`  Total Students: ${data.summary?.totalStudents || 0}`);
    logInfo(`  Avg Modules Completed: ${data.summary?.avgModulesCompleted || 0}`);
    logInfo(`  Avg Preparedness Score: ${data.summary?.avgPreparednessScore || 0}`);
    
    return data;
  });

  // Test 5: Get Institution Analytics
  await test('Get Institution Analytics', async () => {
    if (!institutionId) {
      logWarning('  Skipping: No institutionId available');
      return { skipped: true, reason: 'No institutionId' };
    }
    
    const response = await axios.get(
      `${BASE_URL}/analytics/institution?institutionId=${institutionId}`,
      getAxiosConfig()
    );
    
    // This might return 403 if user is not admin, which is expected
    if (response.status === 403) {
      logWarning('  Expected 403: User does not have admin permissions');
      return { skipped: true, reason: 'Not admin', status: 403 };
    }
    
    if (response.status !== 200) {
      throw new Error(`Expected 200 or 403, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!data) {
      throw new Error('No data in response');
    }
    
    logInfo(`  Institution: ${data.institution?.name || 'Unknown'}`);
    logInfo(`  Total Users: ${data.institution?.totalUsers || 0}`);
    logInfo(`  Total Classes: ${data.institution?.totalClasses || 0}`);
    
    return data;
  });

  // Test 6: Get Module Completion Rates
  await test('Get Module Completion Rates', async () => {
    const queryParams = institutionId ? `?institutionId=${institutionId}` : '';
    const response = await axios.get(
      `${BASE_URL}/analytics/modules/completion${queryParams}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!Array.isArray(data)) {
      throw new Error('Expected array of modules');
    }
    
    logInfo(`  Total Modules: ${data.length}`);
    if (data.length > 0) {
      logInfo(`  Top Module: ${data[0].moduleTitle} (${data[0].completionRate}% completion)`);
    }
    
    return data;
  });

  // Test 7: Get Game Performance Analytics
  await test('Get Game Performance Analytics', async () => {
    const queryParams = institutionId ? `?institutionId=${institutionId}` : '';
    const response = await axios.get(
      `${BASE_URL}/analytics/games${queryParams}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!data) {
      throw new Error('No data in response');
    }
    
    logInfo(`  Game Types: ${data.byGameType?.length || 0}`);
    if (data.byGameType && data.byGameType.length > 0) {
      data.byGameType.forEach(game => {
        logInfo(`    - ${game.gameType}: ${game.totalGames} games, avg score: ${game.avgScore}`);
      });
    }
    
    return data;
  });

  // Test 8: Get Quiz Accuracy Trends
  await test('Get Quiz Accuracy Trends', async () => {
    const queryParams = institutionId ? `?institutionId=${institutionId}` : '';
    const response = await axios.get(
      `${BASE_URL}/analytics/quizzes/accuracy${queryParams}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const data = response.data.data;
    if (!data) {
      throw new Error('No data in response');
    }
    
    logInfo(`  Accuracy Trends: ${data.overTime?.length || 0} data points`);
    logInfo(`  Modules Tracked: ${data.byModule?.length || 0}`);
    
    return data;
  });

  // Test 9: Get Drill Metrics with Date Range
  await test('Get Drill Metrics with Date Range', async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 1); // Last 30 days
    
    const queryParams = new URLSearchParams({
      ...(institutionId && { institutionId }),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
    
    const response = await axios.get(
      `${BASE_URL}/analytics/drills?${queryParams.toString()}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    logInfo(`  Date Range Query: Success`);
    return response.data.data;
  });

  // Test 10: Get Student Progress for Specific Class
  await test('Get Student Progress with Filters', async () => {
    const queryParams = new URLSearchParams({
      ...(institutionId && { institutionId })
    });
    
    // Try to get a class ID from the institution analytics if available
    // For now, just test the endpoint with institution filter
    const response = await axios.get(
      `${BASE_URL}/analytics/students/progress?${queryParams.toString()}`,
      getAxiosConfig()
    );
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    logInfo(`  Filtered Query: Success`);
    return response.data.data;
  });

  // Print summary
  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}   Test Summary${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const skipped = results.filter(r => r.details?.skipped).length;

  results.forEach(result => {
    if (result.details?.skipped) {
      logWarning(`${result.name}: SKIPPED (${result.details.reason})`);
    } else if (result.passed) {
      logSuccess(`${result.name}`);
    } else {
      logError(`${result.name}: ${result.error}`);
    }
  });

  console.log(`\n${colors.bright}Total Tests: ${results.length}${colors.reset}`);
  console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`);
  if (skipped > 0) {
    console.log(`${colors.yellow}⚠ Skipped: ${skipped}${colors.reset}`);
  }
  if (failed > 0) {
    console.log(`${colors.red}❌ Failed: ${failed}${colors.reset}`);
  }

  console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

  return { passed, failed, skipped, total: results.length };
};

// Run tests
runTests()
  .then(summary => {
    if (summary.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  })
  .catch(error => {
    logError(`Test execution error: ${error.message}`);
    console.error(error);
    process.exit(1);
  });

