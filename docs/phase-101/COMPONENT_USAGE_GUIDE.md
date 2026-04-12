# Phase 101.10.5: Component Usage Guide

**Date:** Current Session  
**Purpose:** Comprehensive guide for using the design system components

---

## 📚 **Overview**

This guide provides examples and best practices for using the Phase 101 component library in the KAVACH mobile application.

---

## 🎨 **Design System**

### **Importing the Design System**

```dart
import 'package:your_app/core/design/design_system.dart';
```

Or import specific parts:

```dart
import 'package:your_app/core/design/colors.dart';
import 'package:your_app/core/design/typography.dart';
import 'package:your_app/core/design/spacing.dart';
```

### **Using Colors**

```dart
// Primary colors
Container(color: AppColors.primaryGreen)
Container(color: AppColors.primaryRed) // Crisis mode

// Status colors
Container(color: AppColors.success)
Container(color: AppColors.error)
Container(color: AppColors.warning)
Container(color: AppColors.info)

// Background colors
Container(color: AppColors.backgroundLight)
Container(color: AppColors.backgroundWhite)

// Text colors
Text('Hello', style: TextStyle(color: AppColors.textPrimary))
Text('Subtitle', style: TextStyle(color: AppColors.textSecondary))
```

### **Using Typography**

```dart
// Headings
Text('Heading 1', style: AppTextStyles.h1)
Text('Heading 2', style: AppTextStyles.h2)
Text('Heading 3', style: AppTextStyles.h3)

// Body text
Text('Body text', style: AppTextStyles.bodyMedium)
Text('Small text', style: AppTextStyles.bodySmall)

// Buttons
Text('Button', style: AppTextStyles.buttonMedium)

// Customization
Text('Custom', style: AppTextStyles.h4.copyWith(
  color: AppColors.primaryGreen,
  fontWeight: FontWeight.bold,
))
```

### **Using Spacing**

```dart
// Padding
Padding(
  padding: AppSpacing.card, // Card padding
  padding: AppSpacing.screenEdge, // Screen edge padding
  padding: EdgeInsets.all(AppSpacing.md), // Medium spacing
)

// Margins
SizedBox(height: AppSpacing.md)
SizedBox(width: AppSpacing.sm)

// Spacing constants
AppSpacing.xs  // 4
AppSpacing.sm  // 8
AppSpacing.md  // 16
AppSpacing.lg  // 24
AppSpacing.xl  // 32
AppSpacing.xxl // 48
```

---

## 🔘 **Buttons**

### **Primary Button**

```dart
PrimaryButton(
  label: 'Submit',
  onPressed: () {
    // Handle action
  },
  icon: Icons.check,
  size: ButtonSize.large,
  fullWidth: true,
)
```

### **Emergency Button**

```dart
EmergencyButton(
  label: 'NEED HELP',
  onPressed: _handleEmergency,
  icon: Icons.emergency,
  pulse: true, // Pulsing animation
  size: ButtonSize.large,
)
```

### **Outlined Button**

```dart
OutlinedButtonCustom(
  label: 'Cancel',
  onPressed: () {},
  icon: Icons.close,
  borderColor: AppColors.primaryGreen,
  size: ButtonSize.medium,
)
```

---

## 📦 **Cards**

### **Info Card**

```dart
InfoCard(
  title: 'Module Title',
  subtitle: 'Module description',
  leadingIcon: Icons.school,
  content: Column(
    children: [
      Text('Additional content'),
    ],
  ),
)
```

### **Action Card**

```dart
ActionCard(
  title: 'Start Drill',
  subtitle: 'Begin fire safety drill',
  leadingIcon: Icons.local_fire_department,
  onTap: () {
    // Navigate or action
  },
)
```

### **Stat Card**

```dart
StatCard(
  label: 'Score',
  value: '85',
  icon: Icons.star,
  color: AppColors.success,
)
```

---

## 📝 **Inputs**

### **Text Input**

