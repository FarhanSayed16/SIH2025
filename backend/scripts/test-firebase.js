/**
 * Test Firebase Admin SDK initialization
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Firebase Admin SDK...\n');

try {
  const serviceAccountPath = path.join(__dirname, '../config/firebase-admin.json');
  console.log('📁 Loading service account from:', serviceAccountPath);
  
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  console.log('✅ Service account loaded');
  console.log('   Project ID:', serviceAccount.project_id);
  console.log('   Client Email:', serviceAccount.client_email);
  
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log('⚠️ Firebase Admin already initialized');
    admin.app().delete();
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'kavach-4a8aa',
  });
  
  console.log('✅ Firebase Admin SDK initialized successfully!');
  console.log('✅ Ready to send push notifications');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization failed:');
  console.error('   Error:', error.message);
  console.error('\n💡 Make sure:');
  console.error('   1. backend/config/firebase-admin.json exists');
  console.error('   2. File contains valid JSON');
  console.error('   3. Service account credentials are correct');
  process.exit(1);
}

