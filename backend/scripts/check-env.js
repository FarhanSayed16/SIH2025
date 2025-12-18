#!/usr/bin/env node
/**
 * Check environment variables configuration
 * Run: node scripts/check-env.js
 */

import dotenv from 'dotenv';
import crypto from 'crypto';

// Load .env file
dotenv.config();

console.log('\n🔍 Environment Variables Check\n');
console.log('='.repeat(60));

// Required variables (server won't start without these)
const required = [
  { name: 'JWT_SECRET', description: 'JWT token signing secret' },
  { name: 'MONGODB_URI', description: 'MongoDB connection string' }
];

// Recommended variables (has defaults but recommended)
const recommended = [
  { name: 'JWT_REFRESH_EXPIRE', description: 'Refresh token expiry', default: '7d' },
  { name: 'ENCRYPTION_KEY', description: 'AES-256 encryption key (64 hex chars)', critical: true }
];

// Optional variables
const optional = [
  { name: 'PORT', description: 'Server port', default: '3000' },
  { name: 'NODE_ENV', description: 'Environment mode', default: 'development' },
  { name: 'CORS_ORIGIN', description: 'Allowed CORS origins' },
  { name: 'REDIS_URL', description: 'Redis connection URL' },
  { name: 'GEMINI_API_KEY', description: 'Google Gemini API key' }
];

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log('\n📋 REQUIRED VARIABLES (Server won\'t start without these):\n');
required.forEach(v => {
  const value = process.env[v.name];
  if (!value) {
    console.log(`  ❌ ${v.name}: MISSING - ${v.description}`);
    hasErrors = true;
  } else {
    // Validate JWT_SECRET length
    if (v.name === 'JWT_SECRET' && value.length < 32) {
      console.log(`  ⚠️  ${v.name}: SET but too short (${value.length} chars, min 32 recommended)`);
      hasWarnings = true;
    } else {
      console.log(`  ✅ ${v.name}: SET (${value.length} chars)`);
    }
  }
});

// Check recommended variables
console.log('\n📋 RECOMMENDED VARIABLES (Has defaults but recommended):\n');
recommended.forEach(v => {
  const value = process.env[v.name];
  if (!value) {
    if (v.critical) {
      console.log(`  🚨 ${v.name}: MISSING - ${v.description}`);
      console.log(`     ⚠️  CRITICAL: Without this, encryption key changes on each restart (data loss risk!)`);
      hasWarnings = true;
    } else {
      console.log(`  ⚠️  ${v.name}: MISSING (default: ${v.default}) - ${v.description}`);
    }
  } else {
    // Validate ENCRYPTION_KEY format
    if (v.name === 'ENCRYPTION_KEY') {
      if (value.length !== 64) {
        console.log(`  ❌ ${v.name}: INVALID LENGTH (${value.length} chars, must be 64 hex characters)`);
        hasErrors = true;
      } else if (!/^[0-9a-fA-F]{64}$/.test(value)) {
        console.log(`  ❌ ${v.name}: INVALID FORMAT (must be 64 hex characters)`);
        hasErrors = true;
      } else {
        console.log(`  ✅ ${v.name}: SET (valid 64 hex characters)`);
      }
    } else {
      console.log(`  ✅ ${v.name}: SET (${value})`);
    }
  }
});

// Check optional variables
console.log('\n📋 OPTIONAL VARIABLES:\n');
optional.forEach(v => {
  const value = process.env[v.name];
  if (!value) {
    if (v.default) {
      console.log(`  ⚪ ${v.name}: Not set (default: ${v.default}) - ${v.description}`);
    } else {
      console.log(`  ⚪ ${v.name}: Not set - ${v.description}`);
    }
  } else {
    // Check for placeholder values
    if (value.includes('your-') || value.includes('example') || value === '') {
      console.log(`  ⚠️  ${v.name}: Set but appears to be a placeholder`);
    } else {
      console.log(`  ✅ ${v.name}: SET`);
    }
  }
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 SUMMARY:\n');

if (hasErrors) {
  console.log('  ❌ ERRORS FOUND: Server may not start properly');
  console.log('     Fix the errors above before starting the server.\n');
} else if (hasWarnings) {
  console.log('  ⚠️  WARNINGS FOUND: Server will start but some features may not work optimally');
  console.log('     Review the warnings above for recommended improvements.\n');
} else {
  console.log('  ✅ ALL CHECKS PASSED: Environment is properly configured!\n');
}

// Generate missing secrets if needed
const needsEncryptionKey = !process.env.ENCRYPTION_KEY;
if (needsEncryptionKey) {
  console.log('🔐 GENERATE MISSING SECRETS:\n');
  console.log('Run: node scripts/generate-secrets.js\n');
}

console.log('='.repeat(60) + '\n');