```dart
TextInputCustom(
  label: 'Email',
  hint: 'Enter your email',
  keyboardType: TextInputType.emailAddress,
  validator: (value) {
    if (value == null || value.isEmpty) {
      return 'Email is required';
    }
    return null;
  },
)
```

### **Password Input**

```dart
PasswordInput(
  label: 'Password',
  hint: 'Enter password',
  validator: (value) {
    if (value == null || value.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return null;
  },
)
```

---

## 🔄 **States**

### **Loading State**

```dart
LoadingState(
  message: 'Loading data...',
  fullScreen: false,
)

// With skeleton loader
SkeletonCard(lines: 3)
SkeletonBox(width: 200, height: 20)
```

### **Error State**

```dart
ErrorState(
  title: 'Error Loading',
  message: 'Failed to load data. Please try again.',
  onRetry: () {
    // Retry logic
  },
  fullScreen: true,
)
```

### **Empty State**

```dart
EmptyState(
  icon: Icons.inbox,
  title: 'No Items',
  message: 'There are no items to display.',
  actionLabel: 'Add Item',
  onAction: () {
    // Action logic
  },
)
```

---

## 📱 **Layouts**

### **Screen Layout**

```dart
ScreenLayout(
  padding: EdgeInsets.all(AppSpacing.md),
  child: Column(
    children: [
      // Screen content
    ],
  ),
)
```

### **Responsive Layout**

```dart
ResponsiveLayout(
  mobile: MobileView(),
  tablet: TabletView(),
  desktop: DesktopView(),
)
```

### **Responsive Container**

```dart
ResponsiveContainer(
  constrainWidth: true,
  child: Content(),
)
```

---

## 🎯 **Best Practices**

### **1. Always Use Design System**

```dart
// ✅ Good
Text('Hello', style: AppTextStyles.h3)

// ❌ Bad
Text('Hello', style: TextStyle(fontSize: 24))
```

### **2. Use Consistent Spacing**

```dart
// ✅ Good
SizedBox(height: AppSpacing.md)

// ❌ Bad
SizedBox(height: 15)
```

### **3. Use Components Instead of Custom Widgets**

```dart
// ✅ Good
PrimaryButton(label: 'Submit', onPressed: () {})

// ❌ Bad
ElevatedButton(
  child: Text('Submit'),
  onPressed: () {},
  style: ElevatedButton.styleFrom(...), // Custom styling
)
```

### **4. Handle States Properly**

```dart
// ✅ Good
if (isLoading) {
  return LoadingState(message: 'Loading...');
} else if (error != null) {
  return ErrorState(message: error, onRetry: retry);
} else {
  return Content();
}
```

### **5. Use Responsive Utilities**

```dart
// ✅ Good
final padding = ResponsiveUtils.responsive(
  context: context,
  mobile: 16.0,
  tablet: 32.0,
  desktop: 48.0,
);
```

---

## 📖 **Complete Example**

```dart
import 'package:flutter/material.dart';
import 'package:your_app/core/widgets/widgets.dart';
import 'package:your_app/core/design/design_system.dart';

class ExampleScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ScreenLayout(
      child: Column(
        children: [
          Text('Title', style: AppTextStyles.h2),
          SizedBox(height: AppSpacing.md),
          
          InfoCard(
            title: 'Information',
            content: Text('Content here'),
          ),
          
          SizedBox(height: AppSpacing.lg),
          
          PrimaryButton(
            label: 'Submit',
            onPressed: () {},
            fullWidth: true,
          ),
        ],
      ),
    );
  }
}
```

---

## 🔗 **Additional Resources**

- Design System: `mobile/lib/core/design/design_system.dart`
- Component Library: `mobile/lib/core/widgets/widgets.dart`
- Utilities: `mobile/lib/core/utils/utils.dart`
- Page Transitions: `mobile/lib/core/navigation/page_transitions.dart`

---

## ✅ **Quick Reference**

| Component | Import Path |
|-----------|-------------|
| All Components | `core/widgets/widgets.dart` |
| Design System | `core/design/design_system.dart` |
| Utilities | `core/utils/utils.dart` |
| Page Transitions | `core/navigation/page_transitions.dart` |

