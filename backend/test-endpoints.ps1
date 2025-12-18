# Comprehensive Backend & Frontend Testing Script
# Tests all new RBAC endpoints and existing functionality

Write-Host "🧪 Testing Kavach Backend & Frontend" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Backend Health
Write-Host "1️⃣ Testing Backend Health..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    $health = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend Health: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor Green
    Write-Host "   DB: $($health.db)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Backend Health Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Web Frontend
Write-Host "2️⃣ Testing Web Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5
    Write-Host "   ✅ Web Frontend: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Web Frontend Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: API Info Endpoint
Write-Host "3️⃣ Testing API Info..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api" -Method GET -TimeoutSec 5
    $apiInfo = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ API Info: $($apiInfo.message)" -ForegroundColor Green
    Write-Host "   Available Endpoints:" -ForegroundColor Cyan
    $apiInfo.endpoints.PSObject.Properties | ForEach-Object {
        Write-Host "      - $($_.Name): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "   ❌ API Info Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: New Classroom Join Routes (without auth - should fail with 401)
Write-Host "4️⃣ Testing Classroom Join Routes (Unauthenticated)..." -ForegroundColor Yellow
try {
    $body = @{
        qrCode = "test-qr-code"
        studentInfo = @{
            name = "Test Student"
            email = "test@example.com"
        }
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/classroom/join/scan" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Unexpected success (should require auth)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "   ✅ Correctly requires authentication (Status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected error: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 5: New Roster Routes (without auth - should fail with 401)
Write-Host "5️⃣ Testing Roster Routes (Unauthenticated)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/roster/test-class-id/students" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ⚠️  Unexpected success (should require auth)" -ForegroundColor Yellow
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401 -or $statusCode -eq 403) {
        Write-Host "   ✅ Correctly requires authentication (Status: $statusCode)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected error: $statusCode" -ForegroundColor Yellow
    }
}
Write-Host ""

# Test 6: Auth Routes Available
Write-Host "6️⃣ Testing Auth Routes Availability..." -ForegroundColor Yellow
$authEndpoints = @(
    "/api/auth/register",
    "/api/auth/login",
    "/api/auth/refresh"
)

foreach ($endpoint in $authEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000$endpoint" -Method OPTIONS -TimeoutSec 3 -ErrorAction SilentlyContinue
        Write-Host "   ✅ $endpoint - Available" -ForegroundColor Green
    } catch {
        # OPTIONS might not be supported, try POST with empty body
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000$endpoint" -Method POST -Body "{}" -ContentType "application/json" -TimeoutSec 3 -ErrorAction SilentlyContinue
            Write-Host "   ✅ $endpoint - Available (returns validation error as expected)" -ForegroundColor Green
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.value__
            if ($statusCode -eq 400 -or $statusCode -eq 422) {
                Write-Host "   ✅ $endpoint - Available (validation error: $statusCode)" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  $endpoint - Status: $statusCode" -ForegroundColor Yellow
            }
        }
    }
}
Write-Host ""

# Test 7: Check Port Status
Write-Host "7️⃣ Checking Port Status..." -ForegroundColor Yellow
$port3000 = netstat -ano | findstr ":3000" | Select-Object -First 1
$port3001 = netstat -ano | findstr ":3001" | Select-Object -First 1

if ($port3000) {
    Write-Host "   ✅ Port 3000 (Backend): LISTENING" -ForegroundColor Green
} else {
    Write-Host "   ❌ Port 3000 (Backend): NOT LISTENING" -ForegroundColor Red
}

if ($port3001) {
    Write-Host "   ✅ Port 3001 (Web): LISTENING" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Port 3001 (Web): NOT LISTENING" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "✅ Testing Complete!" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

