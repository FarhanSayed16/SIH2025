# Hackathon: Calculations & Formulas Documentation

## 📊 **Preparedness Score System**

### **Main Formula**

The Preparedness Score is a comprehensive metric (0-100) that measures a student's overall disaster preparedness level. It combines multiple learning activities with weighted contributions:

```
PreparednessScore = 
  (Module Completion × 0.40) + 
  (Game Performance × 0.25) + 
  (Quiz Accuracy × 0.20) + 
  (Drill Participation × 0.10) + 
  (Login Streak × 0.05)
```

**Total Weight**: 100% (40% + 25% + 20% + 10% + 5%)

Each component is normalized to a 0-100 scale before applying weights.

---

## 🎯 **Component Calculations**

### **1. Module Completion Score (40% Weight)**

**Purpose**: Measures completion of educational modules (NDMA, NDRF, Hearing Impaired)

**Formula**:
```
ModuleScore = 
  (NDMA Completion Rate × 0.50) + 
  (NDRF Completion Rate × 0.30) + 
  (Hearing Impaired Completion Rate × 0.20)
```

**Sub-formulas**:
- **NDMA Completion Rate** = `(Completed NDMA Modules / Total NDMA Modules) × 100`
- **NDRF Completion Rate** = `(Completed NDRF Modules / Total NDRF Modules) × 100`
- **Hearing Impaired Completion Rate** = `(Completed HI Modules / Total HI Modules) × 100`

**Module Completion Criteria**:
- A module is considered "completed" when **all videos** in that module are watched
- Video progress is tracked individually and persisted locally

**Example**:
- NDMA: 8/10 modules completed = 80%
- NDRF: 2/5 modules completed = 40%
- HI: 1/1 modules completed = 100%
- **ModuleScore** = (80 × 0.50) + (40 × 0.30) + (100 × 0.20) = 40 + 12 + 20 = **72**

**Contribution to Preparedness Score**: 72 × 0.40 = **28.8 points**

---

### **2. Game Performance Score (25% Weight)**

**Purpose**: Measures average performance across all educational games

**Formula**:
```
GameScore = Average of (Score / MaxScore × 100) for all games
```

**Calculation Steps**:
1. For each game played: `Performance = (Score / MaxScore) × 100`
2. If `MaxScore = 0`, normalize score to 0-100 scale directly
3. Calculate average: `GameScore = Sum(Performance) / Count(Games)`
4. Clamp result to 0-100 range

**Games Included**:
- Bag Packer
- Hazard Hunter
- Earthquake Shake
- School Runner
- Flood Escape
- Punjab Safety
- School Safety Quiz
- Fire Extinguisher AR
- Web Games

**Example**:
- Game 1: 850/1000 = 85%
- Game 2: 720/800 = 90%
- Game 3: 450/500 = 90%
- **GameScore** = (85 + 90 + 90) / 3 = **88.33**

**Contribution to Preparedness Score**: 88.33 × 0.25 = **22.08 points**

---

### **3. Quiz Accuracy Score (20% Weight)**

**Purpose**: Measures average quiz performance across all module quizzes

**Formula**:
```
QuizScore = Average of all quiz scores (0-100)
```

**Quiz Score Calculation** (per quiz):
```
QuizScore = (Total Points Earned / Total Points Possible) × 100
```

**Points System**:
- Each question has a point value
- Correct answer = full points
- Incorrect answer = 0 points
- Passing threshold = 70% (configurable per module)

**Example**:
- Quiz 1: 85/100 = 85%
- Quiz 2: 92/100 = 92%
- Quiz 3: 78/100 = 78%
- **QuizScore** = (85 + 92 + 78) / 3 = **85**

**Contribution to Preparedness Score**: 85 × 0.20 = **17 points**

---

### **4. Drill Participation Score (10% Weight)**

**Purpose**: Measures participation in emergency drills and response speed

**Formula**:
```
DrillScore = (Participation Score × 0.70) + (Response Time Score × 0.30)
```

