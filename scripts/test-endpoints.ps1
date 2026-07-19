# Simple Endpoint Test
$baseUrl = "http://localhost:3000/api"

Write-Host "`n=== Testing API Endpoints ===" -ForegroundColor Cyan

# Test 1: Health
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET -TimeoutSec 3
    Write-Host "✅ GET /api/health - PASS" -ForegroundColor Green
} catch {
    Write-Host "❌ GET /api/health - FAIL: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Auth Profile (should require auth)
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method GET -TimeoutSec 3
    Write-Host "⚠️ GET /api/auth/profile - No auth required (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ GET /api/auth/profile - Requires auth (expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ GET /api/auth/profile - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Admin Classes (should require auth)
try {
    $classes = Invoke-RestMethod -Uri "$baseUrl/admin/classes" -Method GET -TimeoutSec 3
    Write-Host "⚠️ GET /api/admin/classes - No auth required (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ GET /api/admin/classes - Requires auth (expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ GET /api/admin/classes - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Teacher Classes (should require auth)
try {
    $teacherClasses = Invoke-RestMethod -Uri "$baseUrl/teacher/classes" -Method GET -TimeoutSec 3
    Write-Host "⚠️ GET /api/teacher/classes - No auth required (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ GET /api/teacher/classes - Requires auth (expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ GET /api/teacher/classes - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: Student Join (should require auth)
try {
    $join = Invoke-RestMethod -Uri "$baseUrl/student/join-class" -Method POST -Body (@{classCode="TEST"} | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 3
    Write-Host "⚠️ POST /api/student/join-class - No auth required (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ POST /api/student/join-class - Requires auth (expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ POST /api/student/join-class - FAIL: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan

