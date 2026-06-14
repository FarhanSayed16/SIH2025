# Phase 3.3.3: Badge System - Implementation Plan

## Overview
Implement a comprehensive badge system to motivate students with achievements and rewards.

## Current Status
- ✅ Badge Model exists (`backend/src/models/Badge.js`)
- ✅ Badge Service exists (`backend/src/services/badge.service.js`)
- ✅ User model has `progress.badges` array
- ❌ No badge API endpoints (controllers/routes)
- ❌ No badge history tracking
- ❌ No mobile UI implementation
- ❌ Badge checking not integrated into completion triggers

## Implementation Tasks

### Backend Tasks

#### 1. Badge History Tracking
- [ ] Create BadgeHistory model to track when badges were awarded
- [ ] Fields: userId, badgeId, awardedAt, xpEarned, triggerType

#### 2. Badge API Endpoints
- [ ] Create badge controller (`backend/src/controllers/badge.controller.js`)
  - GET `/api/badges` - Get all available badges (with filters)
  - GET `/api/badges/my-badges` - Get current user's badges
  - GET `/api/badges/:badgeId` - Get specific badge details
  - GET `/api/badges/my-badges/history` - Get badge award history
  - POST `/api/badges/:badgeId/award` - Manually award badge (admin/teacher)
- [ ] Create badge routes (`backend/src/routes/badge.routes.js`)
- [ ] Register routes in `server.js`

#### 3. Integrate Badge Checking
- [ ] Add badge checking to module completion (`module.controller.js`)
- [ ] Add badge checking to game completion (`game.controller.js`)
- [ ] Add badge checking to drill acknowledgment
- [ ] Add badge checking to login streak updates

#### 4. Badge Seed Data
- [ ] Create badge seeding script with example badges:
  - Fire Marshal (complete all fire modules)
  - Earthquake Expert (5 wins in Earthquake Shake)
  - Quick Responder (drill under 10 seconds)
  - Hazard Detective (found all hazards)
  - Streak Master (30-day login streak)
  - Module Master (complete all modules)

### Mobile Tasks

#### 1. Badge Models
- [ ] Create badge model (`mobile/lib/features/badges/models/badge_model.dart`)
- [ ] Create badge history model

#### 2. Badge Service
- [ ] Create badge service (`mobile/lib/features/badges/services/badge_service.dart`)
  - `getAllBadges()` - Fetch all badges
  - `getMyBadges()` - Get user's earned badges
  - `getBadgeHistory()` - Get award history
  - `getBadgeById()` - Get specific badge

#### 3. Badge Provider
- [ ] Create Riverpod provider for badge state management
- [ ] Implement caching and refresh logic

#### 4. Badge UI Screens
- [ ] Badge Collection Screen (`badge_collection_screen.dart`)
  - Display all available badges
  - Show earned vs. unearned badges
  - Filter by category
  - Search functionality
- [ ] Badge Detail Screen (`badge_detail_screen.dart`)
  - Show badge details
  - Progress toward earning badge
  - Award history if earned

#### 5. Badge Display Components
- [ ] Badge card widget for displaying badges
- [ ] Badge grid widget for collection view
- [ ] Badge notification overlay (when badge is earned)

#### 6. Profile Integration
- [ ] Display badges on user profile
- [ ] Show badge count and recent badges

#### 7. Badge Notifications
- [ ] Show notification when badge is earned
- [ ] Badge animation on award
- [ ] Sound effect (optional)

### Testing Tasks
- [ ] Test badge API endpoints
- [ ] Test badge awarding logic
- [ ] Test badge history tracking
- [ ] Test mobile UI screens
- [ ] Test badge notifications
- [ ] Test badge integration with module/game completion

## API Endpoints

### GET `/api/badges`
Query parameters:
- `category` - Filter by category
- `gradeLevel` - Filter by grade level
- `isActive` - Filter active badges only

### GET `/api/badges/my-badges`
Returns badges earned by authenticated user

### GET `/api/badges/:badgeId`
Get specific badge details

### GET `/api/badges/my-badges/history`
Get badge award history with pagination

### POST `/api/badges/:badgeId/award`
Manually award badge (admin/teacher only)
Body: `{ userId: string }` (optional, defaults to current user)

## Badge Categories
- `module` - Module completion badges
- `game` - Game performance badges
- `drill` - Drill participation badges
- `streak` - Login streak badges
- `achievement` - General achievement badges
- `special` - Special event or rare badges

## Implementation Order
1. Backend: Badge History Model
2. Backend: Badge API Endpoints
3. Backend: Integrate badge checking
4. Backend: Badge seed data
5. Mobile: Models and Service
6. Mobile: Provider
7. Mobile: Badge Collection Screen
8. Mobile: Badge Detail Screen
9. Mobile: Profile Integration
10. Mobile: Badge Notifications
11. Testing

## Timeline
Estimated: 1-2 weeks
- Backend: 3-4 days
- Mobile: 4-5 days
- Testing: 1-2 days

