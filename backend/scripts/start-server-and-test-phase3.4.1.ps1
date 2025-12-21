# Phase 3.4.1: Start Server and Run Analytics Tests (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "   Phase 3.4.1: Start Server & Run Analytics Tests" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green

$backendPath = Split-Path -Parent $PSScriptRoot
Set-Location $backendPath

# Initialize variables
$serverWasRunning = $false
$serverProcess = $null

# Check if server is already running
Write-Host "🔍 Checking if server is already running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Server is already running on port 3000`n" -ForegroundColor Green
    $serverWasRunning = $true
} catch {
    Write-Host "⚠️  Server is not running. Starting server...`n" -ForegroundColor Yellow
    $serverWasRunning = $false

    # Start server in background
    Write-Host "📋 Starting backend server...`n" -ForegroundColor Yellow
    $serverProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -PassThru -WindowStyle Minimized
    
    # Wait for server to be ready
    Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $serverReady = $false

    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 2
        $waited += 2
        
        try {
            $healthCheck = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 2 -ErrorAction Stop
            if ($healthCheck.StatusCode -eq 200) {
                $content = $healthCheck.Content | ConvertFrom-Json
                if ($content.db -eq "connected") {
                    Write-Host "✅ Server is ready! (waited ${waited}s)`n" -ForegroundColor Green
                    $serverReady = $true
                    break
                }
            }
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }

    if (-not $serverReady) {
        Write-Host "`n❌ Server did not start within ${maxWait} seconds" -ForegroundColor Red
        Write-Host "Please check the server logs and try again" -ForegroundColor Red
        if ($serverProcess) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

# Run tests
Write-Host "🧪 Running analytics API tests...`n" -ForegroundColor Cyan
node scripts/test-phase3.4.1-analytics.js
$testExitCode = $LASTEXITCODE

# Cleanup: Stop server if we started it
if (-not $serverWasRunning -and $serverProcess) {
    Write-Host "`n🛑 Stopping server..." -ForegroundColor Yellow
    try {
        Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Server stopped`n" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not stop server process. Please stop it manually.`n" -ForegroundColor Yellow
    }
}

# Exit with test result
if ($testExitCode -eq 0) {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "✅ PHASE 3.4.1 ANALYTICS API TESTING - COMPLETE!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "❌ PHASE 3.4.1 ANALYTICS API TESTING - FAILED!" -ForegroundColor Red
    Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Red
    exit 1
}

