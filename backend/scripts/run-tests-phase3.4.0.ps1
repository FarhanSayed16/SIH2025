# Phase 3.4.0: Test Runner Script (PowerShell)
# Waits for server to be ready, then runs tests

Write-Host "🧪 Phase 3.4.0 Test Runner" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor White
Write-Host ""

# Function to check if server is running
function Test-Server {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Wait for server to be ready
Write-Host "⏳ Checking if server is running..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts) {
    if (Test-Server) {
        Write-Host "✅ Server is ready!" -ForegroundColor Green
        Write-Host ""
        $serverReady = $true
        break
    } else {
        $attempt++
        Write-Host "  Waiting for server... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Host "❌ Server did not start within $maxAttempts attempts" -ForegroundColor Red
    Write-Host "Please start the server with: npm start" -ForegroundColor Yellow
    exit 1
}

# Run tests
Write-Host "🧪 Running Phase 3.4.0 tests..." -ForegroundColor Cyan
Write-Host ""
node scripts/test-phase3.4.0.js

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ All tests passed!" -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed (exit code: $exitCode)" -ForegroundColor Red
}

exit $exitCode

