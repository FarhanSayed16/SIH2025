# Final Backend Test - Student Endpoints
Write-Host "=== Backend Student Endpoints Test ===" -ForegroundColor Cyan
Write-Host ""

# 1. Health
Write-Host "[1/6] Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3000/health"
Write-Host "  OK - Status: $($health.status), DB: $($health.db)" -ForegroundColor Green
Write-Host ""

# 2. Login
Write-Host "[2/6] Admin Login..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body (@{email="admin@school.com";password="admin123"} | ConvertTo-Json) -ContentType "application/json"
$token = $login.data.accessToken
$headers = @{Authorization="Bearer $token"}
Write-Host "  OK - Logged in as: $($login.data.user.email)" -ForegroundColor Green
Write-Host ""

# 3. Get Class
Write-Host "[3/6] Get Test Class..." -ForegroundColor Yellow
$classes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/classes" -Method GET -Headers $headers
$testClass = $classes.data | Where-Object { $_.institutionId -and $_.classCode } | Select-Object -First 1
if ($testClass) {
    Write-Host "  OK - Class: $($testClass.classCode) (Grade $($testClass.grade)-$($testClass.section))" -ForegroundColor Green
    $classCode = $testClass.classCode
} else {
    Write-Host "  FAIL - No valid class found" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 4. Register Student (WITHOUT classCode - students can join later)
Write-Host "[4/6] Register Student (without classCode)..." -ForegroundColor Yellow
$studentEmail = "teststudent$(Get-Random)@test.com"
$registerData = @{
    name = "Test Student"
    email = $studentEmail
    password = "Test123456"
    role = "student"
    phone = "9876543210"
    # NOTE: classCode is OPTIONAL - students can join class later
} | ConvertTo-Json

try {
    $register = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerData -ContentType "application/json"
    $registerResult = $register.Content | ConvertFrom-Json
    $studentToken = $registerResult.data.accessToken
    $studentId = $registerResult.data.user.id
    Write-Host "  OK - Student registered: $studentEmail" -ForegroundColor Green
    Write-Host "      Approval Status: $($registerResult.data.user.approvalStatus)" -ForegroundColor Green
    Write-Host "      Class ID: $($registerResult.data.user.classId)" -ForegroundColor Cyan
} catch {
    Write-Host "  FAIL - Registration error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $errorReader = New-Object System.IO.StreamReader($errorStream)
        $errorText = $errorReader.ReadToEnd()
        Write-Host "  Error Response: $errorText" -ForegroundColor Red
        try {
            $errorJson = $errorText | ConvertFrom-Json
            Write-Host "  Message: $($errorJson.message)" -ForegroundColor Red
            if ($errorJson.errors) {
                Write-Host "  Field Errors:" -ForegroundColor Red
                $errorJson.errors.PSObject.Properties | ForEach-Object {
                    Write-Host "    $($_.Name): $($_.Value)" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "  Raw: $errorText" -ForegroundColor Red
        }
    }
    exit 1
}
Write-Host ""

# 5. Test Join Class (student should be able to join now)
Write-Host "[5/6] Test Join Class..." -ForegroundColor Yellow
$studentHeaders = @{Authorization="Bearer $studentToken"}
$joinData = @{classCode=$classCode} | ConvertTo-Json

try {
    $join = Invoke-RestMethod -Uri "http://localhost:3000/api/student/join-class" -Method POST -Body $joinData -Headers $studentHeaders -ContentType "application/json"
    Write-Host "  OK - Join successful: $($join.message)" -ForegroundColor Green
    Write-Host "      Approval Status: $($join.data.user.approvalStatus)" -ForegroundColor Green
    Write-Host "      Class: $($join.data.user.grade)-$($join.data.user.section)" -ForegroundColor Green
} catch {
    $errorStream = $_.Exception.Response.GetResponseStream()
    $errorReader = New-Object System.IO.StreamReader($errorStream)
    $errorText = $errorReader.ReadToEnd()
    $errorJson = $errorText | ConvertFrom-Json
    Write-Host "  FAIL - Join failed: $($errorJson.message)" -ForegroundColor Red
}
Write-Host ""

# 6. Test Leave Class
Write-Host "[6/6] Test Leave Class..." -ForegroundColor Yellow
try {
    $leave = Invoke-RestMethod -Uri "http://localhost:3000/api/student/leave-class" -Method POST -Headers $studentHeaders
    Write-Host "  OK - Left class: $($leave.message)" -ForegroundColor Green
} catch {
    Write-Host "  FAIL - Leave error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 7. Test Join Class Again (should fail - already in class)
Write-Host "[7/7] Test Join Class Again (should fail - already in class)..." -ForegroundColor Yellow
try {
    $join2 = Invoke-RestMethod -Uri "http://localhost:3000/api/student/join-class" -Method POST -Body $joinData -Headers $studentHeaders -ContentType "application/json"
    Write-Host "  WARN - Join succeeded (unexpected - should be rejected)" -ForegroundColor Yellow
} catch {
    $errorStream = $_.Exception.Response.GetResponseStream()
    $errorReader = New-Object System.IO.StreamReader($errorStream)
    $errorText = $errorReader.ReadToEnd()
    $errorJson = $errorText | ConvertFrom-Json
    if ($errorJson.message -like "*already*") {
        Write-Host "  OK - Correctly rejected: $($errorJson.message)" -ForegroundColor Green
    } else {
        Write-Host "  FAIL - Unexpected error: $($errorJson.message)" -ForegroundColor Red
    }
}
Write-Host ""

Write-Host "=== Test Complete ===" -ForegroundColor Cyan

