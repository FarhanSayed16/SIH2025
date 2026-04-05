# School Blueprint & Indoor Map Integration Plan

## Overview
This document outlines a comprehensive plan for integrating indoor map/blueprint functionality into the Edusafe platform. The system will display school floor plans with exit points, safety equipment (fire extinguishers, first aid kits, emergency exits), rooms, and other critical infrastructure elements.

---

## 1. Current State Analysis

### Existing Infrastructure
- **Backend**: 
  - `School` model has `floorPlan` with `exits`, `rooms`, and `hazards` (lines 55-98 in `School.js`)
  - Geospatial indexing already configured (`2dsphere` indexes)
  - Location coordinates support (lat/lng)
  
- **Mobile App**:
  - `google_maps_flutter: ^2.5.0` installed
  - `flutter_map: ^6.1.0` installed
  - `geolocator: ^13.0.1` for location services
  - `OfflineMapService` exists for caching
  - AR navigation with waypoints already implemented
  
- **Web Dashboard**:
  - `mapbox-gl: ^3.0.0` installed
  - Admin interface for school management

### Gaps Identified
1. **Data Model**: No safety equipment (fire extinguishers, first aid kits, AEDs) in `floorPlan`
2. **Blueprint Storage**: No system for storing/uploading floor plan images/PDFs
3. **Indoor Mapping**: No coordinate system for indoor positioning (relative to blueprint)
4. **UI Components**: No map viewer screens for mobile/web
5. **APIs**: No endpoints for managing blueprint elements
6. **Image Processing**: No system for overlaying markers on blueprint images

---

## 2. Architecture Overview

### 2.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Blueprint Map System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Backend    │    │  Mobile App  │    │  Web Admin   │ │
│  │              │    │              │    │              │ │
│  │ - Data Models│◄───┤ - Map Viewer │◄───┤ - Blueprint  │ │
│  │ - APIs       │    │ - Navigation │    │   Editor     │ │
│  │ - Image Store│    │ - AR Overlay │    │ - Management │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Shared Data Layer                          │   │
│  │  - School Blueprints (images/PDFs)                   │   │
│  │  - Safety Equipment Locations                         │   │
│  │  - Exit Points & Routes                              │   │
│  │  - Room Definitions                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Coordinate System

**Two-tier coordinate system:**
1. **Geographic Coordinates** (lat/lng): For outdoor positioning and school location
2. **Blueprint Coordinates** (x, y, floor): For indoor positioning relative to blueprint image
   - Origin (0,0) = top-left corner of blueprint
   - Units: pixels or meters (configurable per blueprint)
   - Z-axis: Floor number (0 = ground floor, 1 = first floor, etc.)

---

## 3. Data Model Extensions

### 3.1 Backend Schema Updates

#### Extend `School.floorPlan` Schema

```javascript
floorPlan: {
  // Existing fields (rooms, exits, hazards)
  rooms: [...],
  exits: [...],
  hazards: [...],
  
  // NEW: Blueprint metadata
  blueprint: {
    imageUrl: String,        // URL to uploaded blueprint image
    pdfUrl: String,         // Optional PDF version
    width: Number,          // Blueprint width in pixels/meters
    height: Number,         // Blueprint height in pixels/meters
    scale: Number,          // Scale factor (e.g., 1 pixel = 0.1 meters)
    floors: [{
      floorNumber: Number,  // 0, 1, 2, etc.
      name: String,         // "Ground Floor", "First Floor"
      blueprintImageUrl: String,  // Per-floor blueprint
      width: Number,
      height: Number,
      scale: Number
    }],
    uploadedAt: Date,
    uploadedBy: ObjectId,  // User who uploaded
    lastModified: Date
  },
  
  // NEW: Safety Equipment
  safetyEquipment: [{
    id: String,             // Unique identifier
    type: {
      type: String,
      enum: ['fire-extinguisher', 'first-aid-kit', 'aed', 'emergency-exit-sign', 
             'fire-alarm', 'sprinkler', 'emergency-light', 'defibrillator', 'other']
    },
    name: String,           // "Fire Extinguisher A-1"
    location: {
      floor: Number,        // Floor number
      coordinates: {
        x: Number,         // X position on blueprint (pixels or meters)
        y: Number          // Y position on blueprint
      },
      // Optional: Geographic coordinates if known
      geoCoordinates: {
        type: { type: String, enum: ['Point'] },
        coordinates: [Number]  // [lng, lat]
      }
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'expired', 'missing'],
      default: 'active'
    },
    lastInspection: Date,
    nextInspection: Date,
    expiryDate: Date,       // For fire extinguishers
    capacity: String,        // e.g., "5kg", "10kg" for extinguishers
    description: String,
    qrCode: String,         // Optional QR code for quick access
    metadata: {
      manufacturer: String,
      model: String,
      serialNumber: String
    }
  }],
  
  // Enhanced exits with more details
  exits: [{
    // Existing fields...
    id: String,
    name: String,
    location: {
      floor: Number,
      coordinates: { x: Number, y: Number },
      geoCoordinates: { type: String, coordinates: [Number] }
    },
    type: {
      type: String,
      enum: ['main', 'emergency', 'fire', 'service', 'disabled-access']
    },
    // NEW fields
    isAccessible: { type: Boolean, default: true },
    capacity: Number,       // Max people per minute
    hasRamp: Boolean,
    hasStairs: Boolean,
    emergencyLighting: Boolean,
    width: Number,          // Exit width in meters
    direction: String,      // "north", "south", etc.
    leadsTo: String        // "Parking Lot", "Playground", etc.
  }],
  
  // Enhanced rooms
  rooms: [{
    // Existing fields...
    id: String,
    name: String,
    location: {
      floor: Number,
      coordinates: { x: Number, y: Number },
      // Room boundaries (polygon)
      bounds: [{
        x: Number,
        y: Number
      }]
    },
    // NEW fields
    roomType: {
      type: String,
      enum: ['classroom', 'laboratory', 'library', 'office', 'gym', 
             'cafeteria', 'bathroom', 'stairwell', 'elevator', 'storage', 'other']
    },
    capacity: Number,
    hasWindows: Boolean,
    hasEmergencyExit: Boolean,
    nearestExit: String,    // ID of nearest exit
    nearestFireExtinguisher: String,  // ID of nearest equipment
    floorNumber: Number
  }]
}
```

