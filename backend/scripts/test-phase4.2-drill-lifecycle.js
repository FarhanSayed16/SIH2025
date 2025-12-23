/**
 * Phase 4.2: Drill Lifecycle System Testing Script
 * 
 * This script tests the Phase 4.2 Drill Lifecycle System by:
 * 1. Creating a drill with participant selection
 * 2. Testing drill listing and filtering
 * 3. Triggering/starting a drill
 * 4. Testing drill acknowledgment
 * 5. Testing drill ending and finalization
 * 6. Testing drill summary endpoint
 * 
 * Usage:
 *   node backend/scripts/test-phase4.2-drill-lifecycle.js
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || 'http://localhost:3000';
const API_URL = `${BACKEND_URL}/api`;

// Test credentials
let authToken = null;
let testUserId = null;
let testInstitutionId = null;
let createdDrillId = null;

// Test results
const testResults = [];
let passedCount = 0;
let failedCount = 0;

// Utility functions
function logTest(name, passed, details = '') {
  const status = passed ? '✅' : '❌';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}${status} ${name}${reset}${details ? ` - ${details}` : ''}`);
  
  testResults.push({ name, passed, details });
  if (passed) passedCount++;
  else failedCount++;
}

function logInfo(message) {
  console.log(`\x1b[36mℹ️  ${message}\x1b[0m`);
}

function logError(message) {
  console.log(`\x1b[31m❌ ${message}\x1b[0m`);
}

// API request helper
async function apiRequest(method, endpoint, data = null, token = null) {
  const url = `${API_URL}${endpoint}`;
  
  try {
    const config = {
      method: method.toLowerCase(),
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      timeout: 10000,
      validateStatus: () => true,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.data = data;
    }

    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data, error: error.message };
    }
    return { status: 500, error: error.message };
  }
}

// Test 1: Login
async function testLogin() {
  console.log('\n🔐 Test 1: Login');
  
  try {
    const loginData = {
      email: 'admin@school.com',
      password: 'admin123'
    };

    const result = await apiRequest('POST', '/auth/login', loginData);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.accessToken) {
      authToken = result.data.data.accessToken;
      testUserId = result.data.data.user?._id;
      testInstitutionId = result.data.data.user?.institutionId;
      logTest('Login', true, `User: ${result.data.data.user?.email || 'unknown'}, Institution: ${testInstitutionId || 'none (admin)'}`);
      return true;
    } else {
      logTest('Login', false, result.data?.message || 'Token not received');
      return false;
    }
  } catch (error) {
    logTest('Login', false, error.message);
    return false;
  }
}

// Test 2a: Get Available School
async function testGetSchool() {
  console.log('\n🏫 Test 2a: Get Available School');
  
  try {
    if (!authToken) {
      logTest('Get School', false, 'No auth token');
      return false;
    }

    const result = await apiRequest('GET', '/schools', null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.length > 0) {
      const school = result.data.data[0];
      testInstitutionId = school._id || school.id;
      logTest('Get School', true, `Using School: ${school.name || testInstitutionId}`);
      return true;
    } else {
      logTest('Get School', false, 'No schools available. Admin may need to create a school first.');
      return false;
    }
  } catch (error) {
    logTest('Get School', false, error.message);
    return false;
  }
}

// Test 2: Create Drill with Participant Selection
async function testCreateDrill() {
  console.log('\n📅 Test 2: Create Drill');
  
  try {
    if (!authToken) {
      logTest('Create Drill', false, 'No auth token');
      return false;
    }

    // If no institutionId, try to get one
    if (!testInstitutionId) {
      const schoolResult = await apiRequest('GET', '/schools', null, authToken);
      if (schoolResult.status === 200 && schoolResult.data?.success && schoolResult.data?.data?.length > 0) {
        testInstitutionId = schoolResult.data.data[0]._id || schoolResult.data.data[0].id;
      }
    }

    if (!testInstitutionId) {
      logTest('Create Drill', false, 'No institution ID available');
      return false;
    }

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // Tomorrow

    const drillData = {
      institutionId: testInstitutionId,
      type: 'fire',
      scheduledAt: scheduledDate.toISOString(),
      duration: 10, // 10 minutes
      participantSelection: {
        type: 'all' // All users in institution
      },
      notes: 'Phase 4.2 Test Drill'
    };

    const result = await apiRequest('POST', '/drills', drillData, authToken);
    
    if (result.status === 201 && result.data?.success && result.data?.data?.drill) {
      createdDrillId = result.data.data.drill._id || result.data.data.drill.id;
      logTest('Create Drill', true, `Drill ID: ${createdDrillId}`);
      return true;
    } else {
      const errorMsg = result.data?.message || result.data?.errors || `Status: ${result.status}`;
      logTest('Create Drill', false, errorMsg);
      if (result.data?.errors) {
        console.log(`   Validation errors: ${JSON.stringify(result.data.errors, null, 2)}`);
      }
      return false;
    }
  } catch (error) {
    logTest('Create Drill', false, error.message);
    return false;
  }
}

// Test 3: List Drills
async function testListDrills() {
  console.log('\n📋 Test 3: List Drills');
  
  try {
    if (!authToken) {
      logTest('List Drills', false, 'No auth token');
      return false;
    }

    const result = await apiRequest('GET', '/drills?page=1&limit=10', null, authToken);
    
    if (result.status === 200 && result.data?.success) {
      const drills = result.data.data || [];
      logTest('List Drills', true, `Found ${drills.length} drill(s)`);
      return true;
    } else {
      logTest('List Drills', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('List Drills', false, error.message);
    return false;
  }
}

// Test 4: Get Drill by ID
async function testGetDrillById() {
  console.log('\n🔍 Test 4: Get Drill by ID');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('Get Drill by ID', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('GET', `/drills/${createdDrillId}`, null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.drill) {
      const drill = result.data.data.drill;
      logTest('Get Drill by ID', true, `Type: ${drill.type}, Status: ${drill.status}, Duration: ${drill.duration}min`);
      return true;
    } else {
      logTest('Get Drill by ID', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('Get Drill by ID', false, error.message);
    return false;
  }
}

// Test 5: Trigger Drill (Start)
async function testTriggerDrill() {
  console.log('\n🚀 Test 5: Trigger Drill');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('Trigger Drill', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('POST', `/drills/${createdDrillId}/trigger`, null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.drill) {
      const drill = result.data.data.drill;
      logTest('Trigger Drill', true, `Status: ${drill.status}, Actual Start: ${drill.actualStart ? 'Set' : 'Not set'}`);
      return true;
    } else {
      logTest('Trigger Drill', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('Trigger Drill', false, error.message);
    return false;
  }
}

// Test 6: Acknowledge Drill
async function testAcknowledgeDrill() {
  console.log('\n✅ Test 6: Acknowledge Drill');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('Acknowledge Drill', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('POST', `/drills/${createdDrillId}/acknowledge`, null, authToken);
    
    if (result.status === 200 && result.data?.success) {
      logTest('Acknowledge Drill', true, 'Acknowledgment recorded');
      return true;
    } else {
      logTest('Acknowledge Drill', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('Acknowledge Drill', false, error.message);
    return false;
  }
}

// Test 7: Get Drill Summary
async function testGetDrillSummary() {
  console.log('\n📊 Test 7: Get Drill Summary');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('Get Drill Summary', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('GET', `/drills/${createdDrillId}/summary`, null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.summary) {
      const summary = result.data.data.summary;
      logTest('Get Drill Summary', true, 
        `Participants: ${summary.totalParticipants}, Acknowledged: ${summary.acknowledgedCount}, Rate: ${summary.participationRate}%`);
      return true;
    } else {
      logTest('Get Drill Summary', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('Get Drill Summary', false, error.message);
    return false;
  }
}

// Test 8: End Drill
async function testEndDrill() {
  console.log('\n🛑 Test 8: End Drill');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('End Drill', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('POST', `/drills/${createdDrillId}/end`, null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.drill) {
      const drill = result.data.data.drill;
      logTest('End Drill', true, `Status: ${drill.status}`);
      return true;
    } else {
      logTest('End Drill', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('End Drill', false, error.message);
    return false;
  }
}

// Test 9: Finalize Drill
async function testFinalizeDrill() {
  console.log('\n🏁 Test 9: Finalize Drill');
  
  try {
    if (!authToken || !createdDrillId) {
      logTest('Finalize Drill', false, 'No drill ID');
      return false;
    }

    const result = await apiRequest('POST', `/drills/${createdDrillId}/finalize`, null, authToken);
    
    if (result.status === 200 && result.data?.success && result.data?.data?.drill) {
      const drill = result.data.data.drill;
      logTest('Finalize Drill', true, `Status: ${drill.status}, Completed: ${drill.completedAt ? 'Yes' : 'No'}`);
      return true;
    } else {
      logTest('Finalize Drill', false, result.data?.message || `Status: ${result.status}`);
      return false;
    }
  } catch (error) {
    logTest('Finalize Drill', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Phase 4.2: Drill Lifecycle System Testing');
  console.log('='.repeat(60));
  console.log(`\n🔧 Configuration:`);
  console.log(`   Backend URL: ${BACKEND_URL}`);
  console.log(`   API URL: ${API_URL}\n`);

  // Run tests in sequence
  await testLogin();
  if (!authToken) {
    console.log('\n❌ Cannot proceed without authentication token.\n');
    process.exit(1);
  }

  await testGetSchool();
  await testCreateDrill();
  await testListDrills();
  await testGetDrillById();
  await testTriggerDrill();
  await testAcknowledgeDrill();
  await testGetDrillSummary();
  await testEndDrill();
  await testFinalizeDrill();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log(`📝 Total: ${testResults.length}`);
  console.log('='.repeat(60) + '\n');

  if (failedCount > 0) {
    console.log('⚠️  Some tests failed. Please check the errors above.\n');
    process.exit(1);
  } else {
    console.log('✅ All Phase 4.2 tests passed successfully!\n');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  logError(`\n❌ Test suite crashed: ${error.message}`);
  console.error(error);
  process.exit(1);
});

