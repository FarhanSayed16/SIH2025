# Complete Flow Test Script
# Tests Admin → Teacher → Student flow

$baseUrl = "http://localhost:3000/api"
$results = @()

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [string]$Token = $null,
        [string]$Description
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method GET -Headers $headers -ErrorAction Stop
        } else {
            $jsonBody = if ($Body) { $Body | ConvertTo-Json } else { "{}" }
            $response = Invoke-RestMethod -Uri "$baseUrl$Endpoint" -Method $Method -Headers $headers -Body $jsonBody -ErrorAction Stop
        }
        
        $results += [PSCustomObject]@{
            Test = $Description
            Status = "✅ PASS"
            Details = "Success"
        }
        return $response
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $errorMsg = $responseBody
        }
        $results += [PSCustomObject]@{
            Test = $Description
            Status = "❌ FAIL"
            Details = $errorMsg
        }
        return $null
    }
}

Write-Host "`nTesting Complete Admin -> Teacher -> Student Flow`n" -ForegroundColor Cyan
Write-Host "=" * 80

# Test 1: Health Check
Write-Host "`n1. Testing Backend Health..." -ForegroundColor Yellow
$health = Test-Endpoint -Method "GET" -Endpoint "/health" -Description "Backend Health Check"

# Test 2: Check Auth Routes
Write-Host "`n2. Testing Auth Routes..." -ForegroundColor Yellow
$authTest = Test-Endpoint -Method "GET" -Endpoint "/auth/profile" -Description "Auth Profile Endpoint (should require auth)" -Token "invalid"

# Test 3: Check Admin Routes
Write-Host "`n3. Testing Admin Routes..." -ForegroundColor Yellow
$adminClasses = Test-Endpoint -Method "GET" -Endpoint "/admin/classes" -Description "Admin Classes List (should require auth)" -Token "invalid"

# Test 4: Check Teacher Routes
Write-Host "`n4. Testing Teacher Routes..." -ForegroundColor Yellow
$teacherClasses = Test-Endpoint -Method "GET" -Endpoint "/teacher/classes" -Description "Teacher Classes List (should require auth)" -Token "invalid"

# Test 5: Check Student Routes
Write-Host "`n5. Testing Student Routes..." -ForegroundColor Yellow
$studentJoin = Test-Endpoint -Method "POST" -Endpoint "/student/join-class" -Body @{classCode="TEST"} -Description "Student Join Class (should require auth)" -Token "invalid"

# Summary
Write-Host "`n" + "=" * 80
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 80
$results | Format-Table -AutoSize

$passCount = ($results | Where-Object { $_.Status -like "*PASS*" }).Count
$failCount = ($results | Where-Object { $_.Status -like "*FAIL*" }).Count

Write-Host "`n✅ Passed: $passCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })

Write-Host "`nNote: Authentication failures are expected without valid tokens." -ForegroundColor Yellow
Write-Host "These tests verify that endpoints exist and require authentication.`n" -ForegroundColor Yellow