### 3.2 New Models (if needed)

#### `BlueprintVersion.js` (Optional - for versioning)
```javascript
{
  schoolId: ObjectId,
  version: Number,
  blueprintImageUrl: String,
  uploadedAt: Date,
  uploadedBy: ObjectId,
  changes: [{
    type: String,  // 'added', 'removed', 'modified'
    elementType: String,  // 'equipment', 'exit', 'room'
    elementId: String,
    timestamp: Date
  }]
}
```

---

## 4. Backend API Endpoints

### 4.1 Blueprint Management

```
POST   /api/schools/:schoolId/blueprint/upload
  - Upload blueprint image/PDF
  - Body: FormData with image file
  - Response: { blueprint: {...}, imageUrl: "..." }

GET    /api/schools/:schoolId/blueprint
  - Get current blueprint metadata

PUT    /api/schools/:schoolId/blueprint
  - Update blueprint metadata (scale, dimensions)

DELETE /api/schools/:schoolId/blueprint
  - Delete blueprint
```

### 4.2 Safety Equipment Management

```
GET    /api/schools/:schoolId/floor-plan/safety-equipment
  - Get all safety equipment
  - Query: ?floor=0&type=fire-extinguisher&status=active

POST   /api/schools/:schoolId/floor-plan/safety-equipment
  - Add new safety equipment
  - Body: { type, name, location: { floor, coordinates: {x, y} }, ... }

PUT    /api/schools/:schoolId/floor-plan/safety-equipment/:equipmentId
  - Update equipment details/location

DELETE /api/schools/:schoolId/floor-plan/safety-equipment/:equipmentId
  - Remove equipment

GET    /api/schools/:schoolId/floor-plan/safety-equipment/:equipmentId
  - Get single equipment details
```

### 4.3 Exit Points Management

```
GET    /api/schools/:schoolId/floor-plan/exits
  - Get all exit points
  - Query: ?floor=0&type=emergency

POST   /api/schools/:schoolId/floor-plan/exits
  - Add new exit point

PUT    /api/schools/:schoolId/floor-plan/exits/:exitId
  - Update exit details

DELETE /api/schools/:schoolId/floor-plan/exits/:exitId
  - Remove exit
```

### 4.4 Rooms Management

```
GET    /api/schools/:schoolId/floor-plan/rooms
  - Get all rooms
  - Query: ?floor=0&type=classroom

POST   /api/schools/:schoolId/floor-plan/rooms
  - Add new room

PUT    /api/schools/:schoolId/floor-plan/rooms/:roomId
  - Update room details

DELETE /api/schools/:schoolId/floor-plan/rooms/:roomId
  - Remove room
```

### 4.5 Map Data Aggregation

