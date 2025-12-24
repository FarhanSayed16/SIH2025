/**
 * Phase 4.9: User Settings Backend Test Script
 * Tests all user settings endpoints
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

// Test 2: Get User Settings
async function testGetUserSettings() {
  try {
    const response = await axios.get(`${API_URL}/settings`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success && response.data?.data) {
      logTest('Get User Settings', true, `Language: ${response.data.data.language || 'default'}`);
      return true;
    } else {
      logTest('Get User Settings', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Get User Settings', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 3: Update Language Preference
async function testUpdateLanguage() {
  try {
    const response = await axios.put(
      `${API_URL}/settings/language`,
      { language: 'pa' }, // Punjabi
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      logTest('Update Language Preference', true, `Updated to: ${response.data.data.language}`);
      return true;
    } else {
      logTest('Update Language Preference', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Update Language Preference', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 4: Update Accessibility Settings
async function testUpdateAccessibility() {
  try {
    const response = await axios.put(
      `${API_URL}/settings/accessibility`,
      {
        highContrast: true,
        fontSize: 'large',
        screenReader: true,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const acc = response.data.data.accessibility;
      logTest(
        'Update Accessibility Settings',
        true,
        `High Contrast: ${acc.highContrast}, Font Size: ${acc.fontSize}`
      );
      return true;
    } else {
      logTest('Update Accessibility Settings', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Update Accessibility Settings', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 5: Update UI Preferences
async function testUpdateUIPreferences() {
  try {
    const response = await axios.put(
      `${API_URL}/settings/ui`,
      {
        theme: 'dark',
        animations: false,
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      const ui = response.data.data.ui;
      logTest('Update UI Preferences', true, `Theme: ${ui.theme}, Animations: ${ui.animations}`);
      return true;
    } else {
      logTest('Update UI Preferences', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Update UI Preferences', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 6: Get Supported Languages
async function testGetSupportedLanguages() {
  try {
    const response = await axios.get(`${API_URL}/settings/languages`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      validateStatus: () => true,
    });

    if (response.status === 200 && response.data?.success && response.data?.data?.languages) {
      const languages = response.data.data.languages;
      logTest(
        'Get Supported Languages',
        true,
        `Found ${languages.length} languages: ${languages.map(l => l.code).join(', ')}`
      );
      return true;
    } else {
      logTest('Get Supported Languages', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Get Supported Languages', false, `Error: ${error.message}`);
    return false;
  }
}

// Test 7: Update All Settings
async function testUpdateAllSettings() {
  try {
    const response = await axios.put(
      `${API_URL}/settings`,
      {
        language: 'hi', // Hindi
        accessibility: {
          fontSize: 'medium',
          highContrast: false,
        },
        ui: {
          theme: 'light',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      }
    );

    if (response.status === 200 && response.data?.success) {
      logTest('Update All Settings', true, 'All settings updated successfully');
      return true;
    } else {
      logTest('Update All Settings', false, `Status: ${response.status}, ${response.data?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    logTest('Update All Settings', false, `Error: ${error.message}`);
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('\n═══════════════════════════════════════');
  console.log('🧪 Phase 4.9: User Settings Backend Tests');
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

  await testGetUserSettings();
  await testGetSupportedLanguages();
  await testUpdateLanguage();
  await testUpdateAccessibility();
  await testUpdateUIPreferences();
  await testUpdateAllSettings();

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

