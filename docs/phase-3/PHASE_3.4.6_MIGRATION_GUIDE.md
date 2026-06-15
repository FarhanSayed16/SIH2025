# Phase 3.4.6: Migration Guide

**Phase**: 3.4.6  
**Status**: ✅ **READY FOR MIGRATION**  
**Date**: 2025-01-27

---

## 📋 **Overview**

This migration guide provides step-by-step instructions for migrating to Phase 3.4.6 changes. All changes are **backward compatible** - existing users and data will continue to work.

---

## 🔄 **Migration Steps**

### **Step 1: Update Codebase**

#### **Backend Update**
```bash
cd backend
git pull origin main  # Or your branch
npm install  # Ensure dependencies are up to date
```

**No database migrations required** - Backend already supports all fields.

#### **Mobile Update**
```bash
cd mobile
git pull origin main  # Or your branch
flutter pub get  # Update dependencies
```

---

### **Step 2: Verify Backend**

#### **Check Registration Endpoint**
Verify that `/api/auth/register` accepts new fields:
- `institutionId`
- `grade`
- `section`
- `classId`
- `accessLevel`
- `canUseApp`
- `requiresTeacherAuth`

**Test Command**:
```bash
# Test registration with new fields
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "name": "Test User",
    "role": "student",
    "institutionId": "...",
    "grade": "10",
    "section": "A",
    "classId": "..."
  }'
```

---

### **Step 3: Test Mobile App**

#### **Test Registration**
1. Open mobile app
2. Tap "Register"
3. Verify new fields appear:
   - Institution dropdown
   - Grade selector (for students)
   - Section input (for students)
   - Class selector (for students)
4. Complete registration
5. Verify user is created with all fields

#### **Test Role-Based Routing**
1. Login as teacher → Should see teacher dashboard
2. Login as student → Should see appropriate student dashboard
3. Login as admin → Should see admin dashboard

#### **Test Feature Gating**
1. Login as student with limited access
2. Try to access restricted features
3. Verify access denied messages appear
4. Verify only allowed features are accessible

---

### **Step 4: Update Existing Users (Optional)**

Existing users will continue to work, but you may want to update incomplete records:

#### **Backend Script to Update Users**
```javascript
// Optional: Update existing users with missing fields
// This is optional - existing users will work fine
```

**Recommendation**: Update users gradually as they log in, or run a batch update script.

---

## ⚠️ **Breaking Changes**: None

**All changes are backward compatible.**

---

## 🔍 **What Changed**

### **Mobile App Changes**

#### **1. Registration Form**
- **New Fields**: Institution, Grade, Section, Class
- **Conditional Visibility**: Fields show/hide based on role
- **Validation**: All fields validated before submission

#### **2. Navigation**
- **Role-Based Routing**: Different dashboards for different roles
- **Automatic Routing**: Routing happens automatically based on user role

#### **3. Feature Access**
- **Feature Gating**: Access level controls feature visibility
- **Access Messages**: Clear messages when access is denied

#### **4. Services**
- **New Services**: SchoolService, ClassService for registration
- **Enhanced Services**: AuthService supports new registration fields

---

### **Backend Changes**

#### **No Breaking Changes**
- All existing endpoints work as before
- Registration endpoint now validates new fields
- All fields are optional for backward compatibility

---

## 📝 **Configuration Changes**

### **Mobile Configuration**

**No configuration changes required.**

### **Backend Configuration**

**No configuration changes required.**

---

## 🧪 **Testing Checklist**

After migration, test:

- [ ] Registration with all fields works
- [ ] Registration without new fields works (backward compatibility)
- [ ] Teacher login shows teacher dashboard
- [ ] Student login shows appropriate dashboard
- [ ] Feature gating works correctly
- [ ] All existing features still work
- [ ] No errors in console/logs

---

## 🐛 **Troubleshooting**

### **Issue: Registration Fails**

**Possible Causes**:
- Backend not updated
- Validation errors

**Solution**:
1. Check backend logs for validation errors
2. Verify all required fields are provided
3. Check backend routes are updated

---

### **Issue: Wrong Dashboard Shown**

**Possible Causes**:
- User role not set correctly
- Access level not set correctly

**Solution**:
1. Check user role in database
2. Check user access level
3. Verify AppRouter logic

---

### **Issue: Features Not Accessible**

**Possible Causes**:
- Feature gating too restrictive
- Access level not set correctly

**Solution**:
1. Check user access level
2. Verify AccessLevelProvider logic
3. Check feature access configuration

---

## 📚 **Additional Resources**

- **Complete Documentation**: `PHASE_3.4.6_COMPLETE_DOCUMENTATION.md`
- **API Verification**: `PHASE_3.4.6.7_API_VERIFICATION.md`
- **Navigation Guide**: `PHASE_3.4.6.6_NAVIGATION_VERIFICATION.md`
- **E2E Testing**: `PHASE_3.4.6.8_E2E_TESTING.md`

---

## ✅ **Migration Complete**

Once all steps are completed and tested:

1. ✅ Code updated
2. ✅ Backend verified
3. ✅ Mobile tested
4. ✅ All features working
5. ✅ No errors

**System is ready for Phase 3.5.1** 🚀

---

**Migration Guide Version**: 1.0  
**Last Updated**: 2025-01-27

