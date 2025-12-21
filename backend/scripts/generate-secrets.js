#!/usr/bin/env node
/**
 * Generate secure secrets for .env file
 * Run: node scripts/generate-secrets.js
 */

import crypto from 'crypto';

console.log('\n🔐 Generating Secure Secrets for Kavach Backend\n');
console.log('=' .repeat(60));
console.log('\n📋 Add these to your .env file:\n');

// Generate JWT_SECRET (32 bytes = 64 hex characters)
const jwtSecret = crypto.randomBytes(32).toString('hex');
console.log(`JWT_SECRET=${jwtSecret}`);

// Generate ENCRYPTION_KEY (32 bytes = 64 hex characters)
const encryptionKey = crypto.randomBytes(32).toString('hex');
console.log(`ENCRYPTION_KEY=${encryptionKey}`);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets generated successfully!');
console.log('\n📝 Next steps:');
console.log('1. Copy the JWT_SECRET and ENCRYPTION_KEY above');
console.log('2. Add them to your backend/.env file');
console.log('3. Restart your server: npm run dev');
console.log('\n⚠️  IMPORTANT: Keep these secrets secure and never commit them to version control!\n');

