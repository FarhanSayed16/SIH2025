# Flutter App Runner and Monitor
# This script runs the Flutter app and monitors for errors

Write-Host "`n🚀 Flutter App Runner & Monitor`n"
Write-Host "=====================================`n"

$deviceId = "2312DRA50I"
$devTunnelUrl = "https://bnc51nt1-3000.inc1.devtunnels.ms"

Write-Host "Configuration:"
Write-Host "  Device: $deviceId"
Write-Host "  Backend: $devTunnelUrl`n"

# Check if device is connected
Write-Host "Checking device connection..."
$devices = flutter devices 2>&1
if ($devices -match $deviceId) {
    Write-Host "✅ Device $deviceId is connected`n"
} else {
    Write-Host "❌ Device $deviceId not found!"
    Write-Host "Available devices:"
    flutter devices
    exit 1
}

# Test backend connectivity
Write-Host "Testing backend connectivity..."
try {
    $health = Invoke-RestMethod -Uri "$devTunnelUrl/health" -Method Get -TimeoutSec 5 -SkipCertificateCheck
    Write-Host "✅ Backend is accessible`n"
} catch {
    Write-Host "⚠️ Backend might not be accessible: $($_.Exception.Message)"
    Write-Host "   Continuing anyway...`n"
}

# Run Flutter app
Write-Host "Starting Flutter app..."
Write-Host "=====================================`n"

flutter run -d $deviceId --verbose