```
GET    /api/schools/:schoolId/floor-plan/map-data
  - Get complete map data for a floor
  - Query: ?floor=0
  - Response: {
      blueprint: {...},
      equipment: [...],
      exits: [...],
      rooms: [...],
      hazards: [...]
    }

GET    /api/schools/:schoolId/floor-plan/navigation
  - Get navigation route between two points
  - Query: ?fromX=100&fromY=200&toX=500&toY=300&floor=0
  - Response: { route: [{x, y}, ...], distance: 50, estimatedTime: 30 }
```

---

## 5. Frontend Implementation

### 5.1 Mobile App (Flutter)

#### New Screens

**1. Blueprint Map Viewer Screen**
- Location: `mobile/lib/features/maps/screens/blueprint_map_screen.dart`
- Features:
  - Display blueprint image as base layer
  - Overlay markers for equipment, exits, rooms
  - Zoom/pan gestures
  - Floor selector (if multi-floor)
  - Filter by equipment type
  - Tap marker for details
  - Navigation mode (show route to selected point)

**2. Safety Equipment List Screen**
- Location: `mobile/lib/features/maps/screens/safety_equipment_list_screen.dart`
- Features:
  - List all equipment with status indicators
  - Filter by type, floor, status
  - Quick access to equipment on map
  - QR code scanner for equipment lookup

**3. Blueprint Editor Screen** (Admin/Teacher)
- Location: `mobile/lib/features/maps/screens/blueprint_editor_screen.dart`
- Features:
  - Upload blueprint image
  - Tap to add equipment/exit/room
  - Drag to reposition
  - Edit properties
  - Save changes

#### New Models

**1. Safety Equipment Model**
```dart
// mobile/lib/features/maps/models/safety_equipment_model.dart
class SafetyEquipment {
  final String id;
  final String type;  // 'fire-extinguisher', 'first-aid-kit', etc.
  final String name;
  final FloorLocation location;
  final String status;
  final DateTime? lastInspection;
  final DateTime? nextInspection;
  final String? capacity;
  final String? description;
}

class FloorLocation {
  final int floor;
  final BlueprintCoordinate coordinates;
  final GeoCoordinate? geoCoordinates;
}

class BlueprintCoordinate {
  final double x;
  final double y;
}
```

**2. Blueprint Model**
```dart
// mobile/lib/features/maps/models/blueprint_model.dart
class Blueprint {
  final String imageUrl;
  final String? pdfUrl;
  final double width;
  final double height;
  final double scale;
  final List<Floor> floors;
  final DateTime uploadedAt;
}
```

#### New Services

**1. Blueprint Service**
```dart
// mobile/lib/features/maps/services/blueprint_service.dart
class BlueprintService {
  Future<Blueprint> getBlueprint(String schoolId);
  Future<String> uploadBlueprint(String schoolId, File imageFile);
  Future<List<SafetyEquipment>> getSafetyEquipment(String schoolId, {int? floor});
  Future<SafetyEquipment> addSafetyEquipment(String schoolId, SafetyEquipment equipment);
  Future<NavigationRoute> getNavigationRoute(String schoolId, BlueprintCoordinate from, BlueprintCoordinate to, int floor);
}
```

**2. Map Rendering Service**
```dart
// mobile/lib/features/maps/services/map_rendering_service.dart
class MapRenderingService {
  Widget buildBlueprintMap({
    required Blueprint blueprint,
    required List<SafetyEquipment> equipment,
    required List<ExitPoint> exits,
    required List<Room> rooms,
    int currentFloor = 0,
    BlueprintCoordinate? userLocation,
    NavigationRoute? activeRoute,
  });
  
  Widget buildMarker({
    required BlueprintCoordinate position,
    required MarkerType type,
    required VoidCallback onTap,
  });
}
```

#### UI Components

**1. Blueprint Map Widget**
- Custom painter for blueprint image
- Marker overlay system
- Gesture detection (tap, pan, zoom)
- Floor selector dropdown

**2. Equipment Marker Widget**
- Icon based on type
- Status indicator (color-coded)
- Tap to show details bottom sheet

**3. Exit Marker Widget**
- Icon based on exit type
- Direction indicator
- Capacity indicator

### 5.2 Web Dashboard (Next.js)

#### New Pages

**1. Blueprint Management Page**
- Route: `/admin/schools/[schoolId]/blueprint`
- Features:
  - Upload blueprint image
  - Set scale/dimensions
  - Multi-floor support
  - Version history

**2. Floor Plan Editor Page**
- Route: `/admin/schools/[schoolId]/floor-plan`
- Features:
  - Interactive blueprint editor
  - Drag-and-drop markers
  - Add/edit equipment, exits, rooms
  - Bulk import from CSV
  - Export floor plan data

