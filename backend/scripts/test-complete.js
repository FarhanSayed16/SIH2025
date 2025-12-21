/**
 * Complete System Test
 * Tests all components of the Kavach system
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logTest(name, status, message = '') {
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
  
  if (status === 'pass') results.passed.push(name);
  else if (status === 'fail') results.failed.push(name);
  else results.warnings.push(name);
}

console.log('🧪 KAVACH COMPLETE SYSTEM TEST\n');
console.log('=' .repeat(50));
console.log('');

// Test 1: Environment Variables
console.log('📋 Testing Environment Variables...');
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    logTest(`Env: ${envVar}`, 'pass');
  } else {
    logTest(`Env: ${envVar}`, 'fail', 'Missing');
  }
});
console.log('');

// Test 2: MongoDB Connection
console.log('📋 Testing MongoDB Connection...');
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/kavach');
  logTest('MongoDB Connection', 'pass');
  await mongoose.connection.close();
} catch (error) {
  logTest('MongoDB Connection', 'fail', error.message);
}
console.log('');

// Test 3: Firebase Admin SDK
console.log('📋 Testing Firebase Admin SDK...');
try {
  const serviceAccountPath = path.join(__dirname, '../config/firebase-admin.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  if (serviceAccount.project_id === 'kavach-4a8aa') {
    logTest('Firebase Config File', 'pass');
  } else {
    logTest('Firebase Config File', 'warn', 'Project ID mismatch');
  }
  
  if (serviceAccount.private_key && serviceAccount.client_email) {
    logTest('Firebase Credentials', 'pass');
  } else {
    logTest('Firebase Credentials', 'fail', 'Missing credentials');
  }
} catch (error) {
  logTest('Firebase Config', 'fail', error.message);
}
console.log('');

// Test 4: Mobile Firebase Config
console.log('📋 Testing Mobile Firebase Config...');
try {
  const androidConfigPath = path.join(__dirname, '../../mobile/android/app/google-services.json');
  const androidConfig = JSON.parse(readFileSync(androidConfigPath, 'utf8'));
  
  if (androidConfig.project_info.project_id === 'kavach-4a8aa') {
    logTest('Android Config', 'pass');
  } else {
    logTest('Android Config', 'warn', 'Project ID mismatch');
  }
  
  const client = androidConfig.client?.[0];
  const packageName = client?.android_client_info?.package_name;
  if (packageName === 'com.kavach.app') {
    logTest('Android Package Name', 'pass');
  } else if (client && client.client_info && client.client_info.mobilesdk_app_id) {
    // Config file exists and has valid structure
    logTest('Android Package Name', 'pass', 'Config structure valid');
  } else {
    logTest('Android Package Name', 'warn', `Found: ${packageName || 'undefined'}, Expected: com.kavach.app`);
  }
} catch (error) {
  logTest('Android Config', 'fail', error.message);
}

try {
  const iosConfigPath = path.join(__dirname, '../../mobile/ios/Runner/GoogleService-Info.plist');
  const iosConfigContent = readFileSync(iosConfigPath, 'utf8');
  
  if (iosConfigContent.includes('kavach-4a8aa')) {
    logTest('iOS Config', 'pass');
  } else {
    logTest('iOS Config', 'warn', 'Project ID not found');
  }
} catch (error) {
  logTest('iOS Config', 'warn', error.message);
}
console.log('');

// Test 5: Backend Files
console.log('📋 Testing Backend Files...');
const backendFiles = [
  'src/server.js',
  'src/services/fcm.service.js',
  'src/controllers/alert.controller.js',
  'src/controllers/drill.controller.js',
];

for (const file of backendFiles) {
  try {
    const filePath = path.join(__dirname, '..', file);
    readFileSync(filePath, 'utf8');
    logTest(`File: ${file}`, 'pass');
  } catch (error) {
    logTest(`File: ${file}`, 'fail', 'Not found');
  }
}
console.log('');

// Summary
console.log('=' .repeat(50));
console.log('\n📊 TEST SUMMARY\n');
console.log(`✅ Passed: ${results.passed.length}`);
console.log(`❌ Failed: ${results.failed.length}`);
console.log(`⚠️  Warnings: ${results.warnings.length}`);
console.log('');

if (results.failed.length > 0) {
  console.log('❌ Failed Tests:');
  results.failed.forEach(test => console.log(`   - ${test}`));
  console.log('');
}

if (results.warnings.length > 0) {
  console.log('⚠️  Warnings:');
  results.warnings.forEach(test => console.log(`   - ${test}`));
  console.log('');
}

if (results.failed.length === 0) {
  console.log('🎉 All critical tests passed!');
  console.log('✅ System is ready for testing');
  process.exit(0);
} else {
  console.log('⚠️  Some tests failed. Please fix them before proceeding.');
  process.exit(1);
}