**Sub-formulas**:

**Participation Score**:
```
Participation Score = (Participated Drills / Total Available Drills) × 100
```
- Clamped to 0-100
- Based on drills in last 90 days

**Response Time Score** (faster = better):
```
If avgResponseTime < 30s:  ResponseTimeScore = 100
If avgResponseTime < 60s:  ResponseTimeScore = 80
If avgResponseTime < 120s: ResponseTimeScore = 60
If avgResponseTime ≥ 120s: ResponseTimeScore = 40
```

**Example**:
- Participated: 8/10 drills = 80%
- Avg response time: 45 seconds = 80 points
- **DrillScore** = (80 × 0.70) + (80 × 0.30) = 56 + 24 = **80**

**Contribution to Preparedness Score**: 80 × 0.10 = **8 points**

---

### **5. Login Streak Score (5% Weight)**

**Purpose**: Rewards consistent daily engagement

**Formula** (converted from streak days to 0-100 score):
```
If streak = 0:        StreakScore = 0
If streak < 7 days:   StreakScore = (streak / 7) × 50
If streak < 30 days:  StreakScore = 50 + ((streak - 7) / 23) × 30
If streak ≥ 30 days:  StreakScore = 80 + ((streak - 30) / 30) × 20 (clamped to 100)
```

**Streak Calculation**:
- Increments when user logs in on consecutive days
- Resets to 0 if user misses a day
- Tracks `lastLoginDate` to detect consecutive logins

**Example**:
- Streak: 15 days
- **StreakScore** = 50 + ((15 - 7) / 23) × 30 = 50 + 10.43 = **60.43**

**Contribution to Preparedness Score**: 60.43 × 0.05 = **3.02 points**

---

## 🎮 **XP (Experience Points) Calculation**

### **Base XP Formula**

XP is calculated for each game completion:

```
BaseXP = floor(Score / 10)
```

### **Difficulty Multiplier**

```
Easy:   1.0x
Medium: 1.5x
Hard:   2.0x
```

### **Bonus XP**

1. **Perfect Score Bonus**: +50 XP
   - Triggered when: `Score >= MaxScore` and `MaxScore > 0`

2. **Speed Bonus**: +10 XP
   - Triggered when: `TimeTaken < 60 seconds`

### **Final XP Formula**

```
XP = floor(BaseXP × DifficultyMultiplier) + PerfectBonus + SpeedBonus
```

**Example**:
- Score: 850
- MaxScore: 1000
- Difficulty: Medium (1.5x)
- TimeTaken: 45 seconds

**Calculation**:
- BaseXP = floor(850 / 10) = 85
- With multiplier = 85 × 1.5 = 127.5 → **127 XP**
- Perfect bonus: No (850 < 1000)
- Speed bonus: Yes (+10 XP)
- **Total XP** = 127 + 10 = **137 XP**

---

## 📈 **Score Update Triggers**

The Preparedness Score is recalculated automatically when:

1. **Module Completion**: When all videos in a module are watched
2. **Game Score Submission**: When a game is completed and score is submitted
3. **Quiz Completion**: When a quiz is submitted
4. **Drill Participation**: When a drill is acknowledged/completed
5. **Daily Login**: When user logs in (updates streak)
6. **Manual Recalculation**: Via API endpoint `/api/scores/recalculate/:userId`

**Real-time Updates**:
- Mobile app uses Hive listeners to detect changes
- Local score calculated immediately (optimistic update)
- Backend score synced in background
- UI updates instantly without waiting for API

---

## 🔄 **Offline-First Architecture**

### **Local Score Calculation**

The mobile app calculates scores locally from Hive storage:

1. **Module Score**: Reads from `completedModulesBox`
2. **Game Score**: Reads from `gameScoresBox`
3. **Quiz Score**: Reads from `quizResultsBox`
4. **Drill Score**: Reads from `drillLogsBox`
5. **Streak Score**: Reads from `userBox` → `progress.loginStreak`

### **Sync Strategy**

