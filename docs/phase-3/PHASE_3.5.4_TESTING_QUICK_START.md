# Phase 3.5.4: Quick Testing Start Guide

**Date**: 2025-01-27

---

## ⚡ **Quick Start (5 Minutes)**

### **Step 1: Start Backend Server** (2 min)

```bash
cd backend
npm run dev
```

**Wait for**: `✅ MongoDB Connected` and server running on port 3000

---

### **Step 2: Start Web App** (2 min)

```bash
cd web
npm run dev
```

**Wait for**: Web app running on `http://localhost:3001`

---

### **Step 3: Test in Browser** (1 min)

1. Open `http://localhost:3001`
2. Login with admin credentials
3. Click "Users" in sidebar
4. Verify user table loads

**✅ If users table shows up → Everything is working!**

---

## 🧪 **Quick API Test** (Optional)

Run automated test:

```bash
cd backend
node scripts/test-phase3.5.4-bulk-operations.js
```

**Note**: Update admin credentials in the script first if needed.

---

## ✅ **What to Verify**

### **Web UI**
- [ ] Users page accessible from sidebar
- [ ] User table displays data
- [ ] Search box works
- [ ] Filter dropdowns work
- [ ] Export buttons visible

### **Backend**
- [ ] Server starts without errors
- [ ] No errors in console about ExcelJS
- [ ] API endpoints accessible

---

## 🐛 **Quick Fixes**

**Issue: Can't access Users page**
- Check sidebar has "Users" link
- Check route exists: `/users`

**Issue: Excel export fails**
- Check: `npm list exceljs` in backend
- Install if needed: `npm install exceljs`

**Issue: No users shown**
- Run: `npm run seed` in backend
- Or create users via registration

---

**Status**: ✅ **Ready for Testing!**

