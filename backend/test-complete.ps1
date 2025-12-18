# Complete Backend Test - Student Endpoints
Write-Host "=== Complete Backend Test ===" -ForegroundColor Cyan
Write-Host ""

$random = Get-Random -Minimum 100000000 -Maximum 999999999
$studentEmail = "teststudent$random@test.com"
$studentPhone = "9$random"

Write-Host "[1/7] Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3000/health"
Write-Host "  ✅ OK - Status: $($health.status), DB: $($health.db)" -ForegroundColor Green
Write-Host ""

Write-Host "[2/7] Admin Login..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{email="admin@school.com";password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$token = $login.data.accessToken
$headers = @{Authorization="Bearer $token"}
Write-Host "  ✅ OK - Logged in as: $($login.data.user.email)" -ForegroundColor Green
Write-Host ""

Write-Host "[3/7] Get Test Class..." -ForegroundColor Yellow
$classes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/classes" -Method GET -Headers $headers
$testClass = $classes.data | Where-Object { $_.institutionId -and $_.classCode } | Select-Object -First 1
if ($testClass) {
    Write-Host "  ✅ OK - Class: $($testClass.classCode) (Grade $($testClass.grade)-$($testClass.section))" -ForegroundColor Green
    $classCode = $testClass.classCode
} else {
    Write-Host "  ❌ FAIL - No valid class found" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[4/7] Register Student (WITHOUT classCode)..." -ForegroundColor Yellow
$registerData = @{
    name = "Test Student"
    email = $studentEmail
    password = "Test123456"
    role = "student"
    phone = $studentPhone
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    $studentToken = $register.data.accessToken
    $studentId = $register.data.user.id
    Write-Host "  ✅ OK - Student registered: $studentEmail" -ForegroundColor Green
    Write-Host "      Approval: $($register.data.user.approvalStatus)" -ForegroundColor Cyan
    Write-Host "      Has ClassId: $($register.data.user.classId -ne $null)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ FAIL - Registration error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $errorReader.ReadToEnd()
        Write-Host "  Error Details: $errorText" -ForegroundColor Red
        try {
            $errorJson = $errorText | ConvertFrom-Json
            Write-Host "  Message: $($errorJson.message)" -ForegroundColor Red
            if ($errorJson.errors) {
                $errorJson.errors.PSObject.Properties | ForEach-Object {
                    Write-Host "    $($_.Name): $($_.Value)" -ForegroundColor Red
                }
            }
        } catch {}
    }
    exit 1
}
Write-Host ""

Write-Host "[5/7] Test Join Class..." -ForegroundColor Yellow
$studentHeaders = @{Authorization="Bearer $studentToken"}
$joinData = @{classCode=$classCode} | ConvertTo-Json

try {
    $join = Invoke-RestMethod -Uri "http://localhost:3000/api/student/join-class" -Method POST -Body $joinData -Headers $studentHeaders -ContentType "application/json"
    Write-Host "  ✅ OK - Join successful: $($join.message)" -ForegroundColor Green
    Write-Host "      Approval Status: $($join.data.user.approvalStatus)" -ForegroundColor Cyan
    Write-Host "      Grade: $($join.data.user.grade), Section: $($join.data.user.section)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ FAIL - Join error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "[6/7] Test Join Class Again (should fail - already in class)..." -ForegroundColor Yellow
try {
    $join2 = Invoke-RestMethod -Uri "http://localhost:3000/api/student/join-class" -Method POST -Body $joinData -Headers $studentHeaders -ContentType "application/json"
    Write-Host "  ⚠️  WARN - Join succeeded (unexpected)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $errorReader.ReadToEnd()
        try {
            $errorJson = $errorText | ConvertFrom-Json
            if ($errorJson.message -like "*already*" -or $errorJson.message -like "*waiting*") {
                Write-Host "  ✅ OK - Correctly rejected: $($errorJson.message)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  WARN - Error: $($errorJson.message)" -ForegroundColor Yellow
            }
        } catch {
            if ($errorText -like "*already*" -or $errorText -like "*waiting*") {
                Write-Host "  ✅ OK - Correctly rejected (duplicate join)" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  WARN - Error response: $errorText" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  ⚠️  WARN - No error response" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "[7/7] Test Leave Class..." -ForegroundColor Yellow
try {
    $leave = Invoke-RestMethod -Uri "http://localhost:3000/api/student/leave-class" -Method POST -Headers $studentHeaders
    Write-Host "  ✅ OK - Leave successful: $($leave.message)" -ForegroundColor Green
    Write-Host "      Has ClassId: $($leave.data.user.classId -ne $null)" -ForegroundColor Cyan
} catch {
    Write-Host "  ❌ FAIL - Leave error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== All Tests Complete ===" -ForegroundColor Green

