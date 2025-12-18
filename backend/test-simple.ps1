# Simple Backend Test Script
Write-Host "Testing Backend Endpoints..." -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n1. Health Check..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET
Write-Host "   Status: $($health.status), DB: $($health.db)" -ForegroundColor Green

# Test 2: Login
Write-Host "`n2. Admin Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@school.com"
    password = "admin123"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $login.data.accessToken
Write-Host "   Token received: $($token.Substring(0,20))..." -ForegroundColor Green

# Test 3: Get Classes and Admin Info
Write-Host "`n3. Get Classes..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}
$adminInfo = $login.data.user
Write-Host "   Admin ID: $($adminInfo.id)" -ForegroundColor Cyan
Write-Host "   Admin Institution: $($adminInfo.institutionId)" -ForegroundColor Cyan

$classes = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/classes" -Method GET -Headers $headers
if ($classes.data -and $classes.data.Count -gt 0) {
    # Find a class with valid institutionId and classCode
    $testClass = $classes.data | Where-Object { $_.institutionId -and $_.classCode } | Select-Object -First 1
    if ($testClass) {
        Write-Host "   Found class: $($testClass.classCode)" -ForegroundColor Green
        Write-Host "   Grade: $($testClass.grade), Section: $($testClass.section)" -ForegroundColor Green
    } else {
        Write-Host "   No valid classes found (with institutionId)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   No classes found" -ForegroundColor Yellow
}

# Test 4: Register Student
Write-Host "`n4. Register Student..." -ForegroundColor Yellow
$studentEmail = "teststudent$(Get-Random)@test.com"

# Get a valid classCode first
$classCode = $null
if ($testClass -and $testClass.classCode) {
    $classCode = $testClass.classCode
    Write-Host "   Using existing class code: $classCode" -ForegroundColor Green
} else {
    Write-Host "   Creating a class first..." -ForegroundColor Yellow
    # Get schools first to find an institution
    try {
        $schools = Invoke-RestMethod -Uri "http://localhost:3000/api/schools" -Method GET -Headers $headers
        $institutionId = $null
        if ($schools.data -and $schools.data.Count -gt 0) {
            $institutionId = $schools.data[0]._id
            Write-Host "   Using school: $($schools.data[0].name)" -ForegroundColor Cyan
        } elseif ($adminInfo.institutionId) {
            $institutionId = $adminInfo.institutionId
        }
        
        if ($institutionId) {
            # Get a teacher first
            $users = Invoke-RestMethod -Uri "http://localhost:3000/api/users?role=teacher" -Method GET -Headers $headers
            $teacherId = $null
            if ($users.data -and $users.data.users -and $users.data.users.Count -gt 0) {
                $teacherId = $users.data.users[0]._id
            } else {
                $teacherId = $adminInfo.id  # Use admin as teacher
            }
            
            $createClassBody = @{
                institutionId = $institutionId
                grade = "8"
                section = "A"
                teacherId = $teacherId
            } | ConvertTo-Json
            try {
                $newClass = Invoke-RestMethod -Uri "http://localhost:3000/api/admin/classes" -Method POST -Body $createClassBody -Headers $headers -ContentType "application/json"
                $classCode = $newClass.data.class.classCode
                Write-Host "   Created class with code: $classCode" -ForegroundColor Green
            } catch {
                Write-Host "   Failed to create class: $($_.Exception.Message)" -ForegroundColor Red
                if ($_.Exception.Response) {
                    $stream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $errorBody = $reader.ReadToEnd()
                    Write-Host "   Error details: $errorBody" -ForegroundColor Red
                }
            }
        } else {
            Write-Host "   No institution found - cannot create class" -ForegroundColor Red
        }
    } catch {
        Write-Host "   Failed to get schools: $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $classCode) {
    Write-Host "   Cannot register student - no class code available" -ForegroundColor Red
    exit 1
}

$registerBody = @{
    name = "Test Student"
    email = $studentEmail
    password = "Test123456"
    role = "student"
    phone = "9876543210"
    classCode = $classCode
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    $studentToken = $register.data.accessToken
    $studentId = $register.data.user.id
    Write-Host "   Student registered: $studentEmail" -ForegroundColor Green
    Write-Host "   Student ID: $studentId" -ForegroundColor Green
    Write-Host "   Approval Status: $($register.data.user.approvalStatus)" -ForegroundColor Green
} catch {
    Write-Host "   Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error Response: $errorBody" -ForegroundColor Red
        $errorJson = $errorBody | ConvertFrom-Json
        if ($errorJson.errors) {
            Write-Host "   Field Errors:" -ForegroundColor Red
            $errorJson.errors.PSObject.Properties | ForEach-Object {
                Write-Host "     $($_.Name): $($_.Value)" -ForegroundColor Red
            }
        }
    }
    exit 1
}

# Test 5: Join Class (should fail - already in class from registration)
Write-Host "`n5. Join Class (should fail - already in class)..." -ForegroundColor Yellow
if ($classCode) {
    $studentHeaders = @{
        Authorization = "Bearer $studentToken"
    }
    $joinBody = @{
        classCode = $classCode
    } | ConvertTo-Json
    
    try {
        $join = Invoke-RestMethod -Uri "http://localhost:3000/api/student/join-class" -Method POST -Body $joinBody -Headers $studentHeaders -ContentType "application/json"
        Write-Host "   Join successful: $($join.message)" -ForegroundColor Green
        Write-Host "   Approval Status: $($join.data.user.approvalStatus)" -ForegroundColor Green
    } catch {
        Write-Host "   Join failed: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            Write-Host "   Error: $errorBody" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   Skipping - no class code available" -ForegroundColor Yellow
}

# Test 6: Leave Class
Write-Host "`n6. Leave Class..." -ForegroundColor Yellow
try {
    $leave = Invoke-RestMethod -Uri "http://localhost:3000/api/student/leave-class" -Method POST -Headers $studentHeaders
    Write-Host "   Leave successful: $($leave.message)" -ForegroundColor Green
} catch {
    Write-Host "   Leave failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Testing Complete!" -ForegroundColor Green

