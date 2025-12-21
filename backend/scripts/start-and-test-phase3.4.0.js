/**
 * Phase 3.4.0: Start Server and Run Tests
 * This script waits for the server to be ready before running tests
 */

import { spawn } from 'child_process';
import axios from 'axios';

const SERVER_URL = 'http://localhost:5000';
const MAX_WAIT_TIME = 60000; // 60 seconds
const CHECK_INTERVAL = 2000; // 2 seconds

// Start server
console.log('🚀 Starting backend server...\n');
const serverProcess = spawn('npm', ['start'], {
  cwd: process.cwd(),
  shell: true,
  stdio: 'inherit',
});

let serverReady = false;
let waitTime = 0;

// Wait for server to be ready
const checkServer = setInterval(async () => {
  try {
    const response = await axios.get(`${SERVER_URL}/health`, { timeout: 2000 });
    if (response.status === 200) {
      serverReady = true;
      clearInterval(checkServer);
      console.log('✅ Server is ready!\n');
      console.log('🧪 Running Phase 3.4.0 tests...\n');
      
      // Import and run test script
      const { default: runTests } = await import('./test-phase3.4.0.js');
      if (typeof runTests === 'function') {
        await runTests();
      } else {
        // If it doesn't export a function, run it directly
        const testModule = await import('./test-phase3.4.0.js');
        // The test script should run on import if it doesn't export
      }
      
      // Give tests time to complete, then exit
      setTimeout(() => {
        console.log('\n⏹️  Stopping server...\n');
        serverProcess.kill();
        process.exit(0);
      }, 5000);
    }
  } catch (error) {
    waitTime += CHECK_INTERVAL;
    if (waitTime >= MAX_WAIT_TIME) {
      clearInterval(checkServer);
      console.error('\n❌ Server did not start in time');
      serverProcess.kill();
      process.exit(1);
    }
  }
}, CHECK_INTERVAL);

// Handle server process exit
serverProcess.on('exit', (code) => {
  if (!serverReady) {
    console.error(`\n❌ Server process exited with code ${code}`);
    process.exit(1);
  }
});

