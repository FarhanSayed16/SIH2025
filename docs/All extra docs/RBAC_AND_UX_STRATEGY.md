# 🎯 RBAC & UX Strategy: Kavach Authentication & Access Control Refinement

**Date**: 2025-01-27  
**Status**: 📋 **MASTER PLAN - AWAITING APPROVAL**  
**Lead**: System Architect & UI/UX Designer

---

## 📋 **Executive Summary**

This document outlines the comprehensive strategy to refine Kavach's authentication and role-based access control (RBAC) system to handle real-world school scenarios, specifically addressing the age gap between young students (KG-4th) who cannot manage devices and senior students (5th+) who can.

**Core Principle**: **DO NOT BREAK EXISTING FUNCTIONALITY** (Drills, IoT, Modules, Basic Auth)

---

## 🎯 **Current State Analysis**

### **What Works (DO NOT BREAK)**
- ✅ Core authentication (email/password, JWT tokens)
- ✅ Role-based routing (Admin, Teacher, Student, Parent)
- ✅ QR code system (individual user QR login)
- ✅ Device authentication (class tablets)
- ✅ Teacher dashboard and class management
- ✅ Drill system with participation tracking
- ✅ IoT device integration
- ✅ Module and quiz system
- ✅ Access level system (`full`, `shared`, `teacher_led`)

### **What Needs Refinement**
- ❌ **All students currently have email/password accounts** (even KG-4th)
- ❌ **No distinction between "Account Users" and "Roster Records"**
- ❌ **QR codes are for individual login, not classroom joining**
- ❌ **No teacher approval workflow for student registration**
- ❌ **Young students (KG-4th) can technically login** (should be teacher-managed only)
- ❌ **No classroom QR code generation for student joining**

---

## 🏗️ **Phase 1: Backend Schema & Logic Refinement**

### **1.1 User Model Enhancement**

#### **Current Schema Issues**
- All users require `email` and `password` (even young students)
- No distinction between "Account Users" (can login) and "Roster Records" (teacher-managed)
- `requiresTeacherAuth` exists but isn't used for approval workflow

#### **Proposed Schema Changes**

**File**: `backend/src/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // NEW: User Type Distinction
  userType: {
    type: String,
    enum: ['account_user', 'roster_record'],
    default: function() {
      if (this.role === 'student') {
        const gradeNum = parseInt(this.grade) || 0;
        // KG-4th: Roster records (no login)
        if (gradeNum <= 4 || this.grade === 'KG') {
          return 'roster_record';
        }
        // 5th+: Account users (can login after approval)
        return 'account_user';
      }
      // Teachers, admins are always account users
      return 'account_user';
    }
  },
  
  // MODIFIED: Email becomes optional for roster records
  email: {
    type: String,
    required: function() {
      // Only required for account users
      return this.userType === 'account_user' || this.role !== 'student';
    },
    unique: true,
    sparse: true, // Allow null values for roster records
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  
  // MODIFIED: Password becomes optional for roster records
  password: {
    type: String,
    required: function() {
      // Only required for account users
      return this.userType === 'account_user' || this.role !== 'student';
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // NEW: Teacher Approval System
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: function() {
      if (this.role === 'student' && this.userType === 'account_user') {
        return 'pending'; // 5th+ students need approval
      }
      return 'approved'; // Auto-approved for others
    }
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  
  // NEW: Classroom Join Request
  joinRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassroomJoinRequest',
    default: null
  },
  
  // MODIFIED: QR Code - now supports both individual and classroom QR
  qrCode: {
    type: String,
    default: null,
    sparse: true
  },
  qrBadgeId: {
    type: String,
    default: null,
    sparse: true
  },
  
  // NEW: Classroom QR (for joining)
  classroomQRCode: {
    type: String,
    default: null
  },
  
  // ... rest of existing fields ...
});
```

#### **Migration Strategy**
1. **Backward Compatibility**: Existing users remain `account_user` with `approvalStatus: 'approved'`
2. **Roster Records**: New KG-4th students created without email/password
3. **Gradual Migration**: Script to convert existing KG-4th students to roster records (optional)

---

### **1.2 New Model: ClassroomJoinRequest**

**File**: `backend/src/models/ClassroomJoinRequest.js` (NEW)

```javascript
import mongoose from 'mongoose';

const classroomJoinRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  qrCode: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: function() {
      // QR codes expire after 7 days
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  studentInfo: {
    name: String,
    email: String,
    phone: String,
    parentName: String,
    parentPhone: String
  }
}, {
  timestamps: true
});

// Indexes
classroomJoinRequestSchema.index({ qrCode: 1 }, { unique: true });
classroomJoinRequestSchema.index({ classId: 1, status: 1 });
classroomJoinRequestSchema.index({ teacherId: 1, status: 1 });
classroomJoinRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ClassroomJoinRequest = mongoose.model('ClassroomJoinRequest', classroomJoinRequestSchema);
export default ClassroomJoinRequest;
```

