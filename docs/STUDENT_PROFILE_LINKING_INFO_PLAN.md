# Student Profile - Parent Linking Information Display Plan

## 📋 Executive Summary

This document outlines a plan to add a dedicated section in student profile/settings pages (both web and mobile) where students can view their QR code, Student ID, and Institution ID. This information will help parents easily link to their children's accounts.

**Status**: 📋 **PLANNING PHASE - AWAITING APPROVAL**  
**Priority**: 🔴 **HIGH** - Essential for parent-child linking workflow  
**Estimated Timeline**: 1-2 days for full implementation

---

## 🎯 Core Objectives

1. **Display Student Linking Information**
   - Show student QR code (visual and text)
   - Display Student ID/Registration Number
   - Show Institution ID
   - Make information easy to copy/share

2. **User Experience**
   - Clear, organized display
   - Copy-to-clipboard functionality
   - Visual QR code display
   - Instructions for parent linking

3. **Accessibility**
   - Available on both web and mobile
   - Accessible from student profile/settings
   - Easy to find and use

---

## 🔍 Current State Analysis

### ✅ What Already Exists

1. **Backend Infrastructure**
   - ✅ User model has `qrCode` field (unique QR code string)
   - ✅ User model has `qrBadgeId` field (human-readable badge ID)
   - ✅ User model has `_id` field (MongoDB ObjectId - can be used as Student ID)
   - ✅ User model has `institutionId` field (ObjectId reference to School)
   - ✅ QR code generation service exists
   - ✅ QR code login functionality works

2. **Mobile App**
   - ✅ Profile screen exists (`mobile/lib/features/profile/screens/profile_screen.dart`)
   - ✅ Profile shows user name, role, statistics
   - ✅ Settings section exists within profile

3. **Web App**
   - ❌ No dedicated student profile page found
   - ❌ No settings page for students
   - ✅ Sidebar navigation exists
   - ✅ QR generator page exists (for teachers/admins)

### ❌ What's Missing

1. **Web Student Profile**
   - ❌ No student profile page
   - ❌ No way for students to view their QR code
   - ❌ No way for students to view their Student ID
   - ❌ No way for students to view their Institution ID

2. **Mobile Student Profile**
   - ❌ QR code not displayed in profile
   - ❌ Student ID not displayed
   - ❌ Institution ID not displayed
   - ❌ No section for parent linking information

3. **Information Display**
   - ❌ No copy-to-clipboard functionality
   - ❌ No visual QR code display
   - ❌ No instructions for parents

---

## 🏗️ Implementation Plan

### Phase 1: Backend API (If Needed)

#### 1.1 Check Current User Endpoint

**File**: `backend/src/routes/auth.routes.js` or `backend/src/controllers/auth.controller.js`

**Current Endpoint**: `GET /api/auth/profile` or `GET /api/users/:userId`

**Action**: Verify that the endpoint returns:
- `qrCode`
- `qrBadgeId`
- `_id` (Student ID)
- `institutionId` (populated with name)

**If Missing**: Update endpoint to include these fields for students.

---

### Phase 2: Web Frontend Implementation

#### 2.1 Create Student Profile Page

**File**: `web/app/profile/page.tsx` (or `web/app/student/profile/page.tsx`)

**Features**:
- Display student information
- Show QR code section
- Show Student ID section
- Show Institution ID section
- Copy-to-clipboard buttons
- Instructions for parent linking

**Layout Structure**:
```
┌─────────────────────────────────────┐
│  Student Profile                    │
├─────────────────────────────────────┤
│  [Profile Header: Name, Avatar]     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Parent Linking Information    │ │
│  ├───────────────────────────────┤ │
│  │                               │ │
│  │  QR Code:                     │ │
│  │  [QR Code Image]              │ │
│  │  Code: ABC123... [Copy]       │ │
│  │                               │ │
│  │  Student ID:                  │ │
│  │  693087623dd2b5cdd81e229a     │
│  │  [Copy]                       │ │
│  │                               │ │
│  │  Institution ID:              │ │
│  │  693087623dd2b5cdd81e229b     │
│  │  Institution Name: ABC School │
│  │  [Copy]                       │ │
│  │                               │ │
│  │  Instructions:                │ │
│  │  Share this information with  │
│  │  your parent to link accounts │
│  └───────────────────────────────┘ │
│                                     │
│  [Other Profile Sections]           │
└─────────────────────────────────────┘
```

#### 2.2 Add Profile Link to Sidebar

**File**: `web/components/layout/sidebar.tsx`

