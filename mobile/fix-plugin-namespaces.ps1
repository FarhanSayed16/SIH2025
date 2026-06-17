# Script to fix namespace issues for Flutter plugins
# This fixes plugins that don't have namespace defined (required for AGP 8.0+)

Write-Host "🔧 Fixing plugin namespaces..." -ForegroundColor Cyan

$pubCache = "$env:LOCALAPPDATA\Pub\Cache\hosted\pub.dev"
$pluginsToFix = @()

# Find all plugins that might need fixing
$pluginDirs = Get-ChildItem -Path $pubCache -Directory -ErrorAction SilentlyContinue

foreach ($pluginDir in $pluginDirs) {
    $buildGradle = Join-Path $pluginDir.FullName "android\build.gradle"
    
    if (Test-Path $buildGradle) {
        $content = Get-Content $buildGradle -Raw -ErrorAction SilentlyContinue
        
        if ($content -and $content -match "apply plugin: 'com.android.library'" -and $content -notmatch "namespace\s+['\`"]") {
            # Try to get package name from AndroidManifest
            $manifestPath = Join-Path $pluginDir.FullName "android\src\main\AndroidManifest.xml"
            $packageName = $null
            
            if (Test-Path $manifestPath) {
                $manifest = Get-Content $manifestPath -Raw
                if ($manifest -match 'package=["\']([^"\']+)["\']') {
                    $packageName = $matches[1]
                }
            }
            
            # If no package found, use plugin name
            if (-not $packageName) {
                $packageName = $pluginDir.Name -replace '-', '_' -replace '\.', '_'
                $packageName = "com.kavach.app.plugins.$packageName"
            }
            
            # Add namespace to build.gradle
            $replacement = "apply plugin: 'com.android.library'`n`nandroid {`n    namespace '$packageName'`n}"
            $newContent = $content -replace "apply plugin: 'com.android.library'", $replacement
            
            try {
                Set-Content -Path $buildGradle -Value $newContent -NoNewline -ErrorAction Stop
                Write-Host "✅ Fixed: $($pluginDir.Name) - namespace: $packageName" -ForegroundColor Green
                $pluginsToFix += $pluginDir.Name
            } catch {
                Write-Host "❌ Failed to fix: $($pluginDir.Name) - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

if ($pluginsToFix.Count -eq 0) {
    Write-Host "`n✅ All plugins already have namespace defined!" -ForegroundColor Green
} else {
    Write-Host "`n✅ Fixed $($pluginsToFix.Count) plugin(s):" -ForegroundColor Green
    $pluginsToFix | ForEach-Object { Write-Host "   - $_" }
}

Write-Host "`n🎉 Done! Try building your app now." -ForegroundColor Cyan

