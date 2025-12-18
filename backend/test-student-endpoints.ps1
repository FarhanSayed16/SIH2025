# Test Student Endpoints Script
# Tests the new student join-class and leave-class endpoints

Write-Host "🧪 Testing Student Endpoints" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000/api"
$testResults = @()

# Test 1: Health Check
Write-Host "1️⃣ Testing Backend Health..." -ForegroundColor Yellow
try {
    $health = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -ErrorAction Stop
    $healthData = $health.Content | ConvertFrom-Json
    Write-Host "   ✅ Backend is running" -ForegroundColor Green
    Write-Host "   Status: $($healthData.status)" -ForegroundColor Green
    Write-Host "   DB: $($healthData.db)" -ForegroundColor Green
    $testResults += @{Test="Health Check"; Status="✅ PASS"}
} catch {
    Write-Host "   ❌ Backend Health Failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Please start the backend server first: cd backend && npm run dev" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 2: Login as Admin (to create test data)
Write-Host "2️⃣ Logging in as Admin..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@school.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    
    if ($loginData.success -and $loginData.data.accessToken) {
        $adminToken = $loginData.data.accessToken
        $adminUserId = $loginData.data.user.id
        Write-Host "   ✅ Admin login successful" -ForegroundColor Green
        Write-Host "   User: $($loginData.data.user.email)" -ForegroundColor Green
        $testResults += @{Test="Admin Login"; Status="✅ PASS"}
    } else {
        throw "Login failed - no token received"
    }
} catch {
    Write-Host "   ❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Trying alternative admin credentials..." -ForegroundColor Yellow
    
    try {
        $loginBody = @{
            email = "admin@kavach.com"
            password = "admin123"
        } | ConvertTo-Json
        $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
        $loginData = $loginResponse.Content | ConvertFrom-Json
        if ($loginData.success -and $loginData.data.accessToken) {
            $adminToken = $loginData.data.accessToken
            $adminUserId = $loginData.data.user.id
            Write-Host "   ✅ Admin login successful (alternative)" -ForegroundColor Green
            $testResults += @{Test="Admin Login"; Status="✅ PASS"}
        }
    } catch {
        Write-Host "   ❌ All admin login attempts failed" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Test 3: Get or Create a Class
Write-Host "3️⃣ Getting/Creating a Test Class..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
        "Content-Type" = "application/json"
    }
    
    # Try to get existing classes
    $classesResponse = Invoke-WebRequest -Uri "$baseUrl/admin/classes" -Method GET -Headers $headers -ErrorAction Stop
    $classesData = $classesResponse.Content | ConvertFrom-Json
    
    if ($classesData.success -and $classesData.data.classes -and $classesData.data.classes.Count -gt 0) {
        $testClass = $classesData.data.classes[0]
        $testClassCode = $testClass.classCode
        $testClassId = $testClass._id
        Write-Host "   ✅ Found existing class: $testClassCode" -ForegroundColor Green
        Write-Host "   Grade: $($testClass.grade), Section: $($testClass.section)" -ForegroundColor Green
        $testResults += @{Test="Get Class"; Status="✅ PASS"}
    } else {
        # Create a new class
        Write-Host "   No existing classes found. Creating a test class..." -ForegroundColor Yellow
        $institutionId = $loginData.data.user.institutionId
        
        if (-not $institutionId) {
            Write-Host "   ⚠️  Admin has no institutionId. Cannot create class." -ForegroundColor Yellow
            Write-Host "   Please create a class manually or assign institution to admin." -ForegroundColor Yellow
            exit 1
        }
        
        $createClassBody = @{
            institutionId = $institutionId
            grade = "8"
            section = "A"
            teacherId = $adminUserId  # Using admin as teacher for testing
        } | ConvertTo-Json
        
        $createResponse = Invoke-WebRequest -Uri "$baseUrl/admin/classes" -Method POST -Body $createClassBody -Headers $headers -ErrorAction Stop
        $createData = $createResponse.Content | ConvertFrom-Json
        
        if ($createData.success) {
            $testClass = $createData.data.class
            $testClassCode = $testClass.classCode
            $testClassId = $testClass._id
            Write-Host "   ✅ Created test class: $testClassCode" -ForegroundColor Green
            $testResults += @{Test="Create Class"; Status="✅ PASS"}
        } else {
            throw "Failed to create class"
        }
    }
} catch {
    Write-Host "   ❌ Failed to get/create class: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Register a Test Student
Write-Host "4️⃣ Registering a Test Student..." -ForegroundColor Yellow
try {
    $studentEmail = "teststudent$(Get-Random)@test.com"
    $registerBody = @{
        name = "Test Student"
        email = $studentEmail
        password = "Test123456"
        role = "student"
        phone = "9876543210"
        classCode = $testClassCode
    } | ConvertTo-Json
    
    $registerResponse = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json" -ErrorAction Stop
    $registerData = $registerResponse.Content | ConvertFrom-Json
    
    if ($registerData.success -and $registerData.data.accessToken) {
        $studentToken = $registerData.data.accessToken
        $studentId = $registerData.data.user.id
        Write-Host "   ✅ Student registered: $studentEmail" -ForegroundColor Green
        Write-Host "   Class Code used: $testClassCode" -ForegroundColor Green
        Write-Host "   Approval Status: $($registerData.data.user.approvalStatus)" -ForegroundColor Green
        $testResults += @{Test="Student Registration"; Status="✅ PASS"}
    } else {
        throw "Registration failed"
    }
} catch {
    Write-Host "   ❌ Student registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Error Details: $responseBody" -ForegroundColor Red
    }
    exit 1
}
Write-Host ""

