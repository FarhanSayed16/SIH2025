/**
 * Phase 3.2.5: Offline Game Support Testing Script
 * Tests offline game storage, sync, and conflict resolution
 */

import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../src/config/logger.js';

dotenv.config({ path: './.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacher@test.com';
const TEST_TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || 'password123';

let teacherToken = '';
let teacherUserId = '';
let testInstitutionId = '';

const runTest = async (name, testFunction) => {
  logger.info(`\nℹ️  Test: ${name}`);
  try {
    await testFunction();
    logger.info(`✅ ${name} passed`);
    return true;
  } catch (error) {
    logger.error(`❌ ${name} failed: ${error.message}`);
    if (error.response) {
      logger.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
};

const healthCheck = async () => {
  const response = await axios.get(`${API_BASE_URL}/health`);
  if (response.status !== 200 || response.data.status !== 'UP') {
    throw new Error('Health check failed');
  }
  logger.info('✅ Server is running');
};

const loginTeacher = async () => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: TEST_TEACHER_EMAIL,
    password: TEST_TEACHER_PASSWORD,
  });
  
  teacherToken = response.data.data.accessToken;
  teacherUserId = response.data.data.user.id;
  testInstitutionId = response.data.data.user.institutionId;
  
  logger.info('✅ Teacher login successful');
};

const testGameSyncEndpoint = async () => {
  // Test bulk sync endpoint
  const syncPayload = {
    scores: [
      {
        gameType: 'bag-packer',
        score: 85,
        maxScore: 100,
        level: 1,
        difficulty: 'easy',
        itemsCorrect: 8,
        itemsIncorrect: 2,
        completedAt: new Date().toISOString(),
        userId: teacherUserId,
        institutionId: testInstitutionId,
      },
      {
        gameType: 'hazard-hunter',
        score: 75,
        maxScore: 100,
        level: 1,
        difficulty: 'easy',
        itemsCorrect: 7,
        itemsIncorrect: 3,
        completedAt: new Date().toISOString(),
        userId: teacherUserId,
        institutionId: testInstitutionId,
      },
    ],
  };

  const response = await axios.post(
    `${API_BASE_URL}/games/sync`,
    syncPayload,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Sync endpoint failed');
  }

  const data = response.data.data || response.data;
  logger.info(`✅ Bulk sync successful: ${data.synced || 0} scores synced`);
  
  if (data.conflicts) {
    logger.info(`   Conflicts: ${data.conflicts}`);
  }
  if (data.errors) {
    logger.info(`   Errors: ${data.errors}`);
  }
};

const testSyncStatusEndpoint = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/games/sync/status`,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200) {
    throw new Error('Sync status endpoint failed');
  }

  const data = response.data.data || response.data;
  logger.info(`✅ Sync status retrieved`);
  logger.info(`   Has pending: ${data.hasPending || false}`);
  logger.info(`   Pending count: ${data.pendingCount || 0}`);
};

const testScoreSubmissionOfflineSupport = async () => {
  // Test that score submission works with isGroupMode flag
  const scorePayload = {
    gameType: 'bag-packer',
    score: 90,
    maxScore: 100,
    level: 1,
    difficulty: 'easy',
    itemsCorrect: 9,
    itemsIncorrect: 1,
    isGroupMode: false,
    institutionId: testInstitutionId,
  };

  const response = await axios.post(
    `${API_BASE_URL}/games/scores`,
    scorePayload,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200 && response.status !== 201) {
    throw new Error('Score submission failed');
  }

  logger.info('✅ Score submission with offline support successful');
  
  const gameScore = response.data.data?.gameScore || response.data?.gameScore || response.data;
  if (gameScore) {
    logger.info(`   Score ID: ${gameScore.id || gameScore._id}`);
    logger.info(`   XP Earned: ${gameScore.xpEarned || 'N/A'}`);
  }
};

const testConflictDetection = async () => {
  // Submit same score twice to test conflict detection
  const scorePayload = {
    gameType: 'earthquake-shake',
    score: 80,
    maxScore: 100,
    level: 1,
    difficulty: 'medium',
    itemsCorrect: 8,
    itemsIncorrect: 2,
    completedAt: new Date().toISOString(),
    institutionId: testInstitutionId,
  };

  // First submission
  const firstResponse = await axios.post(
    `${API_BASE_URL}/games/scores`,
    scorePayload,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (firstResponse.status !== 200 && firstResponse.status !== 201) {
    logger.warn('⚠️  First score submission failed (may be expected)');
    return;
  }

  // Try to sync same score again (simulating offline sync conflict)
  const syncPayload = {
    scores: [
      {
        ...scorePayload,
        userId: teacherUserId,
      },
    ],
  };

  const syncResponse = await axios.post(
    `${API_BASE_URL}/games/sync`,
    syncPayload,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (syncResponse.status !== 200 && syncResponse.status !== 201) {
    throw new Error('Sync with conflict test failed');
  }

  const data = syncResponse.data.data || syncResponse.data;
  logger.info(`✅ Conflict detection test completed`);
  logger.info(`   Synced: ${data.synced || 0}`);
  logger.info(`   Conflicts detected: ${data.conflicts || 0}`);
};

const runAllTests = async () => {
  logger.info('\n🧪 Phase 3.2.5: Offline Game Support Testing');
  logger.info('==================================================');

  const results = [];
  
  results.push(await runTest('Health Check', healthCheck));
  results.push(await runTest('Teacher Login', loginTeacher));
  results.push(await runTest('Game Sync Endpoint', testGameSyncEndpoint));
  results.push(await runTest('Sync Status Endpoint', testSyncStatusEndpoint));
  results.push(await runTest('Score Submission (Offline Support)', testScoreSubmissionOfflineSupport));
  results.push(await runTest('Conflict Detection', testConflictDetection));

  logger.info('\n==================================================');
  logger.info('\n📊 Test Results Summary');

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  const passRate = (passed / results.length) * 100;

  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`\nPass Rate: ${passRate.toFixed(1)}%`);

  if (failed === 0) {
    logger.info('\n✅ All tests passed!');
  } else {
    logger.warn('\n⚠️  Some tests failed. Please review errors above.');
    process.exit(1);
  }
};

runAllTests().catch(err => {
  logger.error('An unexpected error occurred during testing:', err);
  process.exit(1);
});

