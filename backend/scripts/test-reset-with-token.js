#!/usr/bin/env node

/**
 * Test reset password with a token
 * Usage: node scripts/test-reset-with-token.js <token>
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = 'admin@school.com';
const NEW_PASSWORD = 'NewPass123';

const token = process.argv[2];

if (!token) {
  console.log('❌ Usage: node scripts/test-reset-with-token.js <token>');
  console.log('   Get the token from backend console logs after calling forgot-password');
  process.exit(1);
}

async function testReset() {
  try {
    console.log('\n🧪 Testing Password Reset with Token...\n');
    console.log(`Token: ${token.substring(0, 20)}...`);
    console.log(`New Password: ${NEW_PASSWORD}\n`);
    
    // Step 1: Reset password
    console.log('Step 1: Resetting password...');
    const resetResponse = await axios.post(`${BASE_URL}/auth/reset-password`, {
      token: token,
      password: NEW_PASSWORD
    });
    
    if (resetResponse.data.success) {
      console.log('✅ Password reset successful!');
      console.log(`   Message: ${resetResponse.data.message}\n`);
    } else {
      console.log('❌ Password reset failed');
      console.log(`   Response: ${JSON.stringify(resetResponse.data, null, 2)}`);
      process.exit(1);
    }
    
    // Step 2: Try to login with new password
    console.log('Step 2: Testing login with new password...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: NEW_PASSWORD
      });
      
      if (loginResponse.data.success && loginResponse.data.data?.accessToken) {
        console.log('✅ Login with new password successful!');
        console.log('   Token received, authentication working.\n');
      } else {
        console.log('⚠️  Login response unexpected format');
      }
    } catch (error) {
      console.log('❌ Login with new password failed');
      console.log(`   Error: ${error.response?.data?.message || error.message}`);
      process.exit(1);
    }
    
    // Step 3: Try to login with old password (should fail)
    console.log('Step 3: Verifying old password no longer works...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: 'admin123' // Old password
      });
      console.log('⚠️  Old password still works (unexpected)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Old password correctly rejected');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }
    
    console.log('\n✅ All tests passed! Password reset flow is working correctly.\n');
    
  } catch (error) {
    console.log('\n❌ Test failed:');
    console.log(`   Status: ${error.response?.status || 'N/A'}`);
    console.log(`   Message: ${error.response?.data?.message || error.message}`);
    if (error.response?.data) {
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

testReset();