**Action**: Add "Profile" or "My Profile" link for students (and all users)

**Location**: In the sidebar navigation, visible to all authenticated users

#### 2.3 Create QR Code Display Component

**File**: `web/components/student/QRCodeDisplay.tsx` (optional, reusable)

**Features**:
- Generate QR code image from string
- Display QR code visually
- Show QR code text
- Copy-to-clipboard button
- Download QR code option (optional)

---

### Phase 3: Mobile App Implementation

#### 3.1 Update Profile Screen

**File**: `mobile/lib/features/profile/screens/profile_screen.dart`

**Changes**:
- Add new section: "Parent Linking Information"
- Display QR code (visual and text)
- Display Student ID
- Display Institution ID
- Add copy-to-clipboard functionality
- Add instructions for parents

**Location**: After profile header, before statistics cards

#### 3.2 Create QR Code Display Widget

**File**: `mobile/lib/features/profile/widgets/qr_code_display.dart` (optional, reusable)

**Features**:
- Display QR code image
- Show QR code text
- Copy-to-clipboard button
- Share functionality (optional)

---

## 📊 Data Structure

### Student Information to Display

```typescript
interface StudentLinkingInfo {
  // QR Code Information
  qrCode: string;           // e.g., "QR_STUDENT_ABC123XYZ"
  qrBadgeId: string;        // e.g., "KAVACH-5-A-ABC123"
  
  // Student Identification
  studentId: string;        // MongoDB _id, e.g., "693087623dd2b5cdd81e229a"
  
  // Institution Information
  institutionId: string;    // MongoDB _id, e.g., "693087623dd2b5cdd81e229b"
  institutionName: string;  // e.g., "ABC School"
  
  // Additional Context
  studentName: string;
  grade?: string;
  section?: string;
  classCode?: string;
}
```

---

## 🎨 UI/UX Design

### Web Design

**Section Title**: "Parent Linking Information" or "Share with Parents"

**Card Design**:
- Light blue background (`bg-blue-50`)
- Border (`border-blue-200`)
- Padding for readability
- Clear section headers

**QR Code Display**:
- QR code image (generated from `qrCode` string)
- QR code text below image
- "Copy QR Code" button
- "Download QR Code" button (optional)

**Student ID Display**:
- Label: "Student ID"
- Value: Full MongoDB ObjectId
- "Copy" button next to value
- Monospace font for ID

**Institution Display**:
- Label: "Institution"
- Value: Institution name + ID
- "Copy ID" button
- Link to institution details (optional)

**Instructions**:
- Brief text explaining how parents can use this information
- Link to parent registration/login page

### Mobile Design

**Section Design**:
- `InfoCard` widget with blue accent
- Collapsible section (optional)
- Clear visual hierarchy

**QR Code Display**:
- QR code image (centered)
- QR code text (below image)
- "Copy" button
- "Share" button (optional)

**Information Cards**:
- Use `InfoCard` or `ActionCard` for each piece of information
- Copy button on each card
- Clear labels and values

---

## 🔐 Security Considerations

### 1. Privacy Protection
- **Student ID**: Only show to the student themselves (authenticated)
- **QR Code**: Only show to the student (prevents unauthorized access)
- **Institution ID**: Safe to show (not sensitive)

### 2. Access Control
- Only students can view their own linking information
- Verify authentication before displaying
- Verify user role is 'student'

### 3. QR Code Security
- QR codes are unique per student
- QR codes can be used for login (already implemented)
- QR codes can be used for parent linking (new feature)
- Students should be advised to keep QR codes secure

---

## 📝 Implementation Details

### Web Implementation

#### Step 1: Create Profile Page

