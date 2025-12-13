# Monitoring Script for Manual Testing
# This script monitors server status and API endpoints during manual testing

$backendUrl = "http://localhost:3000/api"
$frontendUrl = "http://localhost:3001"
$testResults = @()
$startTime = Get-Date

Write-Host "`n=== TESTING MONITOR STARTED ===" -ForegroundColor Cyan
Write-Host "Start Time: $startTime" -ForegroundColor Gray
Write-Host "Monitoring servers while you test manually...`n" -ForegroundColor Yellow

function Test-Server {
    param([string]$Name, [string]$Url, [string]$Method = "GET")
    
    try {
        if ($Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 3 -ErrorAction Stop
            return @{Status = "OK"; Code = $response.StatusCode; Time = Get-Date}
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        return @{Status = "ERROR"; Code = $statusCode; Time = Get-Date; Message = $_.Exception.Message}
    }
}

function Test-Endpoint {
    param([string]$Name, [string]$Url, [string]$Method = "GET", [hashtable]$Body = $null)
    
    try {
        if ($Method -eq "POST" -and $Body) {
            $jsonBody = $Body | ConvertTo-Json
            $response = Invoke-WebRequest -Uri $Url -Method POST -Body $jsonBody -ContentType "application/json" -TimeoutSec 3 -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 3 -ErrorAction Stop
        }
        return @{Status = "OK"; Code = $response.StatusCode; Time = Get-Date}
    } catch {
        $statusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { "TIMEOUT" }
        return @{Status = "ERROR"; Code = $statusCode; Time = Get-Date; Message = $_.Exception.Message}
    }
}

# Initial Server Check
Write-Host "`n[INITIAL CHECK] Verifying servers are running..." -ForegroundColor Yellow
$backendCheck = Test-Server "Backend" "$backendUrl/health"
$frontendCheck = Test-Server "Frontend" $frontendUrl

if ($backendCheck.Status -eq "OK") {
    Write-Host "✅ Backend: RUNNING (Status: $($backendCheck.Code))" -ForegroundColor Green
} else {
    Write-Host "❌ Backend: NOT RUNNING" -ForegroundColor Red
}

if ($frontendCheck.Status -eq "OK") {
    Write-Host "✅ Frontend: RUNNING (Status: $($frontendCheck.Code))" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend: NOT RUNNING" -ForegroundColor Red
}

# Test Key Endpoints
Write-Host "`n[ENDPOINT CHECK] Testing key API endpoints..." -ForegroundColor Yellow

$endpoints = @(
    @{Name = "Health Check"; Url = "$backendUrl/health"; Method = "GET"},
    @{Name = "Auth Profile"; Url = "$backendUrl/auth/profile"; Method = "GET"},
    @{Name = "Admin Classes"; Url = "$backendUrl/admin/classes"; Method = "GET"},
    @{Name = "Teacher Classes"; Url = "$backendUrl/teacher/classes"; Method = "GET"},
    @{Name = "Student Join"; Url = "$backendUrl/student/join-class"; Method = "POST"; Body = @{classCode = "TEST"}}
)

foreach ($endpoint in $endpoints) {
    $result = Test-Endpoint -Name $endpoint.Name -Url $endpoint.Url -Method $endpoint.Method -Body $endpoint.Body
    $testResults += [PSCustomObject]@{
        Endpoint = $endpoint.Name
        Status = $result.Status
        Code = $result.Code
        Time = $result.Time
    }
    
    if ($result.Status -eq "OK") {
        Write-Host "  ✅ $($endpoint.Name): $($result.Code)" -ForegroundColor Green
    } elseif ($result.Code -eq 401) {
        Write-Host "  ✅ $($endpoint.Name): Requires Auth (401) - Expected" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ $($endpoint.Name): $($result.Code)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== MONITORING ACTIVE ===" -ForegroundColor Cyan
Write-Host "Servers are being monitored. Start your manual testing now!" -ForegroundColor Yellow
Write-Host "`nPress Ctrl+C to stop monitoring and see final results.`n" -ForegroundColor Gray

# Continuous monitoring loop
$checkCount = 0
while ($true) {
    Start-Sleep -Seconds 10
    $checkCount++
    
    # Check servers every 30 seconds
    if ($checkCount % 3 -eq 0) {
        $backendStatus = Test-Server "Backend" "$backendUrl/health"
        $frontendStatus = Test-Server "Frontend" $frontendUrl
        
        $status = if ($backendStatus.Status -eq "OK" -and $frontendStatus.Status -eq "OK") { "✅" } else { "⚠️" }
        Write-Host "[$status] Check #$checkCount - Backend: $($backendStatus.Status) | Frontend: $($frontendStatus.Status)" -ForegroundColor $(if ($status -eq "✅") { "Green" } else { "Yellow" })
    }
}

