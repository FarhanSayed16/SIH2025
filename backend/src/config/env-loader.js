/**
 * Environment Variables Loader
 * This file MUST be imported first to ensure .env is loaded before any other modules
 */
import dns from 'dns';
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

/**
 * Node on Windows often uses 127.0.0.1 as its DNS stub. That stub frequently
 * fails Atlas `mongodb+srv` lookups with: querySrv ECONNREFUSED _mongodb._tcp...
 * Prefer explicit public resolvers (override with MONGODB_DNS_SERVERS).
 */
function configureMongoDns() {
  const uri = process.env.MONGODB_URI || '';
  if (!uri.includes('mongodb+srv://')) return;

  const fromEnv = process.env.MONGODB_DNS_SERVERS
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const servers = fromEnv?.length ? fromEnv : ['8.8.8.8', '1.1.1.1'];
  try {
    dns.setServers(servers);
    console.info(`ℹ️  MongoDB Atlas DNS resolvers: ${servers.join(', ')}`);
  } catch (err) {
    console.warn('⚠️  Could not set DNS servers for Atlas:', err.message);
  }
}

configureMongoDns();

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