- **Optimistic Updates**: Local score shown immediately
- **Background Sync**: Backend score fetched and merged
- **Conflict Resolution**: Backend is source of truth
- **Offline Support**: Scores saved locally, synced when online

---

## 📊 **Example: Complete Score Calculation**

### **Input Data**:
- **Modules**: NDMA 8/10, NDRF 2/5, HI 1/1
- **Games**: 3 games with performances 85%, 90%, 90%
- **Quizzes**: 3 quizzes with scores 85%, 92%, 78%
- **Drills**: 8/10 participated, avg response 45s
- **Streak**: 15 days

### **Component Scores**:

1. **Module Score**:
   - NDMA: 80%, NDRF: 40%, HI: 100%
   - Weighted: (80 × 0.5) + (40 × 0.3) + (100 × 0.2) = **72**

2. **Game Score**:
   - Average: (85 + 90 + 90) / 3 = **88.33**

3. **Quiz Score**:
   - Average: (85 + 92 + 78) / 3 = **85**

4. **Drill Score**:
   - Participation: 80%, Response: 80
   - Combined: (80 × 0.7) + (80 × 0.3) = **80**

5. **Streak Score**:
   - 15 days → 50 + ((15-7)/23) × 30 = **60.43**

### **Final Preparedness Score**:

```
Total = (72 × 0.40) + (88.33 × 0.25) + (85 × 0.20) + (80 × 0.10) + (60.43 × 0.05)
      = 28.8 + 22.08 + 17 + 8 + 3.02
      = 78.9
      ≈ 79 (rounded)
```

**Final Score**: **79/100**

---

## 🎯 **Key Design Decisions**

### **Why These Weights?**

1. **Module Completion (40%)**: 
   - Highest weight because knowledge acquisition is primary goal
   - Educational content is core value proposition

2. **Game Performance (25%)**:
   - Second highest - gamification encourages engagement
   - Practical application of knowledge

3. **Quiz Accuracy (20%)**:
   - Validates understanding of module content
   - Ensures knowledge retention

4. **Drill Participation (10%)**:
   - Important but less frequent activity
   - Real-world preparedness practice

5. **Login Streak (5%)**:
   - Encourages daily engagement
   - Small weight to avoid gaming the system

### **Why Normalize to 0-100?**

- Consistent scale across all components
- Easy to understand (percentage-based)
- Simple weighted average calculation
- Clear progress visualization

### **Why Offline-First?**

- Works in areas with poor connectivity
- Instant feedback improves UX
- Reduces server load
- Better user experience

---

## 🔧 **Technical Implementation**

### **Backend Calculation**
- Location: `backend/src/services/preparednessScore.service.js`
- Database: MongoDB
- Real-time: Triggers on activity completion

### **Mobile Calculation**
- Location: `mobile/lib/features/score/services/local_score_calculator.dart`
- Storage: Hive (local database)
- State Management: Riverpod providers
- Real-time: Hive listeners for auto-updates

### **API Endpoints**

```
GET  /api/scores/preparedness/:userId?  - Get current score
POST /api/scores/recalculate/:userId?  - Force recalculation
GET  /api/scores/history/:userId?      - Get score history
```

---

## 📝 **Notes for Judges**

1. **Transparency**: All formulas are documented and consistent across backend and mobile
2. **Fairness**: Weights are balanced to reward comprehensive learning
3. **Engagement**: Multiple activity types prevent gaming the system
4. **Real-time**: Scores update instantly for better user experience
5. **Offline Support**: System works without internet connection
6. **Scalability**: Efficient calculation using aggregation and caching
7. **Accuracy**: Backend is source of truth, local is optimistic update

---

## 🚀 **Future Enhancements**

Potential improvements:
- Adaptive weights based on user performance
- Time-decay for older activities
- Difficulty-adjusted scoring
- Peer comparison metrics
- Predictive analytics for preparedness

---

---

## 🌐 **AR/VR & Geospatial Calculations**