# Test 5: Test Join Class Endpoint (should fail - already in class)
Write-Host "5️⃣ Testing Join Class Endpoint (already in class)..." -ForegroundColor Yellow
try {
    $studentHeaders = @{
        "Authorization" = "Bearer $studentToken"
        "Content-Type" = "application/json"
    }
    
    $joinBody = @{
        classCode = $testClassCode
    } | ConvertTo-Json
    
    $joinResponse = Invoke-WebRequest -Uri "$baseUrl/student/join-class" -Method POST -Body $joinBody -Headers $studentHeaders -ErrorAction Stop
    $joinData = $joinResponse.Content | ConvertFrom-Json
    
    if (-not $joinData.success) {
        Write-Host "   ✅ Correctly rejected (already in class): $($joinData.message)" -ForegroundColor Green
        $testResults += @{Test="Join Class (duplicate)"; Status="✅ PASS"}
    } else {
        Write-Host "   ⚠️  Unexpected success (should have been rejected)" -ForegroundColor Yellow
        $testResults += @{Test="Join Class (duplicate)"; Status="⚠️  WARN"}
    }
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        if ($responseBody.message -like "*already*") {
            Write-Host "   ✅ Correctly rejected (already in class): $($responseBody.message)" -ForegroundColor Green
            $testResults += @{Test="Join Class (duplicate)"; Status="✅ PASS"}
        } else {
            Write-Host "   ❌ Unexpected error: $($responseBody.message)" -ForegroundColor Red
            $testResults += @{Test="Join Class (duplicate)"; Status="❌ FAIL"}
        }
    } else {
        Write-Host "   ❌ Request failed: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{Test="Join Class (duplicate)"; Status="❌ FAIL"}
    }
}
Write-Host ""

# Test 6: Test Leave Class Endpoint
Write-Host "6️⃣ Testing Leave Class Endpoint..." -ForegroundColor Yellow
try {
    $leaveResponse = Invoke-WebRequest -Uri "$baseUrl/student/leave-class" -Method POST -Headers $studentHeaders -ErrorAction Stop
    $leaveData = $leaveResponse.Content | ConvertFrom-Json
    
    if ($leaveData.success) {
        Write-Host "   ✅ Student left class successfully" -ForegroundColor Green
        Write-Host "   Message: $($leaveData.message)" -ForegroundColor Green
        $testResults += @{Test="Leave Class"; Status="✅ PASS"}
    } else {
        throw "Leave class failed"
    }
} catch {
    Write-Host "   ❌ Leave class failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="Leave Class"; Status="❌ FAIL"}
}
Write-Host ""

# Test 7: Test Join Class Endpoint (after leaving)
Write-Host "7️⃣ Testing Join Class Endpoint (after leaving)..." -ForegroundColor Yellow
try {
    $joinBody = @{
        classCode = $testClassCode
    } | ConvertTo-Json
    
    $joinResponse = Invoke-WebRequest -Uri "$baseUrl/student/join-class" -Method POST -Body $joinBody -Headers $studentHeaders -ErrorAction Stop
    $joinData = $joinResponse.Content | ConvertFrom-Json
    
    if ($joinData.success) {
        Write-Host "   ✅ Student joined class successfully" -ForegroundColor Green
        Write-Host "   Message: $($joinData.message)" -ForegroundColor Green
        Write-Host "   Approval Status: $($joinData.data.user.approvalStatus)" -ForegroundColor Green
        $testResults += @{Test="Join Class"; Status="✅ PASS"}
    } else {
        throw "Join class failed"
    }
} catch {
    Write-Host "   ❌ Join class failed: $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test="Join Class"; Status="❌ FAIL"}
}
Write-Host ""

# Summary
Write-Host ""
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "============" -ForegroundColor Cyan
foreach ($result in $testResults) {
    $statusColor = if ($result.Status -like "*PASS*") { "Green" } elseif ($result.Status -like "*WARN*") { "Yellow" } else { "Red" }
    Write-Host "$($result.Status) - $($result.Test)" -ForegroundColor $statusColor
}

$passed = ($testResults | Where-Object { $_.Status -like "*PASS*" }).Count
$total = $testResults.Count
Write-Host ""
$color = if ($passed -eq $total) { "Green" } else { "Yellow" }
$msg = "Total: " + $passed + "/" + $total + " tests passed"
Write-Host $msg -ForegroundColor $color

