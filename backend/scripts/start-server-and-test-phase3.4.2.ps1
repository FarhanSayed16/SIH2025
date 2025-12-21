# Phase 3.4.2: Start Server and Run IoT Integration Tests

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Phase 3.4.2: IoT Integration - Server & Test Script" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Start server in background
Write-Host "Starting backend server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory (Get-Location) -PassThru -NoNewWindow

# Wait for server to be ready
Write-Host "Waiting for server to start (max 30 seconds)..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts -and -not $serverReady) {
    Start-Sleep -Seconds 1
    $attempt++
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "✅ Server is ready!`n" -ForegroundColor Green
        }
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
}

if (-not $serverReady) {
    Write-Host "`n❌ Server failed to start within 30 seconds" -ForegroundColor Red
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    exit 1
}

# Run tests
Write-Host "Running Phase 3.4.2 IoT Integration tests...`n" -ForegroundColor Yellow
node scripts/test-phase3.4.2-iot.js

$testExitCode = $LASTEXITCODE

# Stop server
Write-Host "`nStopping server..." -ForegroundColor Yellow
Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue

if ($testExitCode -eq 0) {
    Write-Host "`n✅ All tests passed!`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ Some tests failed`n" -ForegroundColor Red
    exit $testExitCode
}