---

### **1.3 Enhanced Class Model**

**File**: `backend/src/models/Class.js`

**Add Fields**:
```javascript
const classSchema = new mongoose.Schema({
  // ... existing fields ...
  
  // NEW: Classroom QR Code for student joining
  joinQRCode: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  joinQRExpiresAt: {
    type: Date,
    default: null
  },
  
  // NEW: Pending join requests
  pendingJoinRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClassroomJoinRequest'
  }],
  
  // ... rest of existing fields ...
});
```

---

### **1.4 New Services**

#### **1.4.1 Classroom Join Service**

**File**: `backend/src/services/classroom-join.service.js` (NEW)

**Key Functions**:
1. `generateClassroomQR(classId, teacherId)` - Generate QR for classroom
2. `scanClassroomQR(qrCode, studentInfo)` - Student scans QR to request join
3. `getPendingRequests(classId, teacherId)` - Teacher views pending requests
4. `approveJoinRequest(requestId, teacherId)` - Teacher approves student
5. `rejectJoinRequest(requestId, teacherId, reason)` - Teacher rejects student
6. `expireQRCode(classId)` - Expire old QR codes

**Flow**:
```
1. Teacher generates classroom QR → Returns QR code string
2. Student scans QR → Creates ClassroomJoinRequest (status: pending)
3. Teacher views pending requests → Sees student info
4. Teacher approves/rejects → Updates request + User model
5. If approved → Student can login, linked to class
```

#### **1.4.2 Roster Management Service**

**File**: `backend/src/services/roster-management.service.js` (NEW)

**Key Functions**:
1. `createRosterRecord(classId, studentInfo)` - Teacher creates KG-4th student
2. `updateRosterRecord(studentId, updates)` - Teacher updates roster record
3. `getClassRoster(classId)` - Get all students (account users + roster records)
4. `markRosterAttendance(classId, studentIds, status)` - Bulk attendance for drills
5. `bulkCheckIn(classId, studentIds)` - Quick check-in during drills

---

### **1.5 Enhanced Authentication Service**

**File**: `backend/src/services/auth.service.js`

**Modifications**:
1. **Registration**: 
   - 5th+ students: Create account with `approvalStatus: 'pending'`
   - Block login until `approvalStatus: 'approved'`
   
2. **Login**:
   - Check `approvalStatus` before allowing login
   - Reject if `pending` or `rejected`
   - Allow if `approved`

3. **QR Login**:
   - Support both individual QR (existing) and classroom QR (new)
   - If classroom QR → Create join request instead of login

---

### **1.6 New API Endpoints**

#### **Classroom Join Endpoints**

**File**: `backend/src/routes/classroom-join.routes.js` (NEW)

```javascript
// Teacher: Generate classroom QR
POST /api/classroom/:classId/qr/generate
Headers: { Authorization: Bearer <teacher_token> }
Response: { qrCode: "...", expiresAt: "..." }

// Teacher: Get pending join requests
GET /api/classroom/:classId/join-requests
Headers: { Authorization: Bearer <teacher_token> }
Response: { requests: [...] }

// Teacher: Approve join request
POST /api/classroom/join-requests/:requestId/approve
Headers: { Authorization: Bearer <teacher_token> }
Body: { notes: "..." }

// Teacher: Reject join request
POST /api/classroom/join-requests/:requestId/reject
Headers: { Authorization: Bearer <teacher_token> }
Body: { reason: "..." }

// Student: Scan classroom QR
POST /api/classroom/join/scan
Body: { qrCode: "...", studentInfo: { name, email, phone, parentName, parentPhone } }
Response: { requestId: "...", status: "pending", message: "Waiting for teacher approval" }
```

#### **Roster Management Endpoints**

**File**: `backend/src/routes/roster.routes.js` (NEW)

```javascript
// Teacher: Create roster record (KG-4th)
POST /api/roster/:classId/students
Headers: { Authorization: Bearer <teacher_token> }
Body: { name, grade, section, parentName, parentPhone, ... }

// Teacher: Get class roster (all students)
GET /api/roster/:classId/students
Headers: { Authorization: Bearer <teacher_token> }

// Teacher: Update roster record
PUT /api/roster/students/:studentId
Headers: { Authorization: Bearer <teacher_token> }

// Teacher: Bulk check-in during drill
POST /api/roster/:classId/bulk-checkin
Headers: { Authorization: Bearer <teacher_token> }
Body: { studentIds: [...], drillId: "..." }
```

---

### **1.7 Drill System Adaptation**

**File**: `backend/src/services/drill.service.js`