### **1. Haversine Distance Formula**

**Purpose**: Calculate distance between two GPS coordinates (used for AR navigation, finding nearest safe zones, geofence matching)

**Formula**:
```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlng/2)
c = 2 × atan2(√a, √(1-a))
distance = R × c
```

Where:
- `R` = Earth's radius = 6,371,000 meters
- `Δlat` = lat2 - lat1 (in radians)
- `Δlng` = lng2 - lng1 (in radians)
- Result is in **meters**

**Implementation**:
```javascript
const R = 6371000; // Earth radius in meters
const dLat = (lat2 - lat1) * Math.PI / 180;
const dLng = (lng2 - lng1) * Math.PI / 180;
const a = 
  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
  Math.sin(dLng / 2) * Math.sin(dLng / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
return R * c; // Distance in meters
```

**Example**:
- Point 1: 28.6139°N, 77.2090°E (Delhi)
- Point 2: 19.0760°N, 72.8777°E (Mumbai)
- **Distance**: ~1,404,000 meters = **1,404 km**

---

### **2. Bearing Calculation (Direction)**

**Purpose**: Calculate compass bearing between two points for AR navigation

**Formula**:
```
y = sin(Δlng) × cos(lat2)
x = cos(lat1) × sin(lat2) - sin(lat1) × cos(lat2) × cos(Δlng)
bearing = atan2(y, x) × 180/π
bearing = (bearing + 360) % 360
```

**Result**: Bearing in degrees (0° = North, 90° = East, 180° = South, 270° = West)

**Direction Mapping**:
- 0-22.5° or 337.5-360°: North
- 22.5-67.5°: Northeast
- 67.5-112.5°: East
- 112.5-157.5°: Southeast
- 157.5-202.5°: South
- 202.5-247.5°: Southwest
- 247.5-292.5°: West
- 292.5-337.5°: Northwest

---

### **3. AR Navigation Walking Time Estimation**

**Purpose**: Estimate time to reach destination for AR navigation

**Formula**:
```
EstimatedTime = TotalDistance / WalkingSpeed
```

Where:
- `WalkingSpeed` = 1.4 m/s (average human walking speed)
- `TotalDistance` = Sum of distances between all waypoints (in meters)
- Result in **seconds**, converted to minutes for display

**Example**:
- Total distance: 280 meters
- **Estimated time** = 280 / 1.4 = **200 seconds** = **3.3 minutes**

---

### **4. Geofence Matching**

**Purpose**: Check if a school location is within an alert's affected area

**Formula**:
```
distanceKm = calculateDistance(schoolLat, schoolLng, alertLat, alertLng) / 1000
isAffected = distanceKm <= maxRadiusKm
```

Where:
- `maxRadiusKm` = Maximum affected radius (default: 50 km)
- Uses Haversine formula for distance calculation

**Example**:
- School: 28.6139°N, 77.2090°E
- Alert location: 28.6200°N, 77.2100°E
- Distance: ~700 meters = 0.7 km
- Max radius: 50 km
- **Result**: `isAffected = true` (0.7 ≤ 50)

---

## 🤖 **AI/ML Prediction Models**

### **1. Student Risk Score Prediction**

**Purpose**: Predict which students might need help during emergencies (0-100 scale, higher = higher risk)

**Formula**:
```
RiskScore = min(
  ResponseTimeRisk + 
  ModuleRisk + 
  QuizRisk + 
  ParticipationRisk + 
  AgeRisk + 
  LocationRisk,
  100
)
```

**Component Calculations**:

1. **Response Time Risk** (Max 30 points):
   ```
   ResponseTimeRisk = min((avgEvacuationTime / 600) × 30, 30)
   ```
   - Slower evacuation = higher risk
   - 600 seconds (10 min) = 30 points

2. **Module Completion Risk** (Max 20 points):
   ```
   ModuleRisk = max(0, (100 - moduleCompletionRate) / 100) × 20
   ```
   - Lower completion = higher risk

