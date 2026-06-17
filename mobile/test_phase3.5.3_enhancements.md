# Phase 3.5.3: Mobile Enhancements - Testing Guide

## 📱 Manual Testing Checklist

### **1. Battery Optimization Service**

#### Test Battery Level Checking
```dart
// In your test file or debug console
import 'package:kavach/core/services/battery_optimization_service.dart';

final batteryService = BatteryOptimizationService();

// Test battery level
final batteryLevel = await batteryService.getBatteryLevel();
print('Battery Level: $batteryLevel%');

// Test battery-aware recommendations
final recommendations = await batteryService.getOptimizationRecommendations();
print('Recommendations: $recommendations');

// Test adaptive intervals
final syncInterval = await batteryService.getRecommendedSyncInterval();
final locationInterval = await batteryService.getRecommendedLocationInterval();
print('Sync Interval: $syncInterval');
print('Location Interval: $locationInterval');
```

**Expected Results:**
- ✅ Battery level is retrieved (or null if battery_plus not installed)
- ✅ Recommendations are provided based on battery level
- ✅ Intervals adjust based on battery level

---

### **2. Location Optimization Service**

#### Test Location Tracking
```dart
import 'package:kavach/core/services/location_optimization_service.dart';
import 'package:geolocator/geolocator.dart';

final locationService = LocationOptimizationService();

// Test optimized location tracking
await locationService.startLocationTracking(
  onLocationUpdate: (Position position) {
    print('Location updated: ${position.latitude}, ${position.longitude}');
  },
);

// Wait for location updates (should only update if moved 50m+)

// Test getting current position
final position = await locationService.getCurrentPosition();
print('Current Position: ${position?.latitude}, ${position?.longitude}');
```

**Expected Results:**
- ✅ Location updates only when moved 50m+
- ✅ Update frequency adapts to battery level
- ✅ Accuracy reduces when battery is low
- ✅ Cached position used when battery is critical

---

### **3. Accessibility Improvements**

#### Test Accessibility Widgets
```dart
import 'package:kavach/core/widgets/accessibility_wrapper.dart';

// Test AccessibleButton
AccessibleButton(
  label: 'Submit',
  hint: 'Tap to submit form',
  onPressed: () => print('Button pressed'),
),

// Test AccessibleIconButton
AccessibleIconButton(
  icon: Icons.home,
  label: 'Home',
  hint: 'Navigate to home screen',
  onPressed: () => print('Home pressed'),
),

// Test KeyboardNavigable
KeyboardNavigable(
  child: Text('Focusable text'),
  autofocus: true,
),

// Test Enhanced AccessibilityWrapper
AccessibilityWrapper(
  label: 'Important content',
  hint: 'This is important information',
  tooltip: 'Tap for more info',
  isButton: true,
  child: Container(/* ... */),
),
```

**Expected Results:**
- ✅ Screen reader reads labels and hints
- ✅ Keyboard navigation works
- ✅ Tooltips appear on long press
- ✅ Semantic properties correctly set

---

### **4. Offline Maps Service**

#### Test Map Caching
```dart
import 'package:kavach/features/maps/services/offline_map_service.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

final mapService = OfflineMapService();

// Test caching a map region
final cached = await mapService.cacheMapRegion(
  center: LatLng(28.6139, 77.2090), // Delhi
  radiusKm: 5.0,
  zoomLevel: 15,
);
print('Map cached: $cached');

// Test checking if region is cached
final isCached = await mapService.isMapRegionCached(
  center: LatLng(28.6139, 77.2090),
  radiusKm: 5.0,
  zoomLevel: 15,
);
print('Is cached: $isCached');

// Test caching a route
await mapService.cacheRoute(
  routeId: 'evac_route_1',
  waypoints: [
    LatLng(28.6139, 77.2090),
    LatLng(28.7041, 77.1025),
  ],
  routeName: 'Main Evacuation Route',
);

// Test getting cached routes
final routes = await mapService.getCachedRoutes();
print('Cached routes: ${routes.length}');
```

