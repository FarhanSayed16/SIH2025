/**
 * Environment Variables Loader
 * This file MUST be imported first to ensure .env is loaded before any other modules
 */
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from the backend root directory (one level up from src/config)
const envPath = resolve(__dirname, '../../.env');

// Load environment variables
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message);
  console.warn('   Make sure .env file exists in the backend/ directory');
} else {
  // Verify critical variables are loaded
  if (!process.env.JWT_SECRET) {
    console.error('❌ ERROR: JWT_SECRET is not set in .env file');
    console.error('   The server will not start without JWT_SECRET');
  }
  if (!process.env.MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not set in .env file');
    console.error('   The server will not start without MONGODB_URI');
  }
}

export default result;

