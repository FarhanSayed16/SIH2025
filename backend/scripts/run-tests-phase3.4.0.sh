#!/bin/bash
# Phase 3.4.0: Test Runner Script
# Waits for server to be ready, then runs tests

echo "🧪 Phase 3.4.0 Test Runner"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if server is running
check_server() {
  curl -s http://localhost:5000/health > /dev/null 2>&1
  return $?
}

# Wait for server to be ready
echo "⏳ Checking if server is running..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if check_server; then
    echo "✅ Server is ready!"
    echo ""
    break
  else
    attempt=$((attempt + 1))
    echo "  Waiting for server... ($attempt/$max_attempts)"
    sleep 2
  fi
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Server did not start within $max_attempts attempts"
  echo "Please start the server with: npm start"
  exit 1
fi

# Run tests
echo "🧪 Running Phase 3.4.0 tests..."
echo ""
node scripts/test-phase3.4.0.js

exit_code=$?
echo ""
if [ $exit_code -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Some tests failed (exit code: $exit_code)"
fi

exit $exit_code

