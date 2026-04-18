# QR Code Index Solution

## **Problem**
MongoDB unique index on `qrCode` and `qrBadgeId` was causing duplicate key errors when multiple users have `null` values, even with `sparse: true`.

## **Root Cause**
Even with sparse indexes, MongoDB was still treating multiple `null` values as duplicates in some cases, especially when the index was auto-created by Mongoose.

## **Solution**
**Temporary Fix**: Made indexes **non-unique** for now.

- `qrCode` and `qrBadgeId` indexes are now **sparse but non-unique**
- This allows multiple `null` values
- When QR codes are actually generated (Phase 2.5 implementation), we can make them unique again
- For now, uniqueness will be enforced at the application level when QR codes are generated

## **Files Modified**
- `backend/scripts/seed.js` - Changed index creation to non-unique sparse indexes

## **Future Fix**
When implementing QR code generation:
1. Generate unique QR codes for students
2. Then make the indexes unique again
3. Or use a compound unique index with `userId` + `qrCode`

---

**This is a temporary solution to unblock development. The indexes can be made unique later when QR codes are actually being generated.**

