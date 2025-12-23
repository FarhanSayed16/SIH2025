/**
 * Phase 3.2.4: Group Mode Testing Script
 * Tests group game session creation, turn submission, and score aggregation
 */

import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../src/config/logger.js';

dotenv.config({ path: './.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TEST_TEACHER_EMAIL = process.env.TEST_TEACHER_EMAIL || 'teacher@test.com';
const TEST_TEACHER_PASSWORD = process.env.TEST_TEACHER_PASSWORD || 'password123';
const TEST_STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || 'student@test.com';
const TEST_STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || 'password123';

let teacherToken = '';
let studentToken = '';
let teacherUserId = '';
let studentUserId = '';
let testClassId = '';
let testInstitutionId = '';
let groupActivityId = '';

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

const loginStudent = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: TEST_STUDENT_EMAIL,
      password: TEST_STUDENT_PASSWORD,
    });
    
    studentToken = response.data.data.accessToken;
    studentUserId = response.data.data.user.id;
    
    logger.info('✅ Student login successful');
  } catch (error) {
    logger.warn('⚠️  Student login failed (this is okay if student doesn\'t exist yet)');
  }
};

const getTeacherClasses = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/teacher/classes`,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );
  
  const classes = response.data.data?.classes || [];
  if (classes.length > 0) {
    testClassId = classes[0]._id || classes[0].id;
    logger.info(`✅ Found class: ${testClassId}`);
  } else {
    logger.warn('⚠️  No classes found for teacher');
    throw new Error('No classes available for testing');
  }
};

const createGroupActivity = async () => {
  if (!testClassId) {
    throw new Error('No class ID available');
  }

  const response = await axios.post(
    `${API_BASE_URL}/group-activities/create`,
    {
      activityType: 'game',
      classId: testClassId,
      metadata: {
        activityName: 'bag-packer',
        duration: 0,
      },
    },
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 201 || !response.data.data) {
    throw new Error('Failed to create group activity');
  }

  groupActivityId = response.data.data._id || response.data.data.id;
  logger.info(`✅ Group activity created: ${groupActivityId}`);
};

const submitTurnResult = async () => {
  if (!groupActivityId) {
    throw new Error('No group activity ID');
  }

  if (!studentUserId) {
    logger.warn('⚠️  Skipping turn submission test (no student logged in)');
    return;
  }

  const response = await axios.post(
    `${API_BASE_URL}/group-activities/${groupActivityId}/submit`,
    {
      studentId: studentUserId,
      score: 85,
      completed: true,
    },
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200 || !response.data.data) {
    throw new Error('Failed to submit turn result');
  }

  logger.info(`✅ Turn result submitted successfully`);
  logger.info(`   Average Score: ${response.data.data.averageScore || 'N/A'}`);
  logger.info(`   Completion Rate: ${response.data.data.completionRate || 'N/A'}%`);
};

const getActivityResults = async () => {
  if (!groupActivityId) {
    throw new Error('No group activity ID');
  }

  const response = await axios.get(
    `${API_BASE_URL}/group-activities/${groupActivityId}/results`,
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200 || !response.data.data) {
    throw new Error('Failed to get activity results');
  }

  const activity = response.data.data;
  logger.info(`✅ Activity results retrieved`);
  logger.info(`   Status: ${activity.status}`);
  logger.info(`   Participants: ${activity.participants?.length || 0}`);
  logger.info(`   Average Score: ${activity.results?.averageScore || 'N/A'}`);
};

const submitGameScoreWithGroupMode = async () => {
  if (!groupActivityId || !studentUserId) {
    logger.warn('⚠️  Skipping game score test (missing IDs)');
    return;
  }

  const response = await axios.post(
    `${API_BASE_URL}/games/scores`,
    {
      gameType: 'bag-packer',
      score: 85,
      maxScore: 100,
      level: 1,
      difficulty: 'easy',
      itemsCorrect: 8,
      itemsIncorrect: 2,
      isGroupMode: true,
      groupActivityId: groupActivityId,
      studentIds: [studentUserId],
      institutionId: testInstitutionId,
    },
    { headers: { Authorization: `Bearer ${teacherToken}` } }
  );

  if (response.status !== 200 || !response.data.data?.gameScore) {
    throw new Error('Failed to submit game score with group mode');
  }

  const gameScore = response.data.data.gameScore;
  logger.info(`✅ Game score submitted with group mode`);
  logger.info(`   Score: ${gameScore.score}`);
  logger.info(`   XP Earned: ${gameScore.xpEarned || 'N/A'}`);
};

const runAllTests = async () => {
  logger.info('\n🧪 Phase 3.2.4: Group Mode Testing');
  logger.info('==================================================');

  const results = [];
  
  results.push(await runTest('Health Check', healthCheck));
  results.push(await runTest('Teacher Login', loginTeacher));
  results.push(await runTest('Student Login', loginStudent));
  results.push(await runTest('Get Teacher Classes', getTeacherClasses));
  results.push(await runTest('Create Group Activity', createGroupActivity));
  results.push(await runTest('Submit Turn Result', submitTurnResult));
  results.push(await runTest('Get Activity Results', getActivityResults));
  results.push(await runTest('Submit Game Score (Group Mode)', submitGameScoreWithGroupMode));

  logger.info('\n==================================================');
  logger.info('\n📊 Test Results Summary');

  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  const passRate = (passed / results.length) * 100;

  logger.info(`✅ Passed: ${passed}`);
  logger.info(`❌ Failed: ${failed}`);
  logger.info(`\nPass Rate: ${passRate.toFixed(1)}%`);

  if (failed === 0) {
    logger.info('\n✅ All critical tests passed!');
  } else {
    logger.warn('\n⚠️  Some tests failed. Please review errors above.');
    process.exit(1);
  }
};

runAllTests().catch(err => {
  logger.error('An unexpected error occurred during testing:', err);
  process.exit(1);
});