3. **Quiz Performance Risk** (Max 20 points):
   ```
   QuizRisk = max(0, (100 - avgQuizAccuracy) / 100) × 20
   ```
   - Lower accuracy = higher risk

4. **Participation Risk** (Max 15 points):
   ```
   ParticipationRisk = max(0, (100 - participationRate) / 100) × 15
   ```
   - Lower participation = higher risk

5. **Age Factor** (Max 30 points):
   ```
   If grade < 5:  AgeRisk = 30
   If grade < 9:  AgeRisk = 20
   If grade ≥ 9:  AgeRisk = 10
   ```
   - Younger students = higher risk

6. **Location Risk** (10 points):
   - Default: 10 points
   - Can be enhanced with location-based risk assessment

**Risk Level Categorization**:
- `riskScore ≥ 70`: **High Risk**
- `40 ≤ riskScore < 70`: **Medium Risk**
- `riskScore < 40`: **Low Risk**

**Example**:
- Avg evacuation time: 450s → 22.5 points
- Module completion: 60% → 8 points
- Quiz accuracy: 70% → 6 points
- Participation: 50% → 7.5 points
- Grade: 3 → 30 points
- Location: 10 points
- **Total Risk Score**: 84 → **High Risk**

---

### **2. Drill Performance Prediction**

**Purpose**: Predict response time and participation rate for upcoming drills

**Formula**:
```
PredictedResponseTime = HistoricalAvgResponseTime × DayFactor × TimeFactor
PredictedParticipationRate = max(50, min(100, HistoricalAvgParticipation × (1 / DayFactor) × 0.98))
```

**Day Factor**:
```
If weekday (Mon-Fri):  DayFactor = 0.95  (5% faster)
If weekend:             DayFactor = 1.1   (10% slower)
```

**Time Factor**:
```
If 8:00-10:00 (morning rush):  TimeFactor = 1.15  (15% slower)
If 14:00-16:00 (afternoon):    TimeFactor = 1.1   (10% slower)
Otherwise (off-peak):          TimeFactor = 0.95  (5% faster)
```

**Confidence Score**:
```
Confidence = min(historicalDrillCount / 10, 1.0)
```
- More historical data = higher confidence
- Max confidence: 1.0 (100%)

**Example**:
- Historical avg response: 300 seconds
- Historical avg participation: 80%
- Day: Tuesday (weekday) → DayFactor = 0.95
- Time: 9:00 AM (morning rush) → TimeFactor = 1.15
- Historical drills: 15 → Confidence = min(15/10, 1.0) = 1.0

**Prediction**:
- **Response Time**: 300 × 0.95 × 1.15 = **327 seconds** (5.5 minutes)
- **Participation**: max(50, min(100, 80 × (1/0.95) × 0.98)) = **82%**
- **Confidence**: **100%**

---

### **3. Anomaly Detection (Z-Score Method)**

**Purpose**: Detect unusual patterns in drill performance using statistical analysis

**Formula**:

**Step 1: Calculate Mean (Average)**
```
μ = (Σ values) / n
```

**Step 2: Calculate Variance**
```
σ² = Σ(value - μ)² / n
```

**Step 3: Calculate Standard Deviation**
```
σ = √σ²
```

**Step 4: Calculate Z-Score for Each Data Point**
```
Z = |value - μ| / σ
```

**Step 5: Detect Anomaly**
```
If Z > 2:  Anomaly detected (Medium severity)
If Z > 3:  Anomaly detected (High severity)
```

**Anomaly Types**:
- **Participation Anomaly**: Z-score > 2 for participation rate
- **Response Time Anomaly**: Z-score > 2 for response time
- **Both**: Both metrics have Z-score > 2

**Example**:
- Participation rates: [80, 82, 78, 85, 45, 79, 81]
- Mean (μ): 73.0
- Standard Deviation (σ): 13.2
- Value 45: Z = |45 - 73| / 13.2 = **2.12** → **Anomaly detected** (Medium)

---

### **4. Student Progress Forecasting**

