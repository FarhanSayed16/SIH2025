# Phase 3.4.0: Complete Test Script
# Starts server, waits for it to be ready, then runs tests

Write-Host "Phase 3.4.0: Complete Testing Script" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor White
Write-Host ""

$ErrorActionPreference = "Stop"

# Check if MongoDB is accessible (basic check)
Write-Host "Prerequisites Check:" -ForegroundColor Yellow
Write-Host "  - MongoDB should be running" -ForegroundColor White
Write-Host "  - Node.js and npm should be installed" -ForegroundColor White
Write-Host ""

# Start server in background
Write-Host "Starting backend server..." -ForegroundColor Cyan
$serverProcess = Start-Process node -ArgumentList "src/server.js" -PassThru -WindowStyle Minimized

if (-not $serverProcess) {
    Write-Host "Failed to start server process" -ForegroundColor Red
    exit 1
}

Write-Host "  Server process started (PID: $($serverProcess.Id))" -ForegroundColor Gray
Write-Host ""

# Wait for server to be ready
Write-Host "Waiting for server to start..." -ForegroundColor Yellow
$maxWait = 60
$waited = 0
$serverReady = $false

while ($waited -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthData = $response.Content | ConvertFrom-Json
            if ($healthData.db -eq "connected") {
                $serverReady = $true
                $waitTime = $waited
                Write-Host "Server is ready! (took $waitTime seconds)" -ForegroundColor Green
                Write-Host ""
                break
            }
        }
    } catch {
        # Server not ready yet
    }
    
    $waited += 2
    if ($waited % 6 -eq 0) {
        $currentWait = $waited
        $maxWaitTime = $maxWait
        Write-Host "  Still waiting... ($currentWait/$maxWaitTime seconds)" -ForegroundColor Gray
    }
    Start-Sleep -Seconds 2
}

if (-not $serverReady) {
    $maxWaitTime = $maxWait
    Write-Host "Server did not start within $maxWaitTime seconds" -ForegroundColor Red
    Write-Host "  Killing server process..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Wait a bit more for full initialization
Start-Sleep -Seconds 3

# Run tests
Write-Host "Running Phase 3.4.0 tests..." -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor White
Write-Host ""

$testResult = & node scripts/test-phase3.4.0.js
$testExitCode = $LASTEXITCODE

Write-Host ""
Write-Host "=========================================" -ForegroundColor White
Write-Host ""

# Cleanup: Stop server
Write-Host "Stopping server process..." -ForegroundColor Yellow
try {
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Server stopped" -ForegroundColor Green
} catch {
    Write-Host "Could not stop server process (may have already exited)" -ForegroundColor Yellow
}

Write-Host ""

if ($testExitCode -eq 0) {
    Write-Host "All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Some tests failed (exit code: $testExitCode)" -ForegroundColor Red
    exit $testExitCode
}