```typescript
// web/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Check, Building2, User } from 'lucide-react';
import QRCode from 'qrcode.react'; // or similar library

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [copied, setCopied] = useState<string | null>(null);

  // Copy to clipboard function
  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isAuthenticated || !user) {
    return <div>Please login</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">My Profile</h1>
          {/* Profile info */}
        </Card>

        {/* Parent Linking Information - Only for Students */}
        {user.role === 'student' && (
          <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Parent Linking Information
            </h2>
            
            {/* QR Code Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code
              </label>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                {user.qrCode && (
                  <>
                    <div className="flex justify-center mb-3">
                      <QRCode value={user.qrCode} size={200} />
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-sm bg-gray-100 p-2 rounded">
                        {user.qrCode}
                      </code>
                      <Button
                        onClick={() => copyToClipboard(user.qrCode, 'qr')}
                        variant="outline"
                        size="sm"
                      >
                        {copied === 'qr' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </>
                )}
                {user.qrBadgeId && (
                  <p className="text-xs text-gray-600 mt-2">
                    Badge ID: {user.qrBadgeId}
                  </p>
                )}
              </div>
            </div>

            {/* Student ID Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm bg-white p-3 rounded border border-gray-200">
                  {user._id}
                </code>
                <Button
                  onClick={() => copyToClipboard(user._id, 'id')}
                  variant="outline"
                  size="sm"
                >
                  {copied === 'id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Institution Section */}
            {user.institutionId && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution
                </label>
                <div className="space-y-2">
                  {typeof user.institutionId === 'object' && user.institutionId.name && (
                    <p className="text-sm text-gray-900">
                      {user.institutionId.name}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white p-3 rounded border border-gray-200">
                      {typeof user.institutionId === 'object' 
                        ? user.institutionId._id 
                        : user.institutionId}
                    </code>
                    <Button
                      onClick={() => copyToClipboard(
                        typeof user.institutionId === 'object' 
                          ? user.institutionId._id 
                          : user.institutionId,
                        'institution'
                      )}
                      variant="outline"
                      size="sm"
                    >
                      {copied === 'institution' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>How to share with parents:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                <li>Share your QR code or Student ID with your parent</li>
                <li>Parent can use this information to link your account</li>
                <li>Parent will need to login and go to "Add Child" page</li>
              </ul>
            </div>
          </Card>
        )}

        {/* Other Profile Sections */}
        {/* ... */}
      </div>
    </div>
  );
}
```

#### Step 2: Add Profile Link to Sidebar

```typescript
// web/components/layout/sidebar.tsx
// Add to navigation items:
{
  name: 'My Profile',
  href: '/profile',
  icon: User,
  roles: ['student', 'teacher', 'parent', 'admin']
}
```

#### Step 3: Install QR Code Library (if needed)

```bash
npm install qrcode.react
# or
npm install react-qr-code
```

---

### Mobile Implementation

#### Step 1: Update Profile Screen

```dart
// mobile/lib/features/profile/screens/profile_screen.dart
// Add after profile header, before statistics:

// Parent Linking Information Section (for students only)
if (user?.role == AppConstants.roleStudent) ...[
  InfoCard(
    title: 'Parent Linking Information',
    content: Column(
      children: [
        // QR Code Display
        if (user?.qrCode != null) ...[
          Text(
            'QR Code',
            style: AppTextStyles.subtitle,
          ),
          SizedBox(height: AppSpacing.sm),
          // QR Code Image (using qr_flutter package)
          QrImageView(
            data: user!.qrCode!,
            version: QrVersions.auto,
            size: 200.0,
          ),
          SizedBox(height: AppSpacing.sm),
          // QR Code Text
          Container(
            padding: EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: AppBorders.radius,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    user.qrCode!,
                    style: AppTextStyles.bodySmall.copyWith(
                      fontFamily: 'monospace',
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.copy),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: user.qrCode!));
                    SnackbarWidget.show(
                      context,
                      message: 'QR Code copied to clipboard',
                      type: SnackbarType.success,
                    );
                  },
                ),
              ],
            ),
          ),
          SizedBox(height: AppSpacing.lg),
        ],

        // Student ID
        _buildInfoRow(
          label: 'Student ID',
          value: user?.id ?? '',
          onCopy: () {
            Clipboard.setData(ClipboardData(text: user?.id ?? ''));
            SnackbarWidget.show(
              context,
              message: 'Student ID copied',
              type: SnackbarType.success,
            );
          },
        ),

        SizedBox(height: AppSpacing.md),

        // Institution ID
        if (user?.institutionId != null)
          _buildInfoRow(
            label: 'Institution ID',
            value: user!.institutionId.toString(),
            onCopy: () {
              Clipboard.setData(
                ClipboardData(text: user.institutionId.toString()),
              );
              SnackbarWidget.show(
                context,
                message: 'Institution ID copied',
                type: SnackbarType.success,
              );
            },
          ),

        SizedBox(height: AppSpacing.lg),

        // Instructions
        Container(
          padding: EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: AppColors.accentBlue.withOpacity(0.1),
            borderRadius: AppBorders.radius,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'How to share with parents:',
                style: AppTextStyles.subtitle.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: AppSpacing.sm),
              Text(
                '• Share your QR code or Student ID with your parent\n'
                '• Parent can use this to link your account\n'
                '• Parent needs to login and go to "Add Child" page',
                style: AppTextStyles.bodySmall,
              ),
            ],
          ),
        ),
      ],
    ),
  ),
  SizedBox(height: AppSpacing.lg),
],

// Helper method
Widget _buildInfoRow({
  required String label,
  required String value,
  required VoidCallback onCopy,
}) {
  return Container(
    padding: EdgeInsets.all(AppSpacing.md),
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: AppBorders.radius,
    ),
    child: Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.caption,
              ),
              SizedBox(height: AppSpacing.xs),
              Text(
                value,
                style: AppTextStyles.bodySmall.copyWith(
                  fontFamily: 'monospace',
                ),
              ),
            ],
          ),
        ),
        IconButton(
          icon: Icon(Icons.copy),
          onPressed: onCopy,
        ),
      ],
    ),
  );
}
```

