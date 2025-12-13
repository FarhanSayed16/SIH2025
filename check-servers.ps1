# Quick Server Status Check
$backendOk = $false
$frontendOk = $false

Write-Host "`n=== Server Status Check ===" -ForegroundColor Cyan

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 3
    Write-Host "✅ Backend: RUNNING" -ForegroundColor Green
    $backendOk = $true
} catch {
    Write-Host "❌ Backend: NOT RUNNING" -ForegroundColor Red
}

try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 3
    Write-Host "✅ Frontend: RUNNING (Status: $($frontend.StatusCode))" -ForegroundColor Green
    $frontendOk = $true
} catch {
    Write-Host "❌ Frontend: NOT RUNNING" -ForegroundColor Red
}

if ($backendOk -and $frontendOk) {
    Write-Host "`n✅ Both servers are running! Ready for testing." -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️ Some servers are not running. Please check." -ForegroundColor Yellow
    exit 1
}

