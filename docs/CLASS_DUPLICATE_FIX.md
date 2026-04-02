# Class Duplicate Issue Fix

## Problem Identified

**Issue:** Admin gets "Class with this grade and section already exists" error when creating a class, but the list shows "No classes found".

**Root Cause:**
1. Unique index on `{ institutionId, grade, section }` blocks ALL classes (active and inactive)
2. Create endpoint relies on MongoDB unique index error (no explicit check)
3. List endpoint does NOT filter by `isActive: true` by default
4. Result: Inactive classes block creation but may not appear in list (or appear inconsistently)

## Solution Implemented

### 1. Updated Create Class Logic
**File:** `backend/src/controllers/class.controller.js`

**Changes:**
- Added explicit duplicate check **before** create
- Only checks for **active** classes: `isActive: true`
- Provides better error messages
- Handles inactive class conflicts gracefully

**New Duplicate Check:**
```javascript
const existingActiveClass = await Class.findOne({
  institutionId,
  grade,
  section,
  isActive: true // Only check active classes
});
```

### 2. Updated List Classes Logic
**File:** `backend/src/controllers/class.controller.js`

**Changes:**
- Added `isActive: true` filter by default
- Added optional `includeInactive=true` query parameter for admin management
- Aligns with duplicate check logic

**New List Query:**
```javascript
if (includeInactive !== 'true') {
  query.isActive = true;
}
```

### 3. Unique Index (Unchanged)
**File:** `backend/src/models/Class.js`

**Current Index:**
```javascript
classSchema.index({ institutionId: 1, grade: 1, section: 1 }, { unique: true });
```

**Note:** This index remains as-is because:
- It prevents database-level duplicates
- The application-level check now handles active/inactive distinction
- Inactive classes can exist without blocking new active classes

## Final State

### Duplicate Check Query
```javascript
{
  institutionId: <provided>,
  grade: <provided>,
  section: <provided>,
  isActive: true  // Only active classes
}
```

### List Classes Query (Default)
```javascript
{
  isActive: true,  // Only active classes
  institutionId: <optional filter>,
  teacherId: <optional filter>,
  grade: <optional filter>,
  section: <optional filter>
}
```

### Unique Index
```javascript
{ institutionId: 1, grade: 1, section: 1 }  // Unique across all classes (active + inactive)
```

## Handling Old/Inactive Classes

If you have old test classes blocking creation:

### Option 1: Archive Inactive Classes (Recommended)
```javascript
// MongoDB shell command (run manually, not auto-executed)
// This marks old classes as inactive so they don't block new ones

db.classes.updateMany(
  {
    institutionId: ObjectId("YOUR_INSTITUTION_ID"),
    grade: "1",
    section: "A",
    isActive: { $ne: false }  // Find classes that aren't explicitly inactive
  },
  {
    $set: { isActive: false }
  }
);
```

### Option 2: Delete Old Test Classes (Use with Caution)
```javascript
// MongoDB shell command (run manually, not auto-executed)
// ONLY use if you're sure these are test classes with no real data

db.classes.deleteMany({
  institutionId: ObjectId("YOUR_INSTITUTION_ID"),
  grade: "1",
  section: "A",
  isActive: false,
  studentIds: { $size: 0 }  // Only delete if no students
});
```

### Option 3: Reactivate Existing Class
If you want to use an existing inactive class instead of creating a new one:
- Use the Admin Dashboard to find the class
- Update it to set `isActive: true`
- Or use: `PUT /api/admin/classes/:id` with `{ isActive: true }`

## Testing

1. **Create New Class:**
   - Should succeed if no active class exists for that institution/grade/section
   - Should fail with clear message if active class exists

2. **List Classes:**
   - Should show only active classes by default
   - Should show all classes if `includeInactive=true` query param is used

3. **Inactive Classes:**
   - Should NOT block creation of new active classes
   - Should NOT appear in default list
   - Should appear if `includeInactive=true` is used

## Files Changed

1. `backend/src/controllers/class.controller.js`
   - `createClass`: Added explicit active-class duplicate check
   - `listClasses`: Added `isActive: true` filter by default

2. `docs/CLASS_DUPLICATE_FIX.md` (this file)
   - Documentation of the fix

## Future Enhancements (Optional)

If you want to support multiple academic years:

1. Add `academicYear` field to Class model
2. Update unique index to include `academicYear`:
   ```javascript
   classSchema.index({ institutionId: 1, grade: 1, section: 1, academicYear: 1 }, { unique: true });
   ```
3. Update duplicate check to include current academic year
4. Update list query to filter by current academic year by default

For now, the current fix allows you to:
- Create multiple classes per institution (1-A, 1-B, 2-A, etc.)
- See them in the admin list
- Handle inactive classes gracefully

