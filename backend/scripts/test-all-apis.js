/**
 * Test All API Endpoints
 * Comprehensive test of all backend APIs
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:3000/api';
let accessToken = null;
let userId = null;
let schoolId = null;

const results = {
  passed: [],
  failed: [],
  skipped: []
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
  
  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push(name);
  else results.skipped.push(name);
}

async function testEndpoint(name, method, endpoint, body = null, needsAuth = false) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (needsAuth && accessToken) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok && data.success !== false) {
      logTest(name, 'pass', `Status: ${response.status}`);
      return data;
    } else {
      logTest(name, 'fail', `${response.status}: ${data.message || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    logTest(name, 'fail', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🧪 Testing All API Endpoints...\n');
  console.log('=' .repeat(50));
  console.log('');

  // Test 1: Health Check
  console.log('📋 Testing Health & Info...');
  try {
    const healthResponse = await fetch('http://localhost:3000/health');
    const healthData = await healthResponse.json();
    if (healthData.status === 'OK' && healthData.db === 'connected') {
      logTest('Health Check', 'pass');
    } else {
      logTest('Health Check', 'fail', 'DB not connected');
    }
  } catch (error) {
    logTest('Health Check', 'fail', error.message);
  }

  const apiInfo = await testEndpoint('API Info', 'GET', '');
  console.log('');

  // Test 2: Authentication
  console.log('📋 Testing Authentication...');
  // Try different admin emails from seed data
  let loginData = await testEndpoint('Login (admin@kavach.com)', 'POST', '/auth/login', {
    email: 'admin@kavach.com',
    password: 'admin123'
  });
  
  if (!loginData || !loginData.data) {
    // Try alternative email
    loginData = await testEndpoint('Login (admin@school.com)', 'POST', '/auth/login', {
      email: 'admin@school.com',
      password: 'admin123'
    });
  }

  if (loginData && loginData.data) {
    accessToken = loginData.data.accessToken;
    userId = loginData.data.user.id;
    schoolId = loginData.data.user.institutionId;
    logTest('Token Received', 'pass');
  } else {
    logTest('Token Received', 'fail', 'Cannot continue without token');
    console.log('\n⚠️  Cannot test protected endpoints without authentication');
    printSummary();
    process.exit(1);
  }
  console.log('');

  // Test 3: User Endpoints
  console.log('📋 Testing User Endpoints...');
  await testEndpoint('Get User Profile', 'GET', `/users/${userId}`, null, true);
  console.log('');

  // Test 4: School Endpoints
  console.log('📋 Testing School Endpoints...');
  const schoolsData = await testEndpoint('List Schools', 'GET', '/schools', null, true);
  if (schoolsData && schoolsData.data && schoolsData.data.length > 0) {
    schoolId = schoolId || schoolsData.data[0]._id;
    logTest('School ID Available', 'pass');
  }
  console.log('');

  // Test 5: Drill Endpoints
  console.log('📋 Testing Drill Endpoints...');
  await testEndpoint('List Drills', 'GET', '/drills', null, true);
  
  const drillData = await testEndpoint('Create Drill', 'POST', '/drills', {
    schoolId: schoolId,
    type: 'fire',
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  }, true);
  console.log('');

  // Test 6: Alert Endpoints
  console.log('📋 Testing Alert Endpoints...');
  await testEndpoint('List Alerts', 'GET', '/alerts', null, true);
  
  const alertData = await testEndpoint('Create Alert', 'POST', '/alerts', {
    schoolId: schoolId,
    type: 'fire',
    severity: 'high',
    message: 'Test alert from API test'
  }, true);
  console.log('');

  // Test 7: Module Endpoints
  console.log('📋 Testing Module Endpoints...');
  await testEndpoint('List Modules', 'GET', '/modules', null, true);
  console.log('');

  // Test 8: Device Endpoints
  console.log('📋 Testing Device Endpoints...');
  await testEndpoint('List Devices', 'GET', '/devices', null, true);
  console.log('');

  // Summary
  printSummary();
}

function printSummary() {
  console.log('=' .repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Skipped: ${results.skipped.length}`);
  console.log('');

  if (results.failed.length > 0) {
    console.log('❌ Failed Tests:');
    results.failed.forEach(test => console.log(`   - ${test}`));
    console.log('');
  }

  if (results.passed.length > 0 && results.failed.length === 0) {
    console.log('🎉 All API tests passed!');
    process.exit(0);
  } else if (results.failed.length > 0) {
    console.log('⚠️  Some API tests failed.');
    process.exit(1);
  }
}

// Check if server is running
fetch('http://localhost:3000/health')
  .then(() => runTests())
  .catch(() => {
    console.error('❌ Backend server is not running on port 3000');
    console.error('💡 Start the server with: cd backend && npm run dev');
    process.exit(1);
  });

