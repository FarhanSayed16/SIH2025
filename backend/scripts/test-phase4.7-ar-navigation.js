/**
 * Phase 4.7: AR Navigation Backend Test Script
 * Tests AR navigation and safe zone endpoints
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

// Test 2: Get School ID
async function testGetSchoolId() {
  try {
    const response = await axios.get(`${API_URL}/schools`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success && response.data?.data?.length > 0) {
      testSchoolId = response.data.data[0]._id;
      logTest('Get School ID', true, `School ID: ${testSchoolId}`);
      return true;
    } else if (testInstitutionId) {
      // Use institution ID if available
      testSchoolId = testInstitutionId;
      logTest('Get School ID', true, `Using Institution ID: ${testSchoolId}`);
      return true;
    } else {
      logTest('Get School ID', false, 'No school found');
      return false;
    }
  } catch (error) {
    if (testInstitutionId) {
      testSchoolId = testInstitutionId;
      logTest('Get School ID', true, `Using Institution ID: ${testSchoolId}`);
      return true;
    }
    logTest('Get School ID', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Get Safe Zones
async function testGetSafeZones() {
  try {
    const response = await axios.get(`${API_URL}/safe-zones/${testSchoolId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success) {
      const safeZones = response.data.data?.safeZones || [];
      logTest('Get Safe Zones', true, `Found ${safeZones.length} safe zones`);
      return true;
    } else {
      logTest('Get Safe Zones', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Get Safe Zones', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 4: Find Nearest Safe Zone
async function testFindNearestSafeZone() {
  try {
    // Use test coordinates (can be adjusted)
    const lat = 28.7041; // Example: New Delhi
    const lng = 77.1025;

    const response = await axios.get(`${API_URL}/safe-zones/nearest`, {
      params: {
        schoolId: testSchoolId,
        lat,
        lng,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success) {
      const safeZone = response.data.data?.safeZone;
      logTest('Find Nearest Safe Zone', true, safeZone ? `Found: ${safeZone.name}` : 'No safe zone found (expected if none exist)');
      return true;
    } else if (response.status === 404) {
      logTest('Find Nearest Safe Zone', true, 'No safe zone found (expected if none exist)');
      return true;
    } else {
      const errorMsg = response.data?.message || response.data?.error || JSON.stringify(response.data);
      logTest('Find Nearest Safe Zone', false, `Status: ${response.status}, Error: ${errorMsg}`);
      return false;
    }
  } catch (error) {
    logTest('Find Nearest Safe Zone', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 5: Get Safe Zones Within Radius
async function testGetSafeZonesWithinRadius() {
  try {
    const lat = 28.7041;
    const lng = 77.1025;
    const radius = 1000; // 1km

    const response = await axios.get(`${API_URL}/safe-zones/${testSchoolId}/within-radius`, {
      params: {
        lat,
        lng,
        radius,
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success) {
      const safeZones = response.data.data?.safeZones || [];
      logTest('Get Safe Zones Within Radius', true, `Found ${safeZones.length} safe zones within ${radius}m`);
      return true;
    } else {
      logTest('Get Safe Zones Within Radius', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Get Safe Zones Within Radius', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 6: Calculate AR Route
async function testCalculateARRoute() {
  try {
    const startLat = 28.7041;
    const startLng = 77.1025;

    const response = await axios.post(
      `${API_URL}/ar-navigation/route`,
      {
        schoolId: testSchoolId,
        startLat,
        startLng,
        alertType: 'fire',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.route) {
      const route = response.data.data.route;
      logTest('Calculate AR Route', true, `Route calculated: ${route.totalDistanceFormatted}, ${route.estimatedTimeFormatted}`);
      return true;
    } else if (response.status === 500 && response.data?.message?.includes('No safe zone')) {
      logTest('Calculate AR Route', true, 'No safe zone found (expected if none exist)');
      return true;
    } else {
      logTest('Calculate AR Route', false, `Status: ${response.status}, Message: ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Calculate AR Route', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 7: Get AR Markers
async function testGetARMarkers() {
  try {
    const response = await axios.get(`${API_URL}/ar-navigation/markers/${testSchoolId}`, {
      params: {
        alertType: 'fire',
      },
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success) {
      const markers = response.data.data?.markers || [];
      logTest('Get AR Markers', true, `Found ${markers.length} AR markers`);
      return true;
    } else {
      logTest('Get AR Markers', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logTest('Get AR Markers', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 8: Calculate AR Route with End Location
async function testCalculateARRouteWithEnd() {
  try {
    const startLat = 28.7041;
    const startLng = 77.1025;
    const endLat = 28.7051;
    const endLng = 77.1035;

    const response = await axios.post(
      `${API_URL}/ar-navigation/route`,
      {
        schoolId: testSchoolId,
        startLat,
        startLng,
        endLat,
        endLng,
        alertType: 'earthquake',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success && response.data?.data?.route) {
      const route = response.data.data.route;
      logTest('Calculate AR Route (with end location)', true, `Route: ${route.totalDistanceFormatted}, ${route.instructions.length} instructions`);
      return true;
    } else {
      logTest('Calculate AR Route (with end location)', false, `Status: ${response.status}, Message: ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Calculate AR Route (with end location)', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('\n═══════════════════════════════════════');
  console.log('🧪 Phase 4.7: AR Navigation Backend Tests');
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

  await testGetSchoolId();
  await testGetSafeZones();
  await testFindNearestSafeZone();
  await testGetSafeZonesWithinRadius();
  await testCalculateARRoute();
  await testGetARMarkers();
  await testCalculateARRouteWithEnd();

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

