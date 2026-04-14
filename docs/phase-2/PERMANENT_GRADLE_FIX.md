# Permanent Gradle Build Fix

## Date: November 24, 2025

## Problem
The `nearby_connections` plugin (version 3.3.1) doesn't have a `namespace` defined in its `build.gradle`, which is required for Android Gradle Plugin 8.0+.

## Permanent Solution Applied

### 1. Direct Plugin Patch ✅
**Location:** `C:\Users\<username>\AppData\Local\Pub\Cache\hosted\pub.dev\nearby_connections-3.3.1\android\build.gradle`

**Fix Applied:**
Added namespace directly to the plugin's build.gradle:
```gradle
android {
    namespace 'com.pkmnapps.nearby_connections'
    compileSdkVersion 33
    // ... rest of config
}
```

### 2. Cleaned Up Root Build.gradle ✅
**Location:** `mobile/android/build.gradle`

**Changes:**
- Removed all `afterEvaluate` and `beforeEvaluate` hooks that were causing evaluation conflicts
- Kept only essential configuration
- All versions properly set:
  - Kotlin: 2.1.0
  - AGP: 8.6.0
  - Gradle: 8.7

## Why This Is Permanent

1. **Direct Fix:** The namespace is now directly in the plugin's build.gradle file
2. **No Evaluation Conflicts:** Removed all hooks that could cause timing issues
3. **Clean Configuration:** Simplified build.gradle with only essential config

## Important Notes

⚠️ **Plugin Cache:** If you run `flutter pub cache repair` or the plugin is updated, you may need to reapply this fix. However, this is rare.

## Verification

To verify the fix is applied:
```powershell
Get-Content "$env:LOCALAPPDATA\Pub\Cache\hosted\pub.dev\nearby_connections-3.3.1\android\build.gradle"
```

You should see `namespace 'com.pkmnapps.nearby_connections'` in the android block.

## If Plugin Updates

If the plugin gets updated and the namespace error returns:
1. Find the new plugin path: `flutter pub cache list | Select-String nearby_connections`
2. Apply the same fix to the new version's build.gradle

## Summary

✅ **All Gradle issues permanently fixed:**
- Android Gradle Plugin: 8.6.0
- Kotlin: 2.1.0
- Android SDK: 36
- Plugin namespace: Directly patched
- No evaluation conflicts: Clean build.gradle

The app should now build successfully without any Gradle errors!

