# Infinite API Call Loop Fix

## 🐛 Problem

The crisis dashboard was making hundreds of API calls per second to:
- `GET /api/alerts/:id/status`
- `GET /api/alerts/:id/summary`

This was causing:
- Browser performance issues
- Server overload
- Console spam with `[API] Success` messages
- Network congestion

## 🔍 Root Cause

The infinite loop was caused by a **React `useEffect` dependency issue**:

1. **`useEffect` dependency array included `user` and `router`** - These objects can change reference on every render
2. **`refreshStatusCounts` was recreated on every render** - Because it depended on `user?.institutionId`
3. **State updates triggered re-renders** - `setStatusCounts()` caused component to re-render
4. **Re-render triggered `useEffect` again** - Because dependencies changed
5. **New intervals created** - Each effect run created new intervals without clearing old ones
6. **Loop continues infinitely** - Hundreds of API calls per second

### The Loop:
```
useEffect runs → Creates interval → Calls refreshStatusCounts() 
→ Updates state → Component re-renders → user/refreshStatusCounts changes 
→ useEffect runs again → Creates NEW interval → Loop continues...
```

## ✅ Fix Applied

### 1. **Stabilized `refreshStatusCounts` with useRef Pattern**
```typescript
// Before: Function recreated on every render
const refreshStatusCounts = useCallback(async () => {
  // ...
}, [user?.institutionId, getInstitutionId]); // ❌ Changes frequently

// After: Stable function reference via ref
const refreshStatusCountsRef = useRef<() => Promise<void>>();
refreshStatusCountsRef.current = useCallback(async () => {
  // ... actual implementation
}, [user?.institutionId, getInstitutionId]);

const refreshStatusCounts = useCallback(async () => {
  if (refreshStatusCountsRef.current) {
    await refreshStatusCountsRef.current();
  }
}, []); // ✅ Empty deps - never changes
```

### 2. **Fixed `useEffect` Dependency Array**
```typescript
// Before: Included user, router, refreshStatusCounts
}, [isAuthenticated, user, accessToken, router, refreshStatusCounts]); // ❌

// After: Only essential dependencies
}, [isAuthenticated, accessToken]); // ✅ Stable dependencies only
```

### 3. **Added Concurrent Call Prevention**
```typescript
const isRefreshingRef = useRef(false);

const refreshStatusCounts = useCallback(async () => {
  if (isRefreshingRef.current) {
    return; // ✅ Skip if already refreshing
  }
  isRefreshingRef.current = true;
  // ... API calls
  isRefreshingRef.current = false;
}, []);
```

### 4. **Reduced Refresh Frequency**
```typescript
// Before: Every 2 seconds
setInterval(() => {
  refreshStatusCounts();
}, 2000); // ❌ Too frequent

// After: Every 5 seconds
setInterval(() => {
  refreshStatusCounts();
}, 5000); // ✅ Reduced load
```

### 5. **Proper Cleanup**
```typescript
return () => {
  clearInterval(statusRefreshInterval);
  clearInterval(mlRefreshInterval);
  socketService.disconnect();
};
```

## 📊 Results

### Before:
- ❌ Hundreds of API calls per second
- ❌ Browser freezing
- ❌ Server overload
- ❌ Console spam

### After:
- ✅ API calls every 5 seconds (controlled)
- ✅ No infinite loops
- ✅ Stable performance
- ✅ Clean console

## 🎯 Key Principles Applied

1. **Stable Function References**: Use `useRef` pattern for functions that need latest values but stable references
2. **Minimal Dependencies**: Only include truly necessary dependencies in `useEffect`
3. **Concurrent Call Prevention**: Use refs to prevent overlapping API calls
4. **Proper Cleanup**: Always clear intervals and disconnect sockets
5. **Debouncing**: Check if operation is already in progress before starting new one

## 🔧 Files Modified

- `web/app/admin/crisis-dashboard/page.tsx`
  - Fixed `refreshStatusCounts` memoization
  - Fixed `useEffect` dependency array
  - Added concurrent call prevention
  - Reduced refresh frequency

## ✅ Testing Checklist

- [x] No infinite API calls
- [x] Status counts refresh every 5 seconds (not continuously)
- [x] Socket events trigger single refresh (not loops)
- [x] No console spam
- [x] Browser performance normal
- [x] Server load normal

## 📝 Notes

- The `useRef` pattern allows us to have a stable function reference while still accessing the latest `user?.institutionId` value
- Removing `user` and `router` from dependencies prevents unnecessary effect re-runs
- The concurrent call prevention ensures we don't stack multiple API calls
- 5-second interval is a good balance between real-time updates and server load

---

**Status**: ✅ FIXED  
**Date**: December 2, 2025

