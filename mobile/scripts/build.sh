#!/bin/bash

# Build script for Kavach Mobile App

set -e

echo "🚀 Building Kavach Mobile App..."

# Navigate to mobile directory
cd "$(dirname "$0")/.." || exit

# Check Flutter installation
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter is not installed. Please install Flutter first."
    exit 1
fi

# Get Flutter version
FLUTTER_VERSION=$(flutter --version | head -n 1)
echo "📱 Flutter Version: $FLUTTER_VERSION"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
flutter clean

# Get dependencies
echo "📦 Getting dependencies..."
flutter pub get

# Analyze code
echo "🔍 Analyzing code..."
flutter analyze

# Run tests
echo "🧪 Running tests..."
flutter test

# Build type
BUILD_TYPE=${1:-debug}

if [ "$BUILD_TYPE" = "release" ]; then
    echo "📱 Building Release APK..."
    flutter build apk --release
    echo "✅ Release APK built successfully!"
    echo "📁 Location: build/app/outputs/flutter-apk/app-release.apk"
elif [ "$BUILD_TYPE" = "bundle" ]; then
    echo "📱 Building App Bundle..."
    flutter build appbundle --release
    echo "✅ App Bundle built successfully!"
    echo "📁 Location: build/app/outputs/bundle/release/app-release.aab"
else
    echo "📱 Building Debug APK..."
    flutter build apk --debug
    echo "✅ Debug APK built successfully!"
    echo "📁 Location: build/app/outputs/flutter-apk/app-debug.apk"
fi

echo "🎉 Build complete!"

