# Phase 3.4.1: Analytics API Test Runner (PowerShell)

Write-Host "`n═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "   Phase 3.4.1: Analytics API Testing" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Check if Node.js is available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Navigate to backend directory
$backendPath = Split-Path -Parent $PSScriptRoot
Set-Location $backendPath

Write-Host "📍 Running tests from: $backendPath`n" -ForegroundColor Yellow

# Run the test script
Write-Host "🚀 Starting analytics API tests...`n" -ForegroundColor Green
node scripts/test-phase3.4.1-analytics.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Some tests failed. Check the output above for details." -ForegroundColor Red
    exit 1
}

