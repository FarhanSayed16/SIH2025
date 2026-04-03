# Classes Pages Restructure Plan

## Current State Analysis

### 1. `/classes` Page (`web/app/classes/page.tsx`)
**Current State:**
- ✅ **Better UI Features:**
  - Class code display with copy button
  - QR code generation button
  - Join methods indicator (QR Code or Class Code)
  - View Pending Approvals button
  - View Details button
  - Student count display
  - Teacher name display
- ❌ **Issues:**
  - Uses `/api/teacher/classes` endpoint (teacher-specific)
  - No role restriction (accessible to anyone)
  - Shows only teacher's own classes

### 2. `/teacher/classes` Page (`web/app/teacher/classes/page.tsx`)
**Current State:**
- ✅ **Good Features:**
  - Teacher-only access (role check)
  - Pending student count display
  - Approval status banners
  - Links to class details
- ❌ **Issues:**
  - Simpler UI (less features than `/classes`)
  - Missing QR code generation
  - Missing class code display/copy
  - Missing join methods indicator
  - No direct "View Pending Approvals" button

### 3. `/admin/classes` Page (`web/app/admin/classes/page.tsx`)
**Current State:**
- Admin-only class management
- Create/edit/delete classes
- Assign teachers to classes
- Full CRUD operations

## Goals

1. **`/classes` → Admin-Only View**
   - Show ALL classes across all institutions
   - Display assigned teachers
   - Show student counts
   - Admin-focused overview

2. **`/teacher/classes` → Enhanced Teacher View**
   - Merge all good features from `/classes`
   - Keep teacher-specific features (pending counts, approval banners)
   - Add QR code generation
   - Add class code display/copy
   - Add join methods indicator
   - Better UI/UX

## Implementation Plan

### Phase 1: Restructure `/classes` Page (Admin-Only)

#### 1.1 Add Admin Route Protection
```typescript
// Add AdminRoute wrapper
import { AdminRoute } from '@/components/auth/AdminRoute';

export default function ClassesPage() {
  return (
    <AdminRoute>
      {/* Page content */}
    </AdminRoute>
  );
}
```

#### 1.2 Change API Endpoint
- **From:** `/api/teacher/classes` (teacher-specific)
- **To:** `/api/admin/classes` (all classes)
- **Use:** `classesApi.list()` from `@/lib/api/classes`

#### 1.3 Update Data Structure
```typescript
interface AdminClass {
  _id: string;
  grade: string;
  section: string;
  classCode: string;
  institutionId: { _id: string; name: string };
  teacherId: { _id: string; name: string; email: string } | null;
  studentIds: string[];
  isActive: boolean;
  roomNumber?: string;
  capacity?: number;
}
```

#### 1.4 Admin-Specific UI Features
- **Header:** "All Classes" (instead of "Classes")
- **Subtitle:** "View and manage all classes across all institutions"
- **Filters:**
  - Filter by institution
  - Filter by teacher (assigned/unassigned)
  - Filter by grade
  - Filter by active/inactive
- **Class Cards Show:**
  - Institution name
  - Assigned teacher (or "Unassigned")
  - Student count
  - Active/Inactive status
  - Quick actions: View Details, Assign Teacher, Edit Class

#### 1.5 Admin Actions
- View class details (read-only for admin)
- Assign/reassign teacher
- Edit class details
- View all students in class
- View pending approvals (if teacher assigned)

### Phase 2: Enhance `/teacher/classes` Page

#### 2.1 Merge Features from `/classes`
**Add to Teacher Classes Page:**
- ✅ Class code display with copy button
- ✅ QR code generation button
- ✅ Join methods indicator (QR Code or Class Code)
- ✅ Enhanced class cards with better styling
- ✅ Direct "View Pending Approvals" button
- ✅ "View Details" button (already exists but improve)

