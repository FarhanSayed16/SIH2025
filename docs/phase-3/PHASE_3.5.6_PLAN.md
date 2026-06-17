# Phase 3.5.6: Content & Game Analytics - Implementation Plan

**Date**: 2025-01-27  
**Status**: 📋 **PLANNING**

---

## 🎯 **Objectives**

Enhance analytics to track detailed content and game performance metrics:
- Game attempt count
- Module completion rate
- Quiz accuracy
- Drill participation time
- Hazard recognition accuracy
- Streaks (consecutive completions)

---

## 📋 **Features to Implement**

### **Event Logging**
- Track module views
- Track game attempts
- Track quiz attempts
- Track drill participation
- Track hazard recognition events
- Track streak information

### **Analytics Aggregation**
- Game attempt statistics
- Module completion rates over time
- Quiz accuracy trends
- Drill participation metrics
- Hazard recognition accuracy
- Streak calculations

### **Web Dashboard**
- Game analytics charts
- Content completion charts
- Quiz accuracy charts
- Drill participation charts
- Streak visualizations

---

## 🏗️ **Implementation Tasks**

### **Backend Tasks**

1. **Event Log Model** (`backend/src/models/EventLog.js`)
   - Track user actions (view, complete, attempt)
   - Store event metadata
   - Support different event types

2. **Event Logging Service** (`backend/src/services/eventLog.service.js`)
   - Log events
   - Batch event insertion
   - Event querying

3. **Content & Game Analytics Service** (`backend/src/services/contentGameAnalytics.service.js`)
   - Game attempt aggregation
   - Module completion tracking
   - Quiz accuracy calculation
   - Drill participation metrics
   - Hazard recognition accuracy
   - Streak calculation

4. **Analytics Controller Enhancements** (`backend/src/controllers/contentGameAnalytics.controller.js`)
   - GET `/api/analytics/content/game-attempts`
   - GET `/api/analytics/content/module-completion`
   - GET `/api/analytics/content/quiz-accuracy`
   - GET `/api/analytics/content/drill-participation`
   - GET `/api/analytics/content/hazard-accuracy`
   - GET `/api/analytics/content/streaks`

5. **Routes** (`backend/src/routes/contentGameAnalytics.routes.js`)
   - Register new analytics endpoints

### **Web Tasks**

1. **Content & Game Analytics Page** (`web/app/analytics/content/page.tsx`)
   - Game attempts dashboard
   - Module completion charts
   - Quiz accuracy visualization
   - Drill participation metrics
   - Hazard recognition stats
   - Streak displays

2. **Analytics Components**
   - Game attempt chart component
   - Completion rate chart component
   - Accuracy trend component
   - Streak visualization component

3. **API Client** (`web/lib/api/contentGameAnalytics.ts`)
   - API methods for new endpoints

---

## 📊 **Metrics to Track**

### **Game Metrics**
- Total game attempts
- Unique players
- Average attempts per player
- Success rate
- Average score
- Time spent

### **Content Metrics**
- Module views
- Module completions
- Completion rate
- Average time to complete
- Drop-off points

### **Quiz Metrics**
- Total quiz attempts
- Average accuracy
- Accuracy by module
- Improvement over time

### **Drill Metrics**
- Participation count
- Average participation time
- Completion rate
- Response time

### **Hazard Recognition**
- Total hazards identified
- Accuracy rate
- False positives
- Improvement over time

### **Streaks**
- Current streak
- Longest streak
- Streak breakers
- Streak by category

---

## ✅ **Success Criteria**

- [ ] Event log system implemented
- [ ] All metrics tracked
- [ ] Analytics aggregation working
- [ ] API endpoints functional
- [ ] Web charts displaying data
- [ ] Real-time updates (optional)

---

**Status**: 📋 **Ready to Start**

