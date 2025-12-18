# UserType Migration Guide

## Problem

Users who have email and password are incorrectly marked as `roster_record` due to old grade-based logic. These users cannot login even though they have credentials.

## Solution

Run the migration script to fix existing users:

```bash
cd backend
node scripts/fix_user_types.js
```

## What the Script Does

1. Finds all users with:
   - `userType = 'roster_record'`
   - `email` exists and is not null
   - `password` exists and is not null

2. Updates them to:
   - `userType = 'account_user'`
   - `approvalStatus = 'approved'` (since they've been using the system)

## Manual MongoDB Command (Alternative)

If you prefer to run directly in MongoDB shell:

```javascript
// Connect to your database
use kavach;

// Update users with credentials from roster_record to account_user
db.users.updateMany(
  {
    userType: 'roster_record',
    email: { $exists: true, $ne: null },
    password: { $exists: true, $ne: null }
  },
  {
    $set: {
      userType: 'account_user',
      approvalStatus: 'approved'
    }
  }
);

// Verify the update
db.users.countDocuments({
  userType: 'roster_record',
  email: { $exists: true, $ne: null },
  password: { $exists: true, $ne: null }
});
// Should return 0 after migration
```

## Important Notes

- This migration is **one-time only** and should not run automatically
- It only fixes users who have both email AND password
- Users without credentials remain as `roster_record` (correct behavior)
- After migration, affected users will be able to login

## Verification

After running the migration, verify:

1. Users with credentials can now login
2. Users without credentials remain `roster_record` (cannot login)
3. New registrations create `account_user` correctly

