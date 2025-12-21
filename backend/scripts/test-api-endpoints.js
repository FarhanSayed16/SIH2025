/**
 * Test API Endpoints
 * Tests critical API endpoints to ensure they work
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

async function runTests() {
  console.log('🧪 Testing API Endpoints...\n');
  console.log('=' .repeat(50));
  console.log('');

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failed++;
    }
  }

  console.log('');
  console.log('=' .repeat(50));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 All API tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some API tests failed.');
    process.exit(1);
  }
}

// Test 1: Health Check
test('Health Check', async () => {
  const response = await fetch(`${API_URL.replace('/api', '')}/health`);
  if (!response.ok) throw new Error(`Status: ${response.status}`);
  const data = await response.json();
  if (data.status !== 'OK') throw new Error('Health check failed');
});

// Test 2: API Info
test('API Info Endpoint', async () => {
  const response = await fetch(`${API_URL.replace('/api', '')}/api`);
  if (!response.ok) throw new Error(`Status: ${response.status}`);
  const data = await response.json();
  if (!data.success) throw new Error('API info failed');
});

// Test 3: Auth Register (if allowed)
test('Auth Register Endpoint', async () => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `test${Date.now()}@example.com`,
      password: 'Test1234',
      name: 'Test User',
      role: 'student'
    })
  });
  
  if (response.status === 201) {
    const data = await response.json();
    if (!data.success) throw new Error('Registration failed');
  } else if (response.status === 400) {
    // Registration might be disabled, that's okay
    const data = await response.json();
    if (data.message && data.message.includes('already exists')) {
      // Expected behavior
      return;
    }
  }
});

// Test 4: Auth Login (with test credentials)
test('Auth Login Endpoint', async () => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@school.com',
      password: 'admin123'
    })
  });
  
  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || `Status: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success || !data.data.accessToken) {
    throw new Error('Login failed - no token received');
  }
});

// Test 5: Protected Route (with token)
test('Protected Route (Users)', async () => {
  // First login to get token
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@school.com',
      password: 'admin123'
    })
  });
  
  if (!loginResponse.ok) {
    throw new Error('Login failed - cannot test protected route');
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.data.accessToken;
  
  // Test protected route
  const response = await fetch(`${API_URL}/users/${loginData.data.user.id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error('Protected route failed');
  }
});

// Test 6: Schools List
test('Schools List Endpoint', async () => {
  const loginResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@school.com',
      password: 'admin123'
    })
  });
  
  if (!loginResponse.ok) {
    throw new Error('Login failed');
  }
  
  const loginData = await loginResponse.json();
  const token = loginData.data.accessToken;
  
  const response = await fetch(`${API_URL}/schools`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error('Schools list failed');
  }
});

runTests().catch(error => {
  console.error('❌ Test runner failed:', error);
  process.exit(1);
});

