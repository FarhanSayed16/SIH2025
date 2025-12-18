# Phone Index Migration Guide

## Problem
The `phone` field in the User model had `default: null`, which caused duplicate key errors with the sparse unique index when multiple users had `phone: null`.

## Solution
1. Removed `default: null` from the phone field definition
2. Only set phone field if a value is provided (don't set to null)
3. Keep the sparse unique index: `{ phone: 1 }, { unique: true, sparse: true }`

## Migration Steps (if needed)

If you have existing users with `phone: null` in the database, run this in MongoDB shell:

```javascript
// Drop the existing index
db.users.dropIndex("phone_1");

// Recreate the sparse unique index
db.users.createIndex(
  { phone: 1 },
  { unique: true, sparse: true }
);

// Optional: Remove null phone values from existing documents
// (Only if you want to clean up existing data)
db.users.updateMany(
  { phone: null },
  { $unset: { phone: "" } }
);
```

## Notes
- The sparse index only indexes documents where the phone field exists
- Multiple documents can have the phone field absent (not indexed)
- Only one document can have a specific phone value (unique constraint)
- This prevents duplicate key errors while maintaining phone uniqueness