**Modifications**:
1. **Drill Participation**:
   - Account users: Self-acknowledge (existing)
   - Roster records: Teacher marks manually (new)

2. **Drill Status View**:
   - Show both account users and roster records
   - Differentiate visually (icon, color)
   - Teacher can mark roster records as safe/missing

---

## 🎨 **Phase 2: UI/UX Overhaul**

### **2.1 Design System Enhancements**

#### **New Design Tokens**

**File**: `mobile/lib/core/design/design_system.dart`

**Add**:
- Glassmorphism effects (blur, transparency)
- Soft shadows (elevated cards)
- Smooth animations (flutter_animate)
- Modern color gradients
- Micro-interactions

---

### **2.2 Authentication Screens Redesign**

#### **2.2.1 Login Screen**

**File**: `mobile/lib/features/auth/screens/login_screen.dart`

**Enhancements**:
1. **Visual**:
   - Animated logo entry (Lottie or flutter_animate)
   - Glassmorphic card for form
   - Smooth transitions
   - Modern typography

2. **Features**:
   - Prominent "Scan QR Code" button (for students)
   - "Forgot Password" link (intuitive placement)
   - Role-based hints (student vs teacher vs admin)
   - Loading states with animations

3. **UX Flow**:
   ```
   Login Screen
   ├─ Email/Password Login (Primary)
   ├─ "Scan QR Code" Button (Prominent for students)
   ├─ "Forgot Password" Link (Bottom)
   └─ "Register" Link (Bottom)
   ```

#### **2.2.2 Register Screen**

**File**: `mobile/lib/features/auth/screens/register_screen.dart`

**Enhancements**:
1. **Role Selection** (First Step):
   - Visual cards for each role
   - Animated selection
   - Role-specific information

2. **Student Registration** (5th+):
   - Step 1: Basic info (name, email, password)
   - Step 2: **"Join Classroom"** (Scan QR or Enter Class Code)
   - Step 3: Parent info (optional)
   - Step 4: **"Waiting for Approval"** screen
   - Step 5: Notification when approved

3. **Teacher/Admin Registration**:
   - Standard form (existing)
   - Institution selection
   - Verification workflow

#### **2.2.3 QR Scanner Screen (Enhanced)**

**File**: `mobile/lib/features/qr/screens/qr_scanner_screen.dart`

**Enhancements**:
1. **Dual Mode**:
   - **Individual QR**: Login with personal QR
   - **Classroom QR**: Join classroom (new)

2. **Visual**:
   - Animated scanning overlay
   - Success/Error animations
   - Clear instructions

3. **Flow**:
   ```
   QR Scanner
   ├─ Detect QR Type (Individual vs Classroom)
   ├─ If Individual → Login
   └─ If Classroom → Show Join Request Form
       ├─ Pre-fill student info
       ├─ Submit request
       └─ Show "Waiting for Approval" screen
   ```

#### **2.2.4 Classroom Join Request Screen (NEW)**

**File**: `mobile/lib/features/auth/screens/classroom_join_request_screen.dart` (NEW)

**Features**:
- Form to enter student details
- Parent information (optional)
- Submit request
- Show pending status
- Notification when approved/rejected

#### **2.2.5 Approval Pending Screen (NEW)**

**File**: `mobile/lib/features/auth/screens/approval_pending_screen.dart` (NEW)

**Features**:
- Animated waiting indicator
- Teacher information
- Estimated approval time
- Option to contact teacher
- Push notification when approved

---

### **2.3 Teacher Dashboard Enhancements**

#### **2.3.1 Classroom Management Screen**

**File**: `mobile/lib/features/teacher/screens/class_management_screen.dart`

**New Features**:
1. **Classroom QR Generator**:
   - Button to generate/regenerate QR
   - QR code display (scannable)
   - Share QR code option
   - Expiration timer

2. **Pending Join Requests**:
   - Badge with count
   - List of pending requests
   - Quick approve/reject actions
   - Student info preview

3. **Roster Management** (KG-4th):
   - Add roster record button
   - List of roster records
   - Edit/Delete roster records
   - Bulk operations

#### **2.3.2 Join Requests Screen (NEW)**

**File**: `mobile/lib/features/teacher/screens/join_requests_screen.dart` (NEW)

**Features**:
- List of pending requests
- Student information cards
- Approve/Reject actions
- Filter by class
- Search functionality

---

### **2.4 Drill Participation UI Updates**

#### **2.4.1 Drill Detail Screen (Teacher View)**

**File**: `mobile/lib/features/drills/screens/drill_detail_screen.dart`

**Enhancements**:
1. **Student List**:
   - Account users: Self-acknowledged (green checkmark)
   - Roster records: Teacher checkboxes (manual marking)
   - Visual distinction (icon, color)
   - Bulk select for roster records

