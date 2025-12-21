# PowerShell API Testing Script
# Usage: .\test-apis.ps1

$baseUrl = "http://localhost:3000"
$token = ""

Write-Host "🧪 Testing Kavach APIs..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Endpoint..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    if ($health.db -eq "connected") {
        Write-Host "✅ Health check passed" -ForegroundColor Green
    } else {
        Write-Host "❌ Health check failed - DB not connected" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 2: Register User
Write-Host "2. Testing User Registration..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = "apitest@example.com"
        password = "test123"
        name = "API Test User"
        role = "student"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" `
        -Method Post `
        -ContentType "application/json" `
        -Body $registerBody

    if ($registerResponse.success) {
        Write-Host "✅ Registration passed" -ForegroundColor Green
        $token = $registerResponse.data.accessToken
        Write-Host "Token: $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Registration failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Login
Write-Host "3. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "apitest@example.com"
        password = "test123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    if ($loginResponse.success) {
        Write-Host "✅ Login passed" -ForegroundColor Green
        $token = $loginResponse.data.accessToken
    }
} catch {
    Write-Host "❌ Login failed: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Test 4: Get Profile (Protected Route)
Write-Host "4. Testing Protected Route (Profile)..." -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    $profileResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/profile" `
        -Method Get `
        -Headers $headers

    if ($profileResponse.success) {
        Write-Host "✅ Protected route passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Protected route failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 5: List Schools
Write-Host "5. Testing List Schools..." -ForegroundColor Yellow
try {
    $schoolsResponse = Invoke-RestMethod -Uri "$baseUrl/api/schools" -Method Get
    if ($schoolsResponse.success) {
        Write-Host "✅ List schools passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ List schools failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 6: Geospatial Nearest (Add-on 1)
Write-Host "6. Testing Geospatial Nearest Schools..." -ForegroundColor Yellow
try {
    $nearestResponse = Invoke-RestMethod -Uri "$baseUrl/api/schools/nearest?lat=28.6139&lng=77.2090&radius=5000" -Method Get
    if ($nearestResponse.success) {
        Write-Host "✅ Geospatial query passed" -ForegroundColor Green
        Write-Host "   Found $($nearestResponse.data.query.count) schools" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Geospatial query failed: $_" -ForegroundColor Red
}
Write-Host ""

# Test 7: List Modules
Write-Host "7. Testing List Modules..." -ForegroundColor Yellow
try {
    $modulesResponse = Invoke-RestMethod -Uri "$baseUrl/api/modules" -Method Get
    if ($modulesResponse.success) {
        Write-Host "✅ List modules passed" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ List modules failed: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Note: For full testing, see docs/PHASE_1.4.1_TESTING_GUIDE.md" -ForegroundColor Cyan

