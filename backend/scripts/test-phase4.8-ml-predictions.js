/**
 * Phase 4.8: ML Predictions Backend Test Script
 * Tests all ML prediction endpoints
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

const API_URL = process.env.API_URL || 'http://localhost:3000/api';
const BASE_URL = API_URL.replace('/api', '');

let authToken = null;
let testInstitutionId = null;
let testSchoolId = null;
let testStudentId = null;

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

const logTest = (name, passed, message = '') => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m: ${name}${message ? ' - ' + message : ''}`);

  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
  } else {
    results.failed++;
  }
};

// Test 1: Login
async function testLogin() {
  try {
    const response = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin@school.com',
        password: 'admin123',
      },
      {
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.accessToken) {
      authToken = response.data.data.accessToken;
      testInstitutionId = response.data.data.user?.institutionId;
      logTest('Login', true);
      return true;
    } else {
      logTest('Login', false, `Status: ${response.status}, Token not received`);
      return false;
    }
  } catch (error) {
    logTest('Login', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 2: Get School ID and Student ID
async function testGetSchoolAndStudent() {
  try {
    // Get schools
    const schoolsResponse = await axios.get(`${API_URL}/schools`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (schoolsResponse.status === 200 && schoolsResponse.data?.success && schoolsResponse.data?.data?.length > 0) {
      testSchoolId = schoolsResponse.data.data[0]._id;
      testInstitutionId = testSchoolId;
      logTest('Get School ID', true, `School ID: ${testSchoolId}`);
    } else if (testInstitutionId) {
      testSchoolId = testInstitutionId;
      logTest('Get School ID', true, `Using Institution ID: ${testSchoolId}`);
    }

    // Get students
    const usersResponse = await axios.get(`${API_URL}/users?role=student&institutionId=${testSchoolId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (usersResponse.status === 200 && usersResponse.data?.success) {
      const students = usersResponse.data?.data?.users || usersResponse.data?.data || [];
      if (students.length > 0) {
        testStudentId = students[0]._id || students[0].id;
        logTest('Get Student ID', true, `Student ID: ${testStudentId}`);
        return true;
      }
    }

    logTest('Get Student ID', false, 'No students found (may need to create test data)');
    return false;
  } catch (error) {
    logTest('Get School and Student', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Predict Student Risk
async function testPredictStudentRisk() {
  if (!testStudentId || !testSchoolId) {
    logTest('Predict Student Risk', false, 'Missing student ID or school ID');
    return false;
  }

  try {
    const response = await axios.get(
      `${API_URL}/ml-predictions/student-risk/${testStudentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.riskScore !== undefined) {
      const data = response.data.data;
      logTest(
        'Predict Student Risk',
        true,
        `Risk Score: ${data.riskScore}, Level: ${data.riskLevel}`
      );
      return true;
    } else {
      logTest('Predict Student Risk', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Predict Student Risk', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 4: Predict Drill Performance
async function testPredictDrillPerformance() {
  if (!testSchoolId) {
    logTest('Predict Drill Performance', false, 'Missing school ID');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/ml-predictions/drill-performance`, {
      params: {
        drillType: 'fire',
        institutionId: testSchoolId,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (
      response.status === 200 &&
      response.data?.success &&
      response.data?.data?.predictedResponseTime !== undefined
    ) {
      const data = response.data.data;
      logTest(
        'Predict Drill Performance',
        true,
        `Response Time: ${data.predictedResponseTime}s, Participation: ${data.predictedParticipationRate}%`
      );
      return true;
    } else {
      logTest('Predict Drill Performance', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Predict Drill Performance', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 5: Predict Optimal Drill Timing
async function testPredictOptimalTiming() {
  if (!testSchoolId) {
    logTest('Predict Optimal Drill Timing', false, 'Missing school ID');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/ml-predictions/optimal-timing`, {
      params: {
        institutionId: testSchoolId,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success && response.data?.data?.recommendation) {
      const rec = response.data.data.recommendation;
      logTest(
        'Predict Optimal Drill Timing',
        true,
        `Best: Day ${rec.dayOfWeek}, Hour ${rec.hourOfDay} (${rec.predictedParticipationRate}% participation)`
      );
      return true;
    } else {
      logTest('Predict Optimal Drill Timing', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Predict Optimal Drill Timing', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 6: Detect Drill Anomalies
async function testDetectAnomalies() {
  if (!testSchoolId) {
    logTest('Detect Drill Anomalies', false, 'Missing school ID');
    return false;
  }

  try {
    const response = await axios.get(`${API_URL}/ml-predictions/anomalies`, {
      params: {
        institutionId: testSchoolId,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success && response.data?.data?.anomalies !== undefined) {
      const data = response.data.data;
      logTest(
        'Detect Drill Anomalies',
        true,
        `Found ${data.anomalies.length} anomalies (${data.summary?.anomaliesDetected || 0} total)`
      );
      return true;
    } else {
      logTest('Detect Drill Anomalies', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Detect Drill Anomalies', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 7: Forecast Student Progress
async function testForecastStudentProgress() {
  if (!testStudentId || !testSchoolId) {
    logTest('Forecast Student Progress', false, 'Missing student ID or school ID');
    return false;
  }

  try {
    const response = await axios.get(
      `${API_URL}/ml-predictions/student-progress/${testStudentId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.forecast) {
      const forecast = response.data.data.forecast;
      logTest(
        'Forecast Student Progress',
        true,
        `Next 30 days: ${forecast.next30Days.predictedModuleCompletions} modules, ${forecast.next30Days.predictedQuizCompletions} quizzes`
      );
      return true;
    } else {
      logTest('Forecast Student Progress', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Forecast Student Progress', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 8: Batch Predict Student Risks
async function testBatchPredictStudentRisks() {
  if (!testSchoolId) {
    logTest('Batch Predict Student Risks', false, 'Missing school ID');
    return false;
  }

  try {
    const response = await axios.post(
      `${API_URL}/ml-predictions/batch-predict`,
      {
        institutionId: testSchoolId,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.predictions) {
      const data = response.data.data;
      logTest(
        'Batch Predict Student Risks',
        true,
        `Predicted ${data.predictions.length} students (High: ${data.summary.highRisk}, Medium: ${data.summary.mediumRisk}, Low: ${data.summary.lowRisk})`
      );
      return true;
    } else {
      logTest('Batch Predict Student Risks', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Batch Predict Student Risks', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('\n═══════════════════════════════════════');
  console.log('🧪 Phase 4.8: ML Predictions Backend Tests');
  console.log('═══════════════════════════════════════\n');

  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/api/health`, {
      validateStatus: () => true,
      timeout: 5000,
    });
    console.log('✅ Server is running\n');
  } catch (error) {
    console.log('❌ Server is not running. Please start the backend server first.\n');
    process.exit(1);
  }

  // Run tests in sequence
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Login failed. Cannot proceed with tests.\n');
    process.exit(1);
  }

  await testGetSchoolAndStudent();
  await testPredictStudentRisk();
  await testPredictDrillPerformance();
  await testPredictOptimalTiming();
  await testDetectAnomalies();
  await testForecastStudentProgress();
  await testBatchPredictStudentRisks();

  // Summary
  console.log('\n═══════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total: ${results.passed + results.failed}\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test execution error:', error);
  process.exit(1);
});