**3. Map Viewer Page**
- Route: `/admin/schools/[schoolId]/map`
- Features:
  - View-only map with all elements
  - Filter/search
  - Print blueprint with markers
  - Generate reports

#### New Components

**1. Blueprint Editor Component**
- Mapbox GL JS for rendering
- Marker placement tool
- Property editor sidebar
- Save/cancel actions

**2. Equipment Management Table**
- CRUD operations
- Status filters
- Inspection reminders
- Bulk actions

**3. Floor Plan Visualization**
- Interactive map with markers
- Layer toggles (equipment, exits, rooms)
- Search functionality

---

## 6. Image Storage & Processing

### 6.1 Storage Strategy

**Option 1: Cloud Storage (Recommended)**
- Use AWS S3 / Google Cloud Storage / Azure Blob
- Store blueprint images with school ID prefix
- Generate thumbnails for mobile
- CDN for fast delivery

**Option 2: Local Storage (Development)**
- Store in `backend/uploads/blueprints/`
- Serve via Express static middleware
- Not recommended for production

### 6.2 Image Processing

**Backend Service: `blueprint-processing.service.js`**
```javascript
class BlueprintProcessingService {
  async processUploadedImage(file) {
    // 1. Validate image format (PNG, JPG, PDF)
    // 2. Resize if too large (max 10MB)
    // 3. Generate thumbnail (500x500)
    // 4. Extract dimensions
    // 5. Store original + thumbnail
    // 6. Return URLs
  }
  
  async generateMarkerOverlay(blueprintUrl, markers) {
    // Optional: Generate image with markers baked in
    // For offline use or printing
  }
}
```

---

## 7. Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Backend:**
- [ ] Extend `School` model with safety equipment schema
- [ ] Create API endpoints for blueprint upload
- [ ] Create API endpoints for equipment CRUD
- [ ] Set up image storage (local or cloud)
- [ ] Add image processing service

**Frontend (Web):**
- [ ] Create blueprint upload page
- [ ] Create basic floor plan editor
- [ ] Add equipment management table

**Testing:**
- [ ] Test blueprint upload
- [ ] Test equipment CRUD via API
- [ ] Verify image storage/retrieval

### Phase 2: Mobile Map Viewer (Week 3-4)
**Mobile:**
- [ ] Create `BlueprintMapScreen`
- [ ] Implement image loading and display
- [ ] Add marker rendering system
- [ ] Implement zoom/pan gestures
- [ ] Add floor selector
- [ ] Create equipment detail bottom sheet

**Backend:**
- [ ] Create aggregated map data endpoint
- [ ] Optimize image delivery (thumbnails)

**Testing:**
- [ ] Test map loading on mobile
- [ ] Test marker display
- [ ] Test interactions

### Phase 3: Equipment Management (Week 5-6)
**Mobile:**
- [ ] Create equipment list screen
- [ ] Add QR code scanning for equipment
- [ ] Implement equipment filtering
- [ ] Add inspection reminders

**Web:**
- [ ] Enhance floor plan editor
- [ ] Add bulk import/export
- [ ] Add inspection scheduling

**Backend:**
- [ ] Add equipment status tracking
- [ ] Add inspection reminder system
- [ ] Add QR code generation

### Phase 4: Navigation & Routes (Week 7-8)
**Backend:**
- [ ] Implement pathfinding algorithm
- [ ] Create navigation route endpoint
- [ ] Add route optimization

**Mobile:**
- [ ] Add navigation mode to map
- [ ] Display route overlay
- [ ] Add turn-by-turn directions
- [ ] Integrate with AR navigation (existing)

**Testing:**
- [ ] Test route calculation
- [ ] Test navigation display
- [ ] Test AR integration

### Phase 5: Advanced Features (Week 9-10)
**All Platforms:**
- [ ] Multi-floor support
- [ ] Offline map caching
- [ ] Real-time updates (WebSocket)
- [ ] Analytics (equipment usage, exit usage)
- [ ] Export/print functionality
- [ ] Version history

---

## 8. Technical Requirements

### 8.1 Dependencies

**Backend:**
```json
{
  "multer": "^1.4.5",           // File uploads
  "sharp": "^0.33.0",            // Image processing
  "qrcode": "^1.5.3"             // QR code generation
}
```

**Mobile (Flutter):**
```yaml
dependencies:
  google_maps_flutter: ^2.5.0    # Already installed
  flutter_map: ^6.1.0            # Already installed
  image: ^4.1.0                   # Image manipulation
  cached_network_image: ^3.3.0    # Already installed
  interactive_viewer: ^1.1.0     # Zoom/pan gestures
  qr_code_scanner: ^1.0.0        # QR scanning
```