#### Step 2: Install QR Code Package (if needed)

```yaml
# pubspec.yaml
dependencies:
  qr_flutter: ^4.1.0
  flutter/services.dart: # For Clipboard
```

---

## 🧪 Testing Plan

### Unit Tests

1. **Profile Page Rendering**
   - Test profile page loads for students
   - Test QR code displays correctly
   - Test Student ID displays correctly
   - Test Institution ID displays correctly

2. **Copy Functionality**
   - Test copy-to-clipboard works
   - Test success feedback displays
   - Test copied state resets

### Integration Tests

1. **End-to-End Flow**
   - Student views profile
   - Student copies QR code
   - Parent uses QR code to link
   - Verification works

### Manual Testing

1. **Web Testing**
   - Login as student
   - Navigate to profile
   - Verify all information displays
   - Test copy buttons
   - Test QR code generation

2. **Mobile Testing**
   - Login as student
   - Navigate to profile
   - Verify all information displays
   - Test copy buttons
   - Test QR code display

---

## 📋 Implementation Checklist

### Backend
- [ ] Verify user profile endpoint returns QR code, Student ID, Institution ID
- [ ] Update endpoint if needed to populate institution name
- [ ] Test endpoint with student user

### Web Frontend
- [ ] Create profile page (`/profile` or `/student/profile`)
- [ ] Add QR code display component
- [ ] Add copy-to-clipboard functionality
- [ ] Add Student ID display
- [ ] Add Institution ID display
- [ ] Add instructions section
- [ ] Add profile link to sidebar
- [ ] Install QR code library
- [ ] Test on different browsers
- [ ] Test copy functionality

### Mobile App
- [ ] Update profile screen with linking information section
- [ ] Add QR code display widget
- [ ] Add copy-to-clipboard functionality
- [ ] Add Student ID display
- [ ] Add Institution ID display
- [ ] Add instructions section
- [ ] Install QR code package
- [ ] Test on Android
- [ ] Test on iOS

### Documentation
- [ ] Update user guide
- [ ] Add screenshots
- [ ] Document copy functionality

---

## 🚀 Deployment Plan

### Phase 1: Backend Verification
1. Verify user profile endpoint
2. Test with sample student
3. Ensure all fields are returned

### Phase 2: Web Frontend
1. Create profile page
2. Add to sidebar
3. Test functionality
4. Deploy to staging

### Phase 3: Mobile App
1. Update profile screen
2. Test on devices
3. Deploy update

### Phase 4: Rollout
1. Enable for all students
2. Monitor usage
3. Gather feedback

---

## 📈 Success Metrics

1. **Adoption Rate**
   - % of students who view their profile
   - % of students who copy QR code/Student ID
   - Number of parent links using displayed information

2. **User Satisfaction**
   - Student feedback on ease of use
   - Parent feedback on linking process
   - Support tickets related to linking

---

## 🔄 Future Enhancements

1. **QR Code Generation**
   - Generate QR code if student doesn't have one
   - Regenerate QR code option
   - Download QR code as image

2. **Sharing Features**
   - Share QR code via WhatsApp/Email
   - Generate shareable link
   - QR code expiration (optional)

3. **Parent Instructions**
   - In-app tutorial
   - Video guide
   - Step-by-step instructions

---

## ✅ Conclusion

This plan provides a comprehensive approach to displaying student linking information in profile/settings pages. The implementation will make it easy for students to share their QR code, Student ID, and Institution ID with parents for account linking.

**Next Steps**:
1. Review and approve this plan
2. Start with backend verification
3. Implement web frontend
4. Implement mobile app updates
5. Test and deploy

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Author**: Development Team  
**Status**: 📋 Awaiting Approval

