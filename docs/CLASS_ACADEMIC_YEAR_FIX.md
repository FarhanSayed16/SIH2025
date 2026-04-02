# Class Management - Academic Year Support & Duplicate Fix

## Problem Summary

The Admin Dashboard was showing "Class with this grade and section already exists" error when creating classes, but the class list showed "No classes found". This inconsistency was caused by:

1. **Unique index too strict**: The unique index on `{ institutionId, grade, section }` didn't account for academic years, preventing the same class from existing in different years.
2. **List endpoint filtering**: The list endpoint was filtering by `isActive: true` by default, hiding inactive classes that were blocking creation.
3. **Duplicate check mismatch**: The duplicate check didn't align with the list query filters.

## Solution Implemented

### Step 1: Added Academic Year Support to Class Model

**File**: `backend/src/models/Class.js`

- Added `academicYear` field to the schema with automatic default (e.g., "2024-2025")
- Updated unique index to include `academicYear`: `{ institutionId: 1, grade: 1, section: 1, academicYear: 1 }`
- This allows the same grade/section to exist in different academic years

**Academic Year Logic**:
- Academic year starts in June/July (month >= 6)
- Format: `YYYY-YYYY` (e.g., "2024-2025")
- Defaults to current academic year if not provided

### Step 2: Updated Duplicate Check Logic

**File**: `backend/src/controllers/class.controller.js`

- Modified `createClass` to check for duplicates using `academicYear`
- Query: `Class.findOne({ institutionId, grade, section, academicYear })`
- Removed the complex inactive class handling logic (no longer needed)

### Step 3: Updated List Endpoint to Show All Classes

**File**: `backend/src/controllers/class.controller.js` - `listClasses`

- **Changed behavior**: Now shows ALL classes by default (active and inactive)
- Teachers still only see active classes (for their workflow)
- Admins can see all classes to manage "invisible" classes
- Added `includeInactive` query parameter for explicit filtering
- Added `academicYear` query parameter for filtering by year

### Step 4: Fixed Frontend Error Handling

**File**: `web/app/admin/classes/page.tsx`

- Improved error message extraction from `error.response?.data?.message`
- Ensured `loadClasses()` is called immediately after successful creation
- Added better logging for debugging

**File**: `web/lib/api/classes.ts`

- Added `academicYear` and `includeInactive` to `CreateClassRequest` and `list()` filters

### Step 5: Created Cleanup Endpoint

**File**: `backend/src/controllers/class.controller.js` - `cleanupClasses`
**File**: `backend/src/routes/admin.routes.js`

- Added `DELETE /api/admin/classes/cleanup` endpoint
- Requires explicit confirmation: `confirm: "DELETE_ALL_CLASSES"`
- Deletes all classes for a given `institutionId`
- **WARNING**: Destructive operation - use only for testing/demo cleanup

## Database Migration Required

### Drop Old Index and Create New One

Run this in MongoDB shell:

```javascript
// Connect to your database
use kavach;

// Drop the old unique index
db.classes.dropIndex("institutionId_1_grade_1_section_1");

// Create the new unique index with academicYear
db.classes.createIndex(
  { institutionId: 1, grade: 1, section: 1, academicYear: 1 },
  { unique: true, name: "institutionId_1_grade_1_section_1_academicYear_1" }
);

// Optional: Add academicYear to existing classes without it
// This sets all existing classes to the current academic year
db.classes.updateMany(
  { academicYear: { $exists: false } },
  { $set: { academicYear: "2024-2025" } } // Update with your current academic year
);
```

## API Changes

### Create Class
**POST** `/api/admin/classes`

**New Optional Field**:
```json
{
  "academicYear": "2024-2025"  // Optional - defaults to current academic year
}
```

### List Classes
**GET** `/api/admin/classes`

**New Query Parameters**:
- `academicYear` (optional): Filter by academic year
- `includeInactive` (optional): `"true"` or `"false"` - defaults to showing all classes

### Cleanup Classes
**DELETE** `/api/admin/classes/cleanup`

**Request Body**:
```json
{
  "institutionId": "507f1d77e1f86e20894e4f42",
  "confirm": "DELETE_ALL_CLASSES"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": 5,
    "institutionId": "507f1d77e1f86e20894e4f42"
  },
  "message": "Successfully deleted 5 class(es) for this institution"
}
```

## Testing Checklist

- [ ] Run MongoDB migration script to update indexes
- [ ] Create a new class (Grade 1, Section A) - should succeed
- [ ] Verify class appears in the list immediately
- [ ] Try to create duplicate (same grade/section/year) - should show error
- [ ] Create same grade/section for different academic year - should succeed
- [ ] Verify cleanup endpoint works (with proper confirmation)
- [ ] Test teacher view (should only see active classes)

## Files Changed

### Backend
1. `backend/src/models/Class.js` - Added `academicYear` field and updated unique index
2. `backend/src/controllers/class.controller.js` - Updated `createClass`, `listClasses`, added `cleanupClasses`
3. `backend/src/routes/admin.routes.js` - Added `academicYear` validation, cleanup route

### Frontend
1. `web/app/admin/classes/page.tsx` - Improved error handling and list refresh
2. `web/lib/api/classes.ts` - Added `academicYear` and `includeInactive` support
3. `web/lib/api/client.ts` - Updated `delete()` method to support request body

## Notes

- The `academicYear` field is optional for backward compatibility
- Existing classes without `academicYear` will get a default value on next save
- The cleanup endpoint is a one-time use tool for testing - remove or restrict in production
- Teachers continue to see only active classes (unchanged behavior)

