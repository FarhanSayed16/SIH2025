# Parent API Testing with Authentication
# Complete test suite for parent monitoring system
# Parent Monitoring System - Testing Guide

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000/api"

# Colors for output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Parent API Testing with Authentication" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Check if test data exists
Write-Info "Step 1: Checking for test parent user..."
try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" `
        -Method POST `
        -Body (@{
            email = "parent@test.com"
            password = "test123"
        } | ConvertTo-Json) `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $token = $loginResponse.data.accessToken
    $parentId = $loginResponse.data.user._id
    Write-Success "✅ Parent user found and logged in"
    Write-Info "   Parent ID: $parentId"
    Write-Info "   Token: $($token.Substring(0, 20))..."
} catch {
    Write-Warning "⚠️  Test parent user not found or login failed"
    Write-Warning "   Error: $($_.Exception.Message)"
    Write-Warning "`n   Please run: node scripts/create-test-parent.js"
    Write-Warning "   This will create test parent, student, and relationship`n"
    exit 1
}

# Step 2: Test endpoints with authentication
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description
    )
    
    $script:totalTests++
    Write-Info "`n[$script:totalTests] Testing: $Description"
    Write-Info "  $Method $Endpoint"
    
    try {
        $params = @{
            Uri = "$baseUrl$Endpoint"
            Method = $Method
            Headers = $headers
            TimeoutSec = 10
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        $statusCode = $response.StatusCode
        $responseBody = $response.Content | ConvertFrom-Json
        
        if ($statusCode -ge 200 -and $statusCode -lt 300) {
            if ($responseBody.success -eq $true) {
                Write-Success "  ✅ PASSED - Status: $statusCode"
                $script:passedTests++
                return $responseBody
            } else {
                Write-Warning "  ⚠️  PARTIAL - Status: $statusCode but success=false"
                Write-Warning "  Message: $($responseBody.message)"
                $script:passedTests++
                return $responseBody
            }
        } else {
            Write-Error "  ❌ FAILED - Status: $statusCode"
            $script:failedTests++
            return $null
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        Write-Error "  ❌ FAILED - Error: $errorMessage"
        if ($statusCode) {
            Write-Error "  Status Code: $statusCode"
        }
        $script:failedTests++
        return $null
    }
}

# Test 1: Get Children
$childrenResponse = Test-Endpoint -Method "GET" -Endpoint "/parent/children" -Description "Get Parent Children"

# Test 2: Get Child Details (if children exist)
if ($childrenResponse -and $childrenResponse.data.children.Count -gt 0) {
    $studentId = $childrenResponse.data.children[0]._id
    Write-Info "`nFound child with ID: $studentId"
    
    # Test 2.1: Get Child Details
    Test-Endpoint -Method "GET" -Endpoint "/parent/children/$studentId" -Description "Get Child Details"
    
    # Test 2.2: Get Child Progress
    Test-Endpoint -Method "GET" -Endpoint "/parent/children/$studentId/progress" -Description "Get Child Progress"
    
    # Test 2.3: Get Child Location
    Test-Endpoint -Method "GET" -Endpoint "/parent/children/$studentId/location" -Description "Get Child Location"
    
    # Test 2.4: Get Child Drills
    Test-Endpoint -Method "GET" -Endpoint "/parent/children/$studentId/drills" -Description "Get Child Drills"
    
    # Test 2.5: Get Child Attendance
    Test-Endpoint -Method "GET" -Endpoint "/parent/children/$studentId/attendance" -Description "Get Child Attendance"
    
    # Test 2.6: Verify Student QR (if QR code exists)
    if ($childrenResponse.data.children[0].qrCode) {
        $qrBody = @{
            qrCode = $childrenResponse.data.children[0].qrCode
        }
        Test-Endpoint -Method "POST" -Endpoint "/parent/verify-student-qr" -Body $qrBody -Description "Verify Student QR"
    } else {
        Write-Warning "`n⚠️  Skipping QR verification test - Student has no QR code"
    }
} else {
    Write-Warning "`n⚠️  No children found for parent"
    Write-Warning "   Cannot test child-specific endpoints"
    Write-Warning "   Please link children to parent via ParentStudentRelationship"
}

# Test 3: Get Notifications
Test-Endpoint -Method "GET" -Endpoint "/parent/notifications" -Description "Get Notifications"

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Success "Passed: $passedTests"
Write-Error "Failed: $failedTests"

if ($failedTests -eq 0) {
    Write-Success "`n✅ All tests passed!"
} else {
    Write-Warning "`n⚠️  Some tests failed. Check errors above."
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

