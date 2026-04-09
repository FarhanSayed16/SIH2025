# 📊 IoT Data Access Plan

**Date:** December 8, 2025  
**Status:** Planning & Enhancement

---

## 🔍 **CURRENT ACCESS POINTS**

### **📱 Mobile App:**

#### **Current Access:**
1. **Profile Screen** → "IoT Devices" Card
   - Path: `Profile Screen` → Scroll down → "IoT Devices" card
   - Location: `mobile/lib/features/profile/screens/profile_screen.dart` (Line 343-359)
   - **Issue:** Hidden in profile, not easily discoverable

#### **What You Can See:**
- ✅ Device List Screen (`IoTDeviceListScreen`)
  - Shows all IoT devices
  - Device health status
  - Last seen time
- ✅ Device Detail Screen (`IoTDeviceDetailScreen`)
  - Real-time sensor readings
  - Fire, Flood, Earthquake sensors
  - Historical data
  - Socket.io real-time updates

---

### **🌐 Web Dashboard:**

#### **Current Access:**
1. **Sidebar Navigation** → "Devices" Menu
   - Path: Sidebar → Click "Devices" (📱 icon)
   - URL: `/devices`
   - Roles: Admin, Teacher
   - Location: `web/components/layout/sidebar.tsx` (Line 29)

#### **What You Can See:**
- ✅ Device List View
  - All devices table
  - IoT sensors section
  - Device status
- ✅ Health Monitoring View
  - Device health statistics
  - Health status cards
- ✅ Device Detail View
  - Real-time sensor readings (NEW)
  - Historical charts
  - Statistics

---

## 🎯 **PROPOSED ENHANCEMENTS**

### **📱 Mobile App Enhancements:**

#### **1. Add IoT Widget to Dashboard Home Screen**
- **Location:** `mobile/lib/features/dashboard/screens/home_screen.dart`
- **What:** Add IoT device status card/widget
- **Shows:**
  - Active devices count
  - Recent alerts
  - Quick access to device list
- **Priority:** HIGH

#### **2. Add IoT Quick Access to Main Menu**
- **Location:** `mobile/lib/screens/main_menu_screen.dart`
- **What:** Add "IoT Devices" card to main menu
- **Shows:** Quick access to device list
- **Priority:** MEDIUM

#### **3. Add IoT Alert Notifications**
- **Location:** Already implemented in `socket_event_handler.dart`
- **What:** Show alerts as notifications
- **Status:** ✅ Already working

---

### **🌐 Web Dashboard Enhancements:**

#### **1. Add IoT Widget to Main Dashboard**
- **Location:** `web/app/dashboard/page.tsx`
- **What:** Add IoT device status cards
- **Shows:**
  - Active devices count
  - Recent alerts
  - Device health summary
  - Quick link to devices page
- **Priority:** HIGH

#### **2. Add IoT Alert Banner**
- **Location:** `web/app/dashboard/page.tsx`
- **What:** Show active IoT alerts at top
- **Shows:** Critical alerts from IoT devices
- **Priority:** HIGH

#### **3. Add IoT to Crisis Dashboard**
- **Location:** `web/app/admin/crisis-dashboard/page.tsx`
- **What:** Add IoT device monitoring section
- **Shows:** Real-time IoT alerts and status
- **Priority:** MEDIUM

---

## 📋 **IMPLEMENTATION PLAN**

### **Phase 1: Mobile App Dashboard Widget** (Priority: HIGH)
- [ ] Add IoT status card to `home_screen.dart`
- [ ] Show active devices count
- [ ] Show recent alerts
- [ ] Add navigation to device list

### **Phase 2: Web Dashboard Widget** (Priority: HIGH)
- [ ] Add IoT status cards to main dashboard
- [ ] Show device health summary
- [ ] Add alert banner for critical alerts
- [ ] Add quick link to devices page

### **Phase 3: Enhanced Visibility** (Priority: MEDIUM)
- [ ] Add IoT to main menu (mobile)
- [ ] Add IoT to crisis dashboard (web)
- [ ] Add push notifications for alerts

---

## 🗺️ **USER JOURNEY MAP**

### **Mobile App:**
```
Current:
Login → Dashboard → Profile Tab → Scroll → IoT Devices

Proposed:
Login → Dashboard → Home Tab → IoT Status Card → Device List
Login → Dashboard → Main Menu → IoT Devices
```

### **Web Dashboard:**
```
Current:
Login → Sidebar → Devices → Device List

Proposed:
Login → Dashboard → IoT Status Cards → Devices Page
Login → Dashboard → Alert Banner → Device Details
Login → Sidebar → Devices → Device List (existing)
```

---

## ✅ **WHAT'S ALREADY WORKING**

### **Mobile App:**
- ✅ Device List Screen
- ✅ Device Detail Screen
- ✅ Real-time updates via Socket.io
- ✅ Alert notifications

### **Web Dashboard:**
- ✅ Device Management Page (`/devices`)
- ✅ Real-time sensor visualization
- ✅ Historical charts
- ✅ Socket.io integration

---

## 🎯 **NEXT STEPS**

1. **Add IoT widget to mobile home screen** (HIGH)
2. **Add IoT widget to web dashboard** (HIGH)
3. **Add IoT to main menu** (MEDIUM)
4. **Add IoT to crisis dashboard** (MEDIUM)

---

**Status:** Ready for implementation

