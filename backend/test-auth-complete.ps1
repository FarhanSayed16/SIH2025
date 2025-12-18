# Complete Authentication System Test
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  KAVACH AUTHENTICATION SYSTEM TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3000/api"
$testResults = @()

# Test 1: Health Check
Write-Host "1️⃣  Testing Server Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/../health" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Server is running" -ForegroundColor Green
    $testResults += @{Test="Health Check"; Status="✅ PASS"}
} catch {
    Write-Host "   ❌ Server not responding: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="Health Check"; Status="❌ FAIL"; Error=$_.Exception.Message}
    exit 1
}

# Test 2: Login with Admin Credentials
Write-Host "`n2️⃣  Testing Login Endpoint..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@school.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    
    # Verify response structure
    $checks = @{
        "success = true" = $loginResponse.success -eq $true
        "data exists" = $null -ne $loginResponse.data
        "user exists" = $null -ne $loginResponse.data.user
        "user.id exists" = $null -ne $loginResponse.data.user.id
        "user._id missing" = $null -eq $loginResponse.data.user._id
        "user.email exists" = $null -ne $loginResponse.data.user.email
        "user.name exists" = $null -ne $loginResponse.data.user.name
        "user.role exists" = $null -ne $loginResponse.data.user.role
        "user.userType exists" = $null -ne $loginResponse.data.user.userType
        "accessToken exists" = $null -ne $loginResponse.data.accessToken
        "refreshToken exists" = $null -ne $loginResponse.data.refreshToken
    }
    
    $allPassed = $true
    foreach ($check in $checks.GetEnumerator()) {
        $status = if ($check.Value) { "✅" } else { "❌" }
        Write-Host "   $status $($check.Key)" -ForegroundColor $(if ($check.Value) { "Green" } else { "Red" })
        if (-not $check.Value) { $allPassed = $false }
    }
    
    if ($allPassed) {
        Write-Host "   ✅ Login successful!" -ForegroundColor Green
        Write-Host "   User: $($loginResponse.data.user.name) ($($loginResponse.data.user.role))" -ForegroundColor Gray
        Write-Host "   User ID: $($loginResponse.data.user.id)" -ForegroundColor Gray
        Write-Host "   UserType: $($loginResponse.data.user.userType)" -ForegroundColor Gray
        $testResults += @{Test="Login Endpoint"; Status="✅ PASS"}
        $accessToken = $loginResponse.data.accessToken
    } else {
        Write-Host "   ❌ Login response structure invalid" -ForegroundColor Red
        $testResults += @{Test="Login Endpoint"; Status="❌ FAIL"; Error="Response structure invalid"}
        $accessToken = $null
    }
} catch {
    Write-Host "   ❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
    $testResults += @{Test="Login Endpoint"; Status="❌ FAIL"; Error=$_.Exception.Message}
    $accessToken = $null
}

# Test 3: Protected Route (Profile) with Token
if ($accessToken) {
    Write-Host "`n3️⃣  Testing Protected Route (Profile)..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }
        $profileResponse = Invoke-RestMethod -Uri "$baseUrl/auth/profile" -Method Get -Headers $headers -ErrorAction Stop
        
        if ($profileResponse.success -and $profileResponse.data.user) {
            Write-Host "   ✅ Profile endpoint working" -ForegroundColor Green
            Write-Host "   User: $($profileResponse.data.user.name)" -ForegroundColor Gray
            $testResults += @{Test="Protected Route"; Status="✅ PASS"}
        } else {
            Write-Host "   ❌ Profile response invalid" -ForegroundColor Red
            $testResults += @{Test="Protected Route"; Status="❌ FAIL"; Error="Invalid response"}
        }
    } catch {
        Write-Host "   ❌ Profile request failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="Protected Route"; Status="❌ FAIL"; Error=$_.Exception.Message}
    }
} else {
    Write-Host "`n3️⃣  Skipping Protected Route Test (no token)" -ForegroundColor Yellow
    $testResults += @{Test="Protected Route"; Status="⏭️  SKIPPED"}
}

# Test 4: Invalid Login
Write-Host "`n4️⃣  Testing Invalid Login..." -ForegroundColor Yellow
$invalidBody = @{
    email = "invalid@test.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $invalidResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $invalidBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ❌ Should have failed but didn't" -ForegroundColor Red
    $testResults += @{Test="Invalid Login"; Status="❌ FAIL"; Error="Should reject invalid credentials"}
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "   ✅ Correctly rejected invalid credentials" -ForegroundColor Green
        $testResults += @{Test="Invalid Login"; Status="✅ PASS"}
    } else {
        Write-Host "   ⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
        $testResults += @{Test="Invalid Login"; Status="⚠️  WARN"; Error=$_.Exception.Message}
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -like "*✅*" }).Count
$failed = ($testResults | Where-Object { $_.Status -like "*❌*" }).Count
$skipped = ($testResults | Where-Object { $_.Status -like "*⏭️*" }).Count

foreach ($result in $testResults) {
    Write-Host "  $($result.Status) $($result.Test)" -ForegroundColor $(if ($result.Status -like "*✅*") { "Green" } elseif ($result.Status -like "*❌*") { "Red" } else { "Yellow" })
    if ($result.Error) {
        Write-Host "      Error: $($result.Error)" -ForegroundColor Gray
    }
}

Write-Host "`n  Total: $($testResults.Count) tests" -ForegroundColor Cyan
Write-Host "  ✅ Passed: $passed" -ForegroundColor Green
Write-Host "  ❌ Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  ⏭️  Skipped: $skipped" -ForegroundColor Yellow

if ($failed -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED! Authentication system is working correctly.`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED. Please review the errors above.`n" -ForegroundColor Red
    exit 1
}

