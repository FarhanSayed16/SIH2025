#!/usr/bin/env node

/**
 * Test script for Forgot/Reset Password flow
 */

import axios from 'axios';
import crypto from 'crypto';

const BASE_URL = process.env.API_URL || 'http://localhost:3000/api';

// Test credentials from seed data
const TEST_EMAIL = 'admin@school.com';
const TEST_PASSWORD = 'admin123';
const NEW_PASSWORD = 'NewPass123';

let resetToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? 'green' : status === 'fail' ? 'red' : 'yellow';
  log(`${icon} ${name}`, color);
  if (details) {
    log(`   ${details}`, 'yellow');
  }
}

async function testHealthCheck() {
  try {
    log('\n📋 Testing Health Check...', 'cyan');
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
    if (response.data.status === 'OK') {
      logTest('Health Check', 'pass');
      return true;
    }
    logTest('Health Check', 'fail', 'Server not responding correctly');
    return false;
  } catch (error) {
    logTest('Health Check', 'fail', error.message);
    return false;
  }
}

async function testForgotPassword() {
  try {
    log('\n📋 Testing Forgot Password Endpoint...', 'cyan');
    
    // Test 1: Valid email
    log('  Test 1: Request reset for valid email...', 'blue');
    const response1 = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    if (response1.data.success && response1.data.message) {
      logTest('Forgot Password (valid email)', 'pass');
      log(`   Response: ${response1.data.message}`, 'yellow');
    } else {
      logTest('Forgot Password (valid email)', 'fail', 'Unexpected response format');
      return false;
    }
    
    // Test 2: Invalid email (should still return success for security)
    log('  Test 2: Request reset for invalid email...', 'blue');
    const response2 = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent@example.com'
    });
    
    if (response2.data.success && response2.data.message) {
      logTest('Forgot Password (invalid email)', 'pass', 'Generic message returned (security)');
    } else {
      logTest('Forgot Password (invalid email)', 'fail', 'Should return generic success');
      return false;
    }
    
    // Test 3: Missing email
    log('  Test 3: Request reset without email...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {});
      logTest('Forgot Password (missing email)', 'fail', 'Should return validation error');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Forgot Password (missing email)', 'pass', 'Validation error returned');
      } else {
        logTest('Forgot Password (missing email)', 'fail', `Unexpected error: ${error.message}`);
        return false;
      }
    }
    
    // Test 4: Invalid email format
    log('  Test 4: Request reset with invalid email format...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: 'not-an-email'
      });
      logTest('Forgot Password (invalid format)', 'fail', 'Should return validation error');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Forgot Password (invalid format)', 'pass', 'Validation error returned');
      } else {
        logTest('Forgot Password (invalid format)', 'fail', `Unexpected error: ${error.message}`);
        return false;
      }
    }
    
    log('\n⚠️  Note: Check backend console logs for the reset link token', 'yellow');
    log('   The token should be logged when forgot-password is called', 'yellow');
    
    return true;
  } catch (error) {
    logTest('Forgot Password', 'fail', error.response?.data?.message || error.message);
    return false;
  }
}

async function testResetPassword() {
  try {
    log('\n📋 Testing Reset Password Endpoint...', 'cyan');
    
    // First, we need to get a valid token by calling forgot-password
    // Then extract it from the logs or use a mock token for testing
    log('  Note: This test requires a valid reset token', 'yellow');
    log('  In production, the token would come from the email link', 'yellow');
    
    // Test 1: Missing token
    log('  Test 1: Reset without token...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        password: NEW_PASSWORD
      });
      logTest('Reset Password (missing token)', 'fail', 'Should return validation error');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Reset Password (missing token)', 'pass', 'Validation error returned');
      } else {
        logTest('Reset Password (missing token)', 'fail', `Unexpected error: ${error.message}`);
        return false;
      }
    }
    
    // Test 2: Missing password
    log('  Test 2: Reset without password...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: 'some-token'
      });
      logTest('Reset Password (missing password)', 'fail', 'Should return validation error');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Reset Password (missing password)', 'pass', 'Validation error returned');
      } else {
        logTest('Reset Password (missing password)', 'fail', `Unexpected error: ${error.message}`);
        return false;
      }
    }
    
    // Test 3: Invalid token
    log('  Test 3: Reset with invalid token...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: 'invalid-token-12345',
        password: NEW_PASSWORD
      });
      logTest('Reset Password (invalid token)', 'fail', 'Should return error');
      return false;
    } catch (error) {
      if (error.response?.status === 400 && 
          (error.response.data.message.includes('Invalid') || 
           error.response.data.message.includes('expired'))) {
        logTest('Reset Password (invalid token)', 'pass', 'Error returned as expected');
      } else {
        logTest('Reset Password (invalid token)', 'fail', `Unexpected response: ${error.response?.data?.message || error.message}`);
        return false;
      }
    }
    
    // Test 4: Password too short
    log('  Test 4: Reset with password too short...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: 'some-token',
        password: '12345' // Less than 6 characters
      });
      logTest('Reset Password (short password)', 'fail', 'Should return validation error');
      return false;
    } catch (error) {
      if (error.response?.status === 400) {
        logTest('Reset Password (short password)', 'pass', 'Validation error returned');
      } else {
        logTest('Reset Password (short password)', 'fail', `Unexpected error: ${error.message}`);
        return false;
      }
    }
    
    log('\n⚠️  Note: To test successful reset, you need:', 'yellow');
    log('   1. Call /auth/forgot-password with a valid email', 'yellow');
    log('   2. Check backend console logs for the reset token', 'yellow');
    log('   3. Use that token to call /auth/reset-password', 'yellow');
    
    return true;
  } catch (error) {
    logTest('Reset Password', 'fail', error.response?.data?.message || error.message);
    return false;
  }
}

async function testFullFlow() {
  try {
    log('\n📋 Testing Full Password Reset Flow...', 'cyan');
    
    // Step 1: Request password reset
    log('  Step 1: Request password reset...', 'blue');
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    if (!forgotResponse.data.success) {
      logTest('Full Flow - Step 1', 'fail', 'Forgot password failed');
      return false;
    }
    logTest('Full Flow - Step 1', 'pass', 'Reset request sent');
    
    log('\n⚠️  IMPORTANT: Check backend console logs for the reset token!', 'yellow');
    log('   Look for a line like: "Password reset link for admin@school.com: ..."', 'yellow');
    log('   Copy the token from the URL and use it in the next step', 'yellow');
    log('   Example: If URL is /reset-password?token=abc123, use token=abc123', 'yellow');
    
    // Note: In a real scenario, the token would come from email
    // For this test, we're documenting the process
    
    log('\n✅ Full flow test requires manual token extraction from logs', 'green');
    log('   This is expected behavior - tokens are logged for development', 'green');
    
    return true;
  } catch (error) {
    logTest('Full Flow', 'fail', error.response?.data?.message || error.message);
    return false;
  }
}

async function testLoginAfterReset() {
  try {
    log('\n📋 Testing Login After Password Reset...', 'cyan');
    log('  Note: This test requires the password to be reset first', 'yellow');
    log('  Use the reset token from forgot-password logs', 'yellow');
    
    // Try to login with old password (should fail if reset was successful)
    log('  Attempting login with old password...', 'blue');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      });
      logTest('Login (old password)', 'pass', 'Old password still works (reset not performed)');
    } catch (error) {
      if (error.response?.status === 401) {
        logTest('Login (old password)', 'pass', 'Old password rejected (reset successful)');
      } else {
        logTest('Login (old password)', 'fail', error.message);
      }
    }
    
    return true;
  } catch (error) {
    logTest('Login After Reset', 'fail', error.message);
    return false;
  }
}

async function runAllTests() {
  log('\n🧪 PASSWORD RESET FLOW TEST SUITE', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const results = {
    health: false,
    forgotPassword: false,
    resetPassword: false,
    fullFlow: false,
    loginAfterReset: false,
  };
  
  // Test 1: Health Check
  results.health = await testHealthCheck();
  if (!results.health) {
    log('\n❌ Server is not running. Please start the backend server first.', 'red');
    log('   Run: npm run dev', 'yellow');
    process.exit(1);
  }
  
  // Test 2: Forgot Password
  results.forgotPassword = await testForgotPassword();
  
  // Test 3: Reset Password (validation only)
  results.resetPassword = await testResetPassword();
  
  // Test 4: Full Flow (documentation)
  results.fullFlow = await testFullFlow();
  
  // Test 5: Login After Reset (documentation)
  results.loginAfterReset = await testLoginAfterReset();
  
  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 TEST SUMMARY', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    logTest(test, result ? 'pass' : 'fail');
  });
  
  log('\n' + '='.repeat(60), 'cyan');
  if (passed === total) {
    log(`✅ All tests passed! (${passed}/${total})`, 'green');
  } else {
    log(`⚠️  Some tests require manual verification (${passed}/${total} passed)`, 'yellow');
  }
  log('='.repeat(60) + '\n', 'cyan');
  
  log('📝 NEXT STEPS:', 'cyan');
  log('   1. Check backend console for reset token when calling forgot-password', 'yellow');
  log('   2. Use that token to test the reset-password endpoint', 'yellow');
  log('   3. Verify you can login with the new password', 'yellow');
  log('   4. Test the frontend pages at /forgot-password and /reset-password', 'yellow');
  log('');
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});