**Web (Next.js):**
```json
{
  "mapbox-gl": "^3.0.0",         // Already installed
  "react-map-gl": "^7.1.0",       // React wrapper for Mapbox
  "multer": "^1.4.5",             // File uploads (if using API routes)
  "sharp": "^0.33.0"              // Image processing
}
```

### 8.2 Permissions

**Mobile:**
- Camera (for QR scanning)
- Storage (for offline caching)
- Location (optional, for geo-coordinates)

**Web:**
- File upload permissions
- Image processing capabilities

### 8.3 Performance Considerations

1. **Image Optimization:**
   - Compress blueprint images before storage
   - Generate multiple sizes (thumbnail, medium, full)
   - Use WebP format for better compression

2. **Caching:**
   - Cache blueprint images on mobile
   - Cache map data responses
   - Use CDN for image delivery

3. **Lazy Loading:**
   - Load markers only for visible area
   - Load floor data on-demand
   - Paginate equipment lists

4. **Offline Support:**
   - Cache blueprint images
   - Cache equipment/exits/rooms data
   - Sync changes when online

---

## 9. User Stories

### As a School Admin:
- I want to upload a blueprint image so that I can create a digital floor plan
- I want to mark fire extinguisher locations so that students can find them during emergencies
- I want to mark all exit points so that evacuation routes are clear
- I want to edit equipment locations so that the map stays accurate
- I want to see equipment inspection status so that I can schedule maintenance

### As a Teacher:
- I want to view the school blueprint on my phone so that I can navigate during drills
- I want to see the nearest fire extinguisher so that I can access it quickly
- I want to see exit routes so that I can guide students during emergencies
- I want to scan QR codes on equipment to see details

### As a Student:
- I want to see the school map on my phone so that I know where exits are
- I want to find the nearest fire extinguisher so that I can help in emergencies
- I want to see my current location on the map (if indoor positioning available)

---

## 10. Security & Privacy

1. **Access Control:**
   - Only admins can upload/edit blueprints
   - Teachers can view and use maps
   - Students can view maps (read-only)

2. **Data Validation:**
   - Validate image file types and sizes
   - Sanitize coordinate inputs
   - Validate equipment data

3. **Image Security:**
   - Store images in secure storage
   - Use signed URLs for temporary access
   - Watermark blueprints if needed

---

## 11. Future Enhancements

1. **Indoor Positioning:**
   - Bluetooth beacons for indoor location
   - Wi-Fi fingerprinting
   - Integration with AR for visual positioning

2. **Real-time Updates:**
   - WebSocket for live equipment status
   - Real-time hazard alerts on map
   - Live evacuation route updates

3. **Analytics:**
   - Track equipment usage
   - Analyze exit usage during drills
   - Generate heat maps

4. **Integration:**
   - Link with drill system (show drill routes)
   - Link with hazard reporting (show hazards on map)
   - Link with IoT sensors (show sensor locations)

5. **Accessibility:**
   - Voice navigation
   - High contrast mode
   - Screen reader support

---

## 12. Success Metrics

1. **Adoption:**
   - % of schools with blueprints uploaded
   - % of equipment marked on maps
   - Average equipment coverage per school

2. **Usage:**
   - Map views per month
   - Equipment lookups per month
   - Navigation route requests

3. **Accuracy:**
   - Equipment location accuracy
   - Exit point completeness
   - Blueprint update frequency

---

## 13. Risk Mitigation

1. **Image Storage Costs:**
   - Implement image compression
   - Set storage quotas
   - Use CDN caching

2. **Performance Issues:**
   - Optimize image sizes
   - Implement lazy loading
   - Use pagination for large datasets

3. **Data Accuracy:**
   - Regular audits of equipment locations
   - Version control for blueprints
   - User feedback mechanism

---

## 14. Documentation Requirements

1. **API Documentation:**
   - Swagger/OpenAPI specs for all endpoints
   - Request/response examples
   - Error handling guide

2. **User Guides:**
   - How to upload blueprints (admin)
   - How to add equipment (admin)
   - How to use map viewer (teachers/students)

3. **Developer Documentation:**
   - Architecture overview
   - Coordinate system explanation
   - Integration guide

---

## Conclusion

This plan provides a comprehensive roadmap for implementing indoor map/blueprint functionality in the Edusafe platform. The phased approach allows for incremental development and testing, ensuring a robust and user-friendly system.

**Next Steps:**
1. Review and approve this plan
2. Set up development environment (image storage, dependencies)
3. Begin Phase 1 implementation
4. Regular progress reviews and adjustments

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-08  
**Author:** Edusafe Development Team