#### 2.2 Enhanced Class Card Design
```typescript
<Card className="p-6 hover:shadow-lg transition-shadow">
  {/* Header with Grade-Section Badge */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
        {grade}-{section}
      </div>
      <div>
        <h3>Grade {grade} - Section {section}</h3>
        <p className="text-sm text-gray-500">{classCode}</p>
      </div>
    </div>
  </div>

  {/* Class Code Display */}
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
    <p className="text-xs text-gray-600 mb-1 font-medium">Class Code</p>
    <p className="text-lg font-bold text-blue-700 font-mono">{classCode}</p>
    <button onClick={copyCode}>Copy Code</button>
  </div>

  {/* Student Stats */}
  <div className="space-y-2 mb-3">
    <div className="flex justify-between text-sm">
      <span>Approved Students:</span>
      <span className="font-semibold">{approvedCount}</span>
    </div>
    <div className="flex justify-between text-sm">
      <span>Pending Requests:</span>
      <span className={`font-semibold ${pendingCount > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
        {pendingCount}
      </span>
    </div>
  </div>

  {/* Pending Alert */}
  {pendingCount > 0 && (
    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm text-yellow-800">
        <strong>{pendingCount}</strong> student{pendingCount !== 1 ? 's' : ''} waiting for approval
      </p>
    </div>
  )}

  {/* Join Methods Info */}
  <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-2 mb-3">
    <p className="text-xs font-semibold text-gray-700 mb-1">Students can join using:</p>
    <div className="flex items-center gap-3 text-xs">
      <span className="flex items-center gap-1 text-green-700">
        <QRIcon /> QR Code
      </span>
      <span className="text-gray-400">or</span>
      <span className="flex items-center gap-1 text-blue-700">
        <CodeIcon /> Class Code
      </span>
    </div>
  </div>

  {/* Action Buttons */}
  <div className="space-y-2">
    <button
      className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 transition flex items-center justify-center gap-2"
      onClick={() => handleGenerateQR(classId)}
    >
      <QRIcon />
      {hasQRCode ? 'Regenerate QR Code' : 'Generate QR Code'}
    </button>
    
    <button
      className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
      onClick={() => router.push(`/teacher/classes/${classId}/approvals`)}
    >
      {pendingCount > 0 ? `Review ${pendingCount} Request${pendingCount !== 1 ? 's' : ''}` : 'View Approvals'}
    </button>
    
    <button
      className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300 transition"
      onClick={() => router.push(`/teacher/classes/${classId}`)}
    >
      View Class Details
    </button>
  </div>
</Card>
```

#### 2.3 QR Code Generation
- Add `handleGenerateQR` function (from `/classes` page)
- Use `classroomApi.generateQR(classId)`
- Show QR code in modal or card
- Display expiration date
- Download QR code option

#### 2.4 Class Code Copy Functionality
- Large, prominent class code display
- One-click copy to clipboard
- Toast notification on copy

#### 2.5 Keep Teacher-Specific Features
- ✅ Pending student counts
- ✅ Approval status banners
- ✅ Teacher approval status checks
- ✅ Institution requirement checks

### Phase 3: UI/UX Improvements

#### 3.1 Consistent Design System
- Use same card design across both pages
- Consistent color scheme
- Consistent button styles
- Consistent spacing and typography

#### 3.2 Loading States
- Skeleton loaders for class cards
- Loading spinners for actions
- Empty states with helpful messages

#### 3.3 Error Handling
- Network error messages
- Permission error messages
- Validation error messages
- Retry mechanisms

#### 3.4 Responsive Design
- Mobile-friendly grid layout
- Responsive cards
- Touch-friendly buttons
- Mobile-optimized modals

### Phase 4: Routing & Permissions

#### 4.1 Route Protection
```typescript
// /classes/page.tsx - Admin only
<AdminRoute>
  {/* Admin classes view */}
</AdminRoute>

// /teacher/classes/page.tsx - Teacher only
useEffect(() => {
  if (user?.role !== 'teacher') {
    router.push('/dashboard');
    return;
  }
}, [user, router]);
```

#### 4.2 Sidebar Navigation
- **Admin:** "Classes" → `/classes` (all classes)
- **Teacher:** "My Classes" → `/teacher/classes` (teacher's classes)
- Update sidebar links based on role

#### 4.3 Redirect Logic
- Admin accessing `/teacher/classes` → redirect to `/classes`
- Teacher accessing `/classes` → redirect to `/teacher/classes`
- Unauthorized users → redirect to `/dashboard`

### Phase 5: API Integration

#### 5.1 Admin Classes API
```typescript
// Use classesApi.list() with filters
const response = await classesApi.list({
  limit: 1000,
  institutionId: selectedInstitution,
  teacherId: selectedTeacher,
  grade: selectedGrade,
  includeInactive: showInactive
});
```

#### 5.2 Teacher Classes API
```typescript
// Use teacherApi.getClasses()
const response = await teacherApi.getClasses();
```

#### 5.3 QR Code API
```typescript
// Use classroomApi.generateQR()
const response = await classroomApi.generateQR(classId);
```

## File Structure

```
web/app/
├── classes/
│   ├── page.tsx                    # Admin-only: All classes view
│   └── [classId]/
│       ├── page.tsx                # Class details (shared)
│       └── approvals/
│           └── page.tsx            # Approvals (shared)
└── teacher/
    └── classes/
        ├── page.tsx                # Teacher-only: My classes (enhanced)
        └── [classId]/
            ├── page.tsx            # Class details (teacher view)
            └── approvals/
                └── page.tsx       # Approvals (teacher view)
```

## Implementation Checklist

### `/classes` Page (Admin)
- [ ] Add `AdminRoute` wrapper
- [ ] Change API endpoint to `classesApi.list()`
- [ ] Update data structure for admin view
- [ ] Add filters (institution, teacher, grade, status)
- [ ] Update UI to show institution and teacher info
- [ ] Add admin actions (assign teacher, edit, view)
- [ ] Update page title and description
- [ ] Add empty state for no classes
- [ ] Add loading states
- [ ] Test with admin user

### `/teacher/classes` Page (Teacher)
- [ ] Add class code display with copy button
- [ ] Add QR code generation functionality
- [ ] Add join methods indicator
- [ ] Enhance class card design
- [ ] Add "View Pending Approvals" button
- [ ] Improve "View Details" button
- [ ] Keep pending count display
- [ ] Keep approval status banners
- [ ] Add QR code modal/download
- [ ] Test with teacher user

### Shared Components
- [ ] Create reusable `ClassCard` component (if needed)
- [ ] Create reusable `QRCodeDisplay` component
- [ ] Create reusable `ClassCodeDisplay` component
- [ ] Update sidebar navigation links

### Testing
- [ ] Test admin access to `/classes`
- [ ] Test teacher access to `/teacher/classes`
- [ ] Test redirects for wrong roles
- [ ] Test QR code generation
- [ ] Test class code copying
- [ ] Test pending approvals flow
- [ ] Test responsive design
- [ ] Test error handling

## UI Design Specifications

### Color Scheme
- **Primary:** Blue (`bg-blue-500`, `text-blue-700`)
- **Success:** Green (`bg-green-500`, `text-green-700`)
- **Warning:** Yellow (`bg-yellow-50`, `text-yellow-800`)
- **Info:** Blue (`bg-blue-50`, `text-blue-800`)
- **Danger:** Red (`bg-red-500`, `text-red-700`)

### Typography
- **Page Title:** `text-3xl font-bold text-gray-900`
- **Card Title:** `text-lg font-semibold`
- **Body Text:** `text-sm text-gray-600`
- **Code Display:** `font-mono text-lg font-bold`

### Spacing
- **Card Padding:** `p-6`
- **Card Gap:** `gap-6`
- **Button Spacing:** `space-y-2`
- **Section Margin:** `mb-4` or `mb-6`

### Components
- **Cards:** Rounded corners, shadow on hover
- **Buttons:** Full width, rounded, hover effects
- **Badges:** Rounded, colored backgrounds
- **Icons:** 4x4 or 5x5 size, colored appropriately

## Success Criteria

1. ✅ `/classes` page shows all classes (admin-only)
2. ✅ `/teacher/classes` page has all enhanced features
3. ✅ QR code generation works for teachers
4. ✅ Class code copying works
5. ✅ Pending approvals are easily accessible
6. ✅ UI is consistent and modern
7. ✅ Responsive design works on all devices
8. ✅ Proper role-based access control
9. ✅ All features are functional
10. ✅ Good user experience

## Next Steps

1. **Review this plan** with stakeholders
2. **Get approval** to proceed
3. **Start with Phase 1** (Admin `/classes` page)
4. **Then Phase 2** (Enhanced teacher `/teacher/classes` page)
5. **Test thoroughly** before deployment
6. **Gather feedback** and iterate

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-03  
**Status:** Ready for Review

