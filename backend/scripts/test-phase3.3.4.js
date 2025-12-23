/**
 * Phase 3.3.4: PDF Certificates - Backend Test Script
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

let authToken = null;
let userId = null;

// Helper functions
const logInfo = (message) => console.log(`\x1b[34mℹ️  ${message}\x1b[0m`);
const logSuccess = (message) => console.log(`\x1b[32m✅ ${message}\x1b[0m`);
const logError = (message) => console.log(`\x1b[31m❌ ${message}\x1b[0m`);
const logWarning = (message) => console.log(`\x1b[33m⚠️  ${message}\x1b[0m`);

// Test 1: Health Check
async function testHealthCheck() {
  try {
    logInfo('=== Test 1: Health Check ===');
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200) {
      logSuccess('Health check passed');
      return true;
    }
    logError('Health check failed');
    return false;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

// Test 2: Login
async function testLogin() {
  try {
    logInfo('=== Test 2: Login ===');
    // Try common passwords used in seed scripts
    let response;
    try {
      response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@school.com',
        password: 'admin123',
      });
    } catch (err) {
      // Try alternative password
      response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email: 'admin@school.com',
        password: 'password123',
      });
    }
    if (response.status === 200 && response.data.success) {
      authToken = response.data.data.accessToken;
      userId = response.data.data.user?.id || response.data.data.user?._id || response.data.data.userId;
      logSuccess(`Login successful. User ID: ${userId}`);
      return true;
    }
    logError(`Login failed: ${response.data.message}`);
    return false;
  } catch (error) {
    logError(`Login error: ${error.message}`);
    return false;
  }
}

// Test 3: Generate Certificate
async function testGenerateCertificate() {
  try {
    logInfo('=== Test 3: Generate Certificate ===');
    const response = await axios.post(
      `${BASE_URL}/api/certificates/generate`,
      {
        certificateType: 'score_milestone',
        achievement: 'Safety Champion (80% Preparedness Score)',
        metadata: {
          milestone: 80,
          score: 85,
          achievedAt: new Date().toISOString()
        }
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    if (response.status === 201 && response.data.success) {
      const isNew = response.data.data.isNew;
      if (isNew) {
        logSuccess('Certificate generated successfully');
      } else {
        logWarning('Certificate already exists (duplicate prevention working)');
      }
      logInfo(`Certificate ID: ${response.data.data.certificate._id}`);
      logInfo(`PDF URL: ${response.data.data.pdfUrl}`);
      logInfo(`Is New: ${isNew}`);
      return response.data.data.certificate._id;
    }
    logError('Certificate generation failed');
    return null;
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data?.error || error.stack;
    logError(`Certificate generation error: ${errorMessage}`);
    if (errorDetails && errorDetails !== errorMessage) {
      logInfo(`Details: ${JSON.stringify(errorDetails).substring(0, 200)}`);
    }
    return null;
  }
}

// Test 4: Get My Certificates
async function testGetMyCertificates() {
  try {
    logInfo('=== Test 4: Get My Certificates ===');
    const response = await axios.get(
      `${BASE_URL}/api/certificates/my-certificates`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    if (response.status === 200 && response.data.success) {
      const certificates = response.data.data.certificates;
      logSuccess(`Retrieved ${certificates.length} certificate(s)`);
      if (certificates.length > 0) {
        certificates.forEach((cert, index) => {
          logInfo(`  ${index + 1}. ${cert.achievement} (${cert.certificateType})`);
          logInfo(`     Issued: ${new Date(cert.issuedAt).toLocaleDateString()}`);
          logInfo(`     ID: ${cert._id}`);
        });
        // Return first certificate ID for testing
        return certificates.length > 0 ? certificates[0]._id : null;
      }
      return null;
    }
    logError('Failed to get certificates');
    return null;
  } catch (error) {
    logError(`Get certificates error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test 5: Get Certificate by ID
async function testGetCertificateById(certificateId) {
  if (!certificateId) {
    logWarning('No certificate ID available - skipping');
    return null;
  }
  try {
    logInfo('=== Test 5: Get Certificate by ID ===');
    const response = await axios.get(
      `${BASE_URL}/api/certificates/${certificateId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    if (response.status === 200 && response.data.success) {
      const cert = response.data.data.certificate;
      logSuccess(`Certificate retrieved: ${cert.achievement}`);
      logInfo(`  Type: ${cert.certificateType}`);
      logInfo(`  PDF URL: ${cert.pdfUrl}`);
      return cert;
    }
    logError('Failed to get certificate by ID');
    return null;
  } catch (error) {
    logError(`Get certificate by ID error: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

// Test 6: Download Certificate PDF
async function testDownloadCertificate(certificateId) {
  if (!certificateId) {
    logWarning('No certificate ID available - skipping');
    return false;
  }
  try {
    logInfo('=== Test 6: Download Certificate PDF ===');
    const response = await axios.get(
      `${BASE_URL}/api/certificates/${certificateId}/download`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        },
        responseType: 'arraybuffer' // For binary data
      }
    );
    if (response.status === 200 && response.headers['content-type'] === 'application/pdf') {
      logSuccess(`PDF downloaded successfully (${response.data.length} bytes)`);
      return true;
    }
    logError('PDF download failed');
    return false;
  } catch (error) {
    logError(`PDF download error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test 7: Check Certificates
async function testCheckCertificates() {
  try {
    logInfo('=== Test 7: Check and Generate Certificates ===');
    const response = await axios.post(
      `${BASE_URL}/api/certificates/check`,
      {
        triggerType: 'score_update',
        triggerData: {
          previousScore: 75,
          newScore: 85
        }
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    if (response.status === 200 && response.data.success) {
      const newCerts = response.data.data.newCertificates;
      logSuccess(`Certificate check completed. New certificates: ${newCerts.length}`);
      if (newCerts.length > 0) {
        newCerts.forEach(cert => {
          logInfo(`  - ${cert.achievement}`);
        });
      }
      return newCerts;
    }
    logError('Certificate check failed');
    return [];
  } catch (error) {
    logError(`Certificate check error: ${error.response?.data?.message || error.message}`);
    return [];
  }
}

// Main test runner
async function runTests() {
  console.log('\n\x1b[34m🚀 Starting Phase 3.3.4 Backend Tests...\x1b[0m');
  console.log('\x1b[34m============================================================\x1b[0m');

  const results = {
    passed: 0,
    failed: 0,
    total: 7
  };

  // Run tests sequentially
  if (await testHealthCheck()) results.passed++; else results.failed++;
  if (await testLogin()) results.passed++; else results.failed++;

  let certificateId = null;
  certificateId = await testGenerateCertificate();
  if (certificateId) results.passed++; else results.failed++;

  // Get certificate ID from existing certificates if generation failed
  let existingCertId = await testGetMyCertificates();
  if (existingCertId) {
    results.passed++;
    // Use existing certificate ID for subsequent tests
    if (!certificateId) certificateId = existingCertId;
  } else {
    results.failed++;
  }

  const cert = await testGetCertificateById(certificateId);
  if (cert) results.passed++; else results.failed++;

  if (await testDownloadCertificate(certificateId)) results.passed++; else results.failed++;
  if (await testCheckCertificates()) results.passed++; else results.failed++;

  // Summary
  console.log('\n\x1b[34m============================================================\x1b[0m');
  console.log('\x1b[34m📊 Test Summary:\x1b[0m');
  console.log('\x1b[34m============================================================\x1b[0m');
  console.log(`Total: ${results.total} tests`);
  console.log(`\x1b[32mPassed: ${results.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${results.failed}\x1b[0m`);
  console.log('\x1b[34m============================================================\x1b[0m');

  if (results.failed === 0) {
    console.log('\n\x1b[32m✅ All tests passed!\x1b[0m\n');
  } else {
    console.log('\n\x1b[33m⚠️  Some tests failed. Check logs above.\x1b[0m\n');
  }
}

// Run tests
runTests().catch(error => {
  logError(`Test runner error: ${error.message}`);
  process.exit(1);
});