**Expected Results:**
- ✅ Map regions are cached
- ✅ Routes are stored offline
- ✅ Cached data is retrievable
- ✅ Cache size is managed

---

### **5. Enhanced Animations**

#### Test Animation Widgets
```dart
import 'package:kavach/core/widgets/enhanced_animations.dart';

// Test FadeInAnimation
FadeInAnimation(
  child: Container(/* ... */),
),

// Test SlideInAnimation
SlideInAnimation(
  beginOffset: Offset(0.0, 0.3),
  child: Container(/* ... */),
),

// Test ScaleInAnimation
ScaleInAnimation(
  child: Container(/* ... */),
),

// Test LoadingAnimation
LoadingAnimation(
  message: 'Loading...',
),

// Test SuccessAnimation
SuccessAnimation(
  message: 'Success!',
  onComplete: () => print('Animation complete'),
),

// Test ErrorAnimation
ErrorAnimation(
  message: 'Error occurred',
),

// Test PulseAnimation
PulseAnimation(
  child: Icon(Icons.notifications),
),
```

**Expected Results:**
- ✅ Animations are smooth (60fps)
- ✅ Animations complete properly
- ✅ No memory leaks
- ✅ Animations are performant

---

## 🧪 Automated Testing

### **Unit Tests**

Create test files in `mobile/test/`:

1. `test/core/services/battery_optimization_service_test.dart`
2. `test/core/services/location_optimization_service_test.dart`
3. `test/core/widgets/accessibility_wrapper_test.dart`
4. `test/features/maps/services/offline_map_service_test.dart`
5. `test/core/widgets/enhanced_animations_test.dart`

### **Integration Tests**

Test the full flow:
1. Battery optimization affects location tracking
2. Accessibility widgets work with screen readers
3. Offline maps load correctly
4. Animations don't impact performance

---

## ✅ Success Criteria

- [ ] Battery optimization reduces battery usage by 20%+
- [ ] Location tracking adapts to battery level
- [ ] All accessibility widgets work with screen readers
- [ ] Maps can be cached and loaded offline
- [ ] Animations are smooth and performant
- [ ] No memory leaks or crashes

---

## 🐛 Known Limitations

1. **Battery Service**: Requires `battery_plus` package for full functionality
2. **Offline Maps**: Requires Google Maps API key
3. **Location Service**: Requires location permissions

---

## 📝 Test Results Template

```
Date: __________
Tester: __________

### Battery Optimization
- Battery level checking: [ ] Pass [ ] Fail
- Adaptive intervals: [ ] Pass [ ] Fail
- Battery recommendations: [ ] Pass [ ] Fail

### Location Optimization
- Location tracking: [ ] Pass [ ] Fail
- Distance-based updates: [ ] Pass [ ] Fail
- Battery-aware accuracy: [ ] Pass [ ] Fail

### Accessibility
- Screen reader support: [ ] Pass [ ] Fail
- Keyboard navigation: [ ] Pass [ ] Fail
- Semantic labels: [ ] Pass [ ] Fail

### Offline Maps
- Map caching: [ ] Pass [ ] Fail
- Route caching: [ ] Pass [ ] Fail
- Cache retrieval: [ ] Pass [ ] Fail

### Animations
- FadeIn: [ ] Pass [ ] Fail
- SlideIn: [ ] Pass [ ] Fail
- ScaleIn: [ ] Pass [ ] Fail
- Loading: [ ] Pass [ ] Fail
- Success: [ ] Pass [ ] Fail
- Error: [ ] Pass [ ] Fail
- Pulse: [ ] Pass [ ] Fail

### Overall
- Performance: [ ] Excellent [ ] Good [ ] Needs Improvement
- Battery Usage: [ ] Excellent [ ] Good [ ] Needs Improvement
- Accessibility: [ ] Excellent [ ] Good [ ] Needs Improvement
```

---

## 🚀 Next Steps

After manual testing:
1. Fix any issues found
2. Run automated tests
3. Performance profiling
4. Battery usage monitoring
5. Accessibility audit

