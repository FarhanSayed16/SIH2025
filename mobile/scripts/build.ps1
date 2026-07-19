# Build script for Kavach Mobile App (PowerShell)

param(
    [string]$BuildType = "debug"
)

Write-Host "🚀 Building Kavach Mobile App..." -ForegroundColor Green

# Navigate to mobile directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$mobilePath = Join-Path $scriptPath ".."
Set-Location $mobilePath

# Check Flutter installation
try {
    $flutterVersion = flutter --version 2>&1 | Select-Object -First 1
    Write-Host "📱 Flutter Version: $flutterVersion" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Flutter is not installed. Please install Flutter first." -ForegroundColor Red
    exit 1
}

# Clean previous builds
Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
flutter clean

# Get dependencies
Write-Host "📦 Getting dependencies..." -ForegroundColor Yellow
flutter pub get

# Analyze code
Write-Host "🔍 Analyzing code..." -ForegroundColor Yellow
flutter analyze

# Run tests
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
flutter test

# Build based on type
if ($BuildType -eq "release") {
    Write-Host "📱 Building Release APK..." -ForegroundColor Cyan
    flutter build apk --release
    Write-Host "✅ Release APK built successfully!" -ForegroundColor Green
    Write-Host "📁 Location: build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Cyan
} elseif ($BuildType -eq "bundle") {
    Write-Host "📱 Building App Bundle..." -ForegroundColor Cyan
    flutter build appbundle --release
    Write-Host "✅ App Bundle built successfully!" -ForegroundColor Green
    Write-Host "📁 Location: build/app/outputs/bundle/release/app-release.aab" -ForegroundColor Cyan
} else {
    Write-Host "📱 Building Debug APK..." -ForegroundColor Cyan
    flutter build apk --debug
    Write-Host "✅ Debug APK built successfully!" -ForegroundColor Green
    Write-Host "📁 Location: build/app/outputs/flutter-apk/app-debug.apk" -ForegroundColor Cyan
}

Write-Host "🎉 Build complete!" -ForegroundColor Green