2. **Quick Actions**:
   - "Mark All Safe" for roster records
   - "Mark Missing" for specific students
   - Real-time status updates

---

### **2.5 Animation & Transitions**

**Libraries to Add**:
- `flutter_animate`: Smooth animations
- `lottie`: Complex animations
- `animations`: Material motion

**Animation Points**:
1. Screen transitions (fade, slide, scale)
2. Button press feedback
3. Form validation feedback
4. Success/Error states
5. Loading indicators

---

## 🔄 **Implementation Phases**

### **Phase 1.1: Backend Schema Updates** (Week 1)
- [ ] Update User model with `userType`, `approvalStatus`
- [ ] Create ClassroomJoinRequest model
- [ ] Update Class model with join QR
- [ ] Migration script for existing data
- [ ] Backward compatibility tests

### **Phase 1.2: Backend Services** (Week 1-2)
- [ ] Classroom join service
- [ ] Roster management service
- [ ] Enhanced auth service
- [ ] Drill service updates
- [ ] Unit tests

### **Phase 1.3: Backend API Endpoints** (Week 2)
- [ ] Classroom join routes
- [ ] Roster management routes
- [ ] Updated auth routes
- [ ] Integration tests
- [ ] API documentation

### **Phase 2.1: Mobile Auth Screens** (Week 2-3)
- [ ] Login screen redesign
- [ ] Register screen redesign
- [ ] QR scanner enhancement
- [ ] Classroom join request screen
- [ ] Approval pending screen

### **Phase 2.2: Mobile Teacher Features** (Week 3)
- [ ] Classroom QR generator
- [ ] Join requests screen
- [ ] Roster management UI
- [ ] Drill participation updates

### **Phase 2.3: Polish & Testing** (Week 4)
- [ ] Animations and transitions
- [ ] Error handling
- [ ] Loading states
- [ ] End-to-end testing
- [ ] User acceptance testing

---

## 🛡️ **Backward Compatibility & Migration**

### **Data Migration Strategy**

1. **Existing Users**:
   - All existing users → `userType: 'account_user'`
   - All existing students → `approvalStatus: 'approved'`
   - No breaking changes

2. **New Roster Records**:
   - Created without email/password
   - `userType: 'roster_record'`
   - Linked to class via `classId`

3. **Gradual Migration** (Optional):
   - Script to convert KG-4th students to roster records
   - Requires manual review
   - Can be done incrementally

### **API Compatibility**

- All existing endpoints remain functional
- New endpoints are additive
- No breaking changes to existing flows

---

## ✅ **Success Criteria**

### **Functional Requirements**
- ✅ KG-4th students are roster records (no login)
- ✅ 5th+ students register via QR scan
- ✅ Teacher approval workflow works
- ✅ Classroom QR generation works
- ✅ Drill participation handles both types
- ✅ All existing features still work

### **UX Requirements**
- ✅ Modern, polished UI (startup-quality)
- ✅ Smooth animations and transitions
- ✅ Intuitive user flows
- ✅ Clear error messages
- ✅ Loading states everywhere
- ✅ Accessible (screen reader, high contrast)

### **Performance Requirements**
- ✅ No performance degradation
- ✅ Fast QR scanning
- ✅ Real-time updates
- ✅ Offline support maintained

---

## 🚨 **Risk Mitigation**

### **Risks Identified**

1. **Breaking Existing Features**
   - **Mitigation**: Extensive testing, backward compatibility
   - **Rollback Plan**: Feature flags, gradual rollout

2. **Data Migration Issues**
   - **Mitigation**: Test migration on staging, backup data
   - **Rollback Plan**: Database restore procedure

3. **UX Confusion**
   - **Mitigation**: User testing, clear instructions
   - **Rollback Plan**: A/B testing, feedback loops

4. **Performance Impact**
   - **Mitigation**: Load testing, optimization
   - **Rollback Plan**: Performance monitoring, alerts

---

## 📚 **Documentation Requirements**

1. **API Documentation**: Update OpenAPI spec
2. **User Guides**: Teacher and student guides
3. **Developer Docs**: Schema changes, migration guide
4. **Testing Docs**: Test cases, scenarios

---

## 🎯 **Next Steps**

1. **Review this strategy document**
2. **Get approval from stakeholders**
3. **Create detailed task breakdown**
4. **Start Phase 1.1 (Backend Schema Updates)**
5. **Iterate based on feedback**

---

**Status**: 📋 **READY FOR REVIEW**  
**Last Updated**: 2025-01-27

---

## 📝 **Notes**

- This strategy maintains 100% backward compatibility
- All existing features continue to work
- New features are additive, not replacements
- Migration is optional and can be gradual
- Focus on UX polish and modern design

