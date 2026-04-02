# Class Duplicate Index Investigation
**Date:** 2025-12-01  
**Status:** 🔍 **INVESTIGATING**

---

## 🔍 FINDINGS

### Database State
- **Total classes in DB:** 4
- **Classes for institution `6924de10a721bc018818253c`:** 1 (Grade 10-A)
- **No Grade 1 or Grade 2 classes exist**

### Error Behavior
- User tries to create Grade 1-A → Gets "already exists" error
- User tries to create Grade 2-A → Gets "already exists" error
- But queries show these classes **DO NOT EXIST**

### Root Cause Hypothesis
**MongoDB unique index is preventing creation, but:**
1. The class doesn't exist in the collection
2. Our queries can't find it
3. But MongoDB thinks it violates the unique constraint

**Possible causes:**
1. **Ghost index entry:** Index has stale entry that doesn't match actual data
2. **Index corruption:** Unique index is corrupted
3. **Race condition:** Class was created and deleted, but index wasn't updated
4. **Index definition mismatch:** Index is checking different fields than we're querying

---

## 🔧 SOLUTION APPROACH

### Option 1: Rebuild Unique Index (Recommended)
Drop and recreate the unique index to clear any ghost entries.

### Option 2: Check for Hidden/Deleted Classes
Query for classes that might be marked as deleted or inactive.

### Option 3: Use MongoDB's `findOneAndUpdate` with `upsert`
Instead of `create`, use `findOneAndUpdate` with `upsert: true` to handle duplicates gracefully.

### Option 4: Check Index Definition
Verify the unique index is correctly defined and matches our query pattern.

---

## 📋 IMMEDIATE FIX PLAN

1. **Check for inactive/deleted classes**
2. **Rebuild unique index** (if needed)
3. **Use `findOneAndUpdate` with upsert** instead of `create`
4. **Add better error handling** for E11000 when class doesn't exist

---

**Next Step:** Implement Option 3 (findOneAndUpdate with upsert) as it's the most robust solution.

