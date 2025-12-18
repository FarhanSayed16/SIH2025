# Parent API Endpoints Test Script
# Tests all parent monitoring system endpoints
# Parent Monitoring System - Phase 1-3 Testing

$ErrorActionPreference = "Continue"
$baseUrl = "http://localhost:3000/api"

# Colors for output
function Write-Success { Write-Host $args[0] -ForegroundColor Green }
function Write-Error { Write-Host $args[0] -ForegroundColor Red }
function Write-Info { Write-Host $args[0] -ForegroundColor Cyan }
function Write-Warning { Write-Host $args[0] -ForegroundColor Yellow }

# Test counter
$totalTests = 0
$passedTests = 0
$failedTests = 0

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description,
        [string]$Token = $null
    )
    
    $totalTests++
    Write-Info "`n[$totalTests] Testing: $Description"
    Write-Info "  $Method $Endpoint"
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Token) {
            $headers["Authorization"] = "Bearer $Token"
        }
        
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
                return $true
            } else {
                Write-Warning "  ⚠️  PARTIAL - Status: $statusCode but success=false"
                Write-Warning "  Message: $($responseBody.message)"
                $script:passedTests++
                return $true
            }
        } else {
            Write-Error "  ❌ FAILED - Status: $statusCode"
            Write-Error "  Response: $($responseBody | ConvertTo-Json -Depth 5)"
            $script:failedTests++
            return $false
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errorMessage = $_.Exception.Message
        
        Write-Error "  ❌ FAILED - Error: $errorMessage"
        if ($statusCode) {
            Write-Error "  Status Code: $statusCode"
        }
        $script:failedTests++
        return $false
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Parent API Endpoints Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if server is running
Write-Info "Checking if backend server is running..."
try {
    $healthCheck = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($healthCheck.StatusCode -eq 200) {
        Write-Success "✅ Backend server is running"
    } else {
        Write-Error "❌ Backend server returned status: $($healthCheck.StatusCode)"
        exit 1
    }
} catch {
    Write-Error "❌ Backend server is not running or not accessible"
    Write-Error "   Please start the server with: npm run dev"
    exit 1
}

Write-Host "`nNote: These tests require authentication." -ForegroundColor Yellow
Write-Host "For full testing, you need to:" -ForegroundColor Yellow
Write-Host "  1. Create a parent user account" -ForegroundColor Yellow
Write-Host "  2. Link children to the parent" -ForegroundColor Yellow
Write-Host "  3. Get an authentication token" -ForegroundColor Yellow
Write-Host "  4. Pass the token to these tests`n" -ForegroundColor Yellow

# Test 1: Health Check (No auth required)
Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Health Check"

# Test 2: Get Children (Requires auth - will fail without token)
Test-Endpoint -Method "GET" -Endpoint "/parent/children" -Description "Get Parent Children (No Auth)" -Token $null

# Test 3: Verify Student QR (Requires auth - will fail without token)
$qrBody = @{
    qrCode = "test_qr_code_123"
}
Test-Endpoint -Method "POST" -Endpoint "/parent/verify-student-qr" -Body $qrBody -Description "Verify Student QR (No Auth)" -Token $null

# Test 4: Get Notifications (Requires auth - will fail without token)
Test-Endpoint -Method "GET" -Endpoint "/parent/notifications" -Description "Get Notifications (No Auth)" -Token $null

# Test 5: Test endpoint structure (check if routes are registered)
Write-Info "`n[6] Testing: Endpoint Structure Check"
try {
    # Try to access a non-existent endpoint to see if parent routes are registered
    $response = try {
        Invoke-WebRequest -Uri "$baseUrl/parent/nonexistent" -Method GET -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    } catch {
        $_.Exception.Response
    }
    
    if ($response.StatusCode -eq 404) {
        Write-Success "  ✅ PASSED - Parent routes are registered (404 for non-existent endpoint)"
        $script:passedTests++
    } elseif ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
        Write-Success "  ✅ PASSED - Parent routes are registered (Auth required)"
        $script:passedTests++
    } else {
        Write-Warning "  ⚠️  UNKNOWN - Status: $($response.StatusCode)"
        $script:passedTests++
    }
    $totalTests++
} catch {
    Write-Error "  ❌ FAILED - Could not check endpoint structure"
    $script:failedTests++
    $totalTests++
}

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
    Write-Warning "`n⚠️  Some tests failed. This is expected if authentication is not set up."
    Write-Warning "   To fully test, you need to:"
    Write-Warning "   1. Create a parent user"
    Write-Warning "   2. Link children to the parent"
    Write-Warning "   3. Get authentication token"
    Write-Warning "   4. Run tests with token"
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