**Purpose**: Predict student engagement and progress over next 30 days

**Formula**:

**Engagement Rate**:
```
EngagementRate = RecentEventsCount / 30 days
```

**Forecasted Completions**:
```
PredictedModuleCompletions = EngagementRate × 0.3 × 30
PredictedQuizCompletions = EngagementRate × 0.2 × 30
PredictedEngagementDays = EngagementRate × 30
```

**Confidence**:
```
Confidence = min(RecentEventsCount / 50, 1.0)
```

**Trend Analysis**:
- **Increasing**: Recent events show upward trend
- **Stable**: Consistent activity
- **Decreasing**: Recent events show downward trend

**Example**:
- Recent events (30 days): 45 events
- Engagement rate: 45 / 30 = **1.5 events/day**
- **Forecast (30 days)**:
  - Module completions: 1.5 × 0.3 × 30 = **13.5** ≈ **14 modules**
  - Quiz completions: 1.5 × 0.2 × 30 = **9 quizzes**
  - Engagement days: 1.5 × 30 = **45 days**
- **Confidence**: min(45/50, 1.0) = **0.9** (90%)

---

## 🏫 **School-Level Calculations**

### **School Preparedness Score**

**Purpose**: Calculate overall preparedness score for an institution

**Formula**:
```
SchoolScore = (AvgParticipationRate × 0.6) + (TimeScore × 0.4)
```

**Sub-formulas**:

**Average Participation Rate**:
```
AvgParticipation = Σ(drill.participationRate) / drillCount
```

**Time Score** (Normalized):
```
TimeScore = max(0, 100 - (avgEvacuationTime / 3))
```
- 0 seconds = 100 points
- 300 seconds (5 min) = 0 points
- 3 seconds = 1 point deduction

**Data Source**: Last 90 days of completed drills

**Example**:
- Avg participation: 85%
- Avg evacuation time: 180 seconds (3 minutes)
- Time score: max(0, 100 - (180/3)) = max(0, 100 - 60) = **40**
- **School Score**: (85 × 0.6) + (40 × 0.4) = 51 + 16 = **67/100**

---

## 📡 **Mesh Networking Calculations**

### **Connection Quality Metrics**

**Purpose**: Measure mesh network performance and reliability

**Metrics Tracked**:

1. **Latency** (Round-trip time):
   ```
   Latency = ReceiveTime - SendTime
   ```

2. **Message Success Rate**:
   ```
   SuccessRate = (MessagesReceived / MessagesSent) × 100
   ```

3. **Connection Duration**:
   ```
   Duration = DisconnectTime - ConnectTime
   ```

4. **Hop Count** (for relayed messages):
   ```
   HopCount = Number of intermediate nodes
   ```

**TTL (Time To Live)**:
- Default: 5 hops
- Prevents infinite message loops
- Decremented at each relay

**Message Deduplication**:
- Messages with same `messageId` are ignored if received within 5 seconds
- Prevents duplicate processing in mesh network

---

## 📊 **Summary Table**

| Calculation Type | Formula | Output Range | Use Case |
|-----------------|---------|--------------|----------|
| **Preparedness Score** | Weighted average (5 components) | 0-100 | Overall student readiness |
| **Student Risk Score** | Sum of 6 risk factors | 0-100 | Identify at-risk students |
| **Drill Prediction** | Historical × Day × Time factors | Seconds, % | Forecast drill performance |
| **Anomaly Detection** | Z-score > 2 | Boolean | Detect unusual patterns |
| **Distance (Haversine)** | Spherical trigonometry | Meters | AR navigation, geofencing |
| **Bearing** | atan2 calculation | 0-360° | AR direction guidance |
| **Walking Time** | Distance / 1.4 m/s | Seconds | AR ETA estimation |
| **School Score** | Participation (60%) + Time (40%) | 0-100 | Institution preparedness |

---

**Last Updated**: 2025-01-27  
**Version**: 1.0.0  
**App Name**: EduSafe

