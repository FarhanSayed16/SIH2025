# 🚀 Live Testing Instructions - Phase 2.5

## 🎯 **Current Status**

✅ **Backend**: Running on port 3000  
🔄 **Web App**: Starting on port 3001  
✅ **Mobile App**: Deployed to device (2312DRA50I)

---

## 📱 **MOBILE APP TESTING**

### **Step 1: Basic Login**
1. Open the app on your device
2. You should see the login screen
3. **Test Email/Password Login**:
   - Enter email: `test@example.com` (or any registered user)
   - Enter password: `password123`
   - Click "Login"
   - ✅ Should redirect to appropriate dashboard based on role

### **Step 2: QR Login** (NEW)
1. On login screen, click **"Login with QR Code"** button
2. Camera should open
3. Scan a QR code (if you have one)
4. ✅ Should login automatically

### **Step 3: Teacher Dashboard** (NEW)
1. Login as a teacher user
2. ✅ Should see "Teacher Dashboard" screen
3. ✅ Should see list of assigned classes
4. Click on a class
5. ✅ Should open "Class Management" screen
6. ✅ Should see list of students
7. Click QR scanner icon
8. ✅ Should open QR scanner

### **Step 4: Student Dashboard**
1. Login as a student (9th-12th grade)
2. ✅ Should see full dashboard with:
   - Home screen
   - Learn screen
   - Games screen
   - Profile screen

### **Step 5: Kid Mode** (NEW)
1. Login as a KG-5th grade student (via QR)
2. ✅ Should see "Kid Home Screen" with:
   - Large buttons
   - Bright colors
   - Simple navigation
3. Click on a module
4. ✅ Should see "Kid Module Screen" with voice narration

---

## 🌐 **WEB APP TESTING**

### **Step 1: Access Web App**
1. Open browser
2. Navigate to: **http://localhost:3001**
3. ✅ Should see login page or redirect to dashboard

### **Step 2: Admin Login**
1. Enter admin credentials
2. Click "Sign In"
3. ✅ Should redirect to dashboard
4. ✅ Should see:
   - Total Drills
   - Active Drills
   - Total Alerts
   - Active Alerts
   - Recent Alerts
   - Recent Events

### **Step 3: Classes Page** (NEW)
1. Click **"Classes"** in sidebar
2. ✅ Should see list of all classes
3. ✅ Each class card shows:
   - Grade and Section
   - Student count
   - Teacher name
4. Click "View Details" on a class
5. ✅ Should navigate to class details (if implemented)

### **Step 4: QR Generator** (NEW)
1. Click **"QR Generator"** in sidebar
2. ✅ Should see QR generator page
3. Select a class from dropdown
4. Click **"Generate QR Badges for Class"**
5. ✅ Should see QR codes appear for all students
6. Click **"Print Badge"** on any QR code
7. ✅ Should open print dialog with badge

### **Step 5: Dashboard Features**
1. Navigate to dashboard
2. ✅ Should see real-time updates (if Socket.io connected)
3. ✅ Should see drill and alert data

---

## 🔗 **INTEGRATION TESTING**

### **Test 1: QR Code Flow**
1. **Web**: Generate QR codes for a class
2. **Mobile**: Scan one of the QR codes
3. ✅ Mobile should login automatically
4. ✅ Should redirect to appropriate screen

### **Test 2: Teacher-Student Flow**
1. **Mobile (Teacher)**: Login as teacher
2. **Mobile (Teacher)**: Start a drill for a class
3. **Mobile (Student)**: Student should receive notification
4. ✅ Student should see drill alert

### **Test 3: Device Mode**
1. **Mobile**: Register device as class tablet
2. **Mobile**: Login with device token
3. ✅ Should enter "Class Device Mode"
4. ✅ Should show class-specific interface

---

## 🐛 **Troubleshooting**

### **Issue: Mobile app not launching**
- Check if device is connected: `flutter devices`
- Check build logs in terminal
- Try: `flutter clean && flutter pub get && flutter run`

### **Issue: Web app not loading**
- Check if server is running: `cd web && npm run dev`
- Check port 3001 is not in use
- Check browser console for errors

### **Issue: Backend not responding**
- Check if server is running: `cd backend && npm run dev`
- Check MongoDB connection
- Check port 3000 is not in use

### **Issue: QR scanner not working**
- Check camera permissions in Android settings
- Check if `mobile_scanner` package is installed
- Try restarting app

### **Issue: Login fails**
- Check backend URL in mobile `.env` file
- Check backend is running
- Check credentials are correct
- Check network connection

---

## ✅ **Success Checklist**

### **Mobile App**
- [ ] App launches on device
- [ ] Login screen appears
- [ ] Email/password login works
- [ ] QR login button visible
- [ ] QR scanner opens
- [ ] Teacher dashboard shows classes
- [ ] Class management shows students
- [ ] Student dashboard shows correctly
- [ ] Kid mode activates for young students
- [ ] No crashes

### **Web App**
- [ ] Login page loads
- [ ] Admin login works
- [ ] Dashboard loads data
- [ ] Classes page shows classes
- [ ] QR generator works
- [ ] QR codes generate
- [ ] Print badge works
- [ ] No console errors

### **Backend**
- [ ] Server running
- [ ] Health check works
- [ ] All endpoints respond
- [ ] MongoDB connected
- [ ] Socket.io initialized

---

## 📊 **Test Results**

Fill this out as you test:

### **Date**: ___________
### **Tester**: ___________

#### **Mobile App**
- Status: ✅ / ❌
- Issues: 
  - 
  - 

#### **Web App**
- Status: ✅ / ❌
- Issues:
  - 
  - 

#### **Backend**
- Status: ✅ / ❌
- Issues:
  - 
  - 

#### **Integration**
- Status: ✅ / ❌
- Issues:
  - 
  - 

---

**Ready to test!** 🚀

