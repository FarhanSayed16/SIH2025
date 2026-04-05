# Incidents Statistics Not Fetching - Complete Fix Plan

## Problem Analysis

The incidents statistics page is showing **0** for all metrics:
- Total Incidents: 0
- Active Alerts: 0
- Resolved Cases: 0
- Historical Data: 0

## Root Causes Identified

### 1. **Backend Stats Controller Mismatch**
The backend `getIncidentStats` controller in `backend/src/controllers/incident.controller.js` is:
- Only querying `AlertLog` model
- Not calculating `active`, `resolved`, and `historical` fields
- Not including historical incidents in the stats
- Missing proper status-based calculations

**Current Backend Response:**
```javascript
{
  total: number,
  bySource: {},
  byStatus: {},
  bySeverity: {},
  byType: {}
}
```

**Expected Frontend Response:**
```typescript
{
  total: number,
  active: number,        // ❌ Missing
  resolved: number,      // ❌ Missing
  historical: number,   // ❌ Missing
  bySource: {},
  byStatus: {},
  bySeverity: {},
  byType: {}
}
```

### 2. **Data Model Confusion**
- Backend uses `AlertLog` model for incidents
- Historical incidents might be stored separately
- Need to check if incidents are stored in `AlertLog` or `Incident` model

### 3. **Institution ID Handling**
- Frontend might not be passing institution ID correctly
- Backend might not be filtering by institution properly
- User's institution ID might not match query

### 4. **API Response Structure**
- Frontend expects `response.data` to contain stats
- Backend might be returning different structure
- Need to verify response parsing

## Solution Plan

### Phase 1: Fix Backend Stats Controller

**File:** `backend/src/controllers/incident.controller.js`

**Changes Required:**

1. **Add missing fields calculation:**
   ```javascript
   export const getIncidentStats = async (req, res) => {
     try {
       const { institutionId, startDate, endDate } = req.query;
       const user = req.user;

       const query = {};

       // Filter by institution
       if (user.role === 'admin' && institutionId) {
         query.institutionId = institutionId;
       } else {
         query.institutionId = user.institutionId;
       }

       // Filter by date range
       if (startDate || endDate) {
         query.createdAt = {};
         if (startDate) {
           query.createdAt.$gte = new Date(startDate);
         }
         if (endDate) {
           query.createdAt.$lte = new Date(endDate);
         }
       }

       // Get regular incidents (AlertLog)
       const regularStats = await AlertLog.aggregate([
         { $match: query },
         {
           $group: {
             _id: null,
             total: { $sum: 1 },
             active: {
               $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
             },
             resolved: {
               $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
             },
             bySource: { $push: '$source' },
             byStatus: { $push: '$status' },
             bySeverity: { $push: '$severity' },
             byType: { $push: '$type' }
           }
         }
       ]);

       // Get historical incidents (if HistoricalIncident model exists)
       let historicalCount = 0;
       try {
         const HistoricalIncident = (await import('../models/HistoricalIncident.js')).default;
         const historicalQuery = { ...query };
         historicalCount = await HistoricalIncident.countDocuments(historicalQuery);
       } catch (err) {
         // HistoricalIncident model might not exist, use AlertLog with isHistorical flag
         const historicalQuery = { ...query, isHistorical: true };
         historicalCount = await AlertLog.countDocuments(historicalQuery);
       }

       // Process statistics
       const stats = regularStats[0] || {};
       const result = {
         total: stats.total || 0,
         active: stats.active || 0,
         resolved: stats.resolved || 0,
         historical: historicalCount || 0,
         bySource: {},
         byStatus: {},
         bySeverity: {},
         byType: {}
       };

       // Count by source
       if (stats.bySource) {
         stats.bySource.forEach(source => {
           result.bySource[source] = (result.bySource[source] || 0) + 1;
         });
       }

       // Count by status
       if (stats.byStatus) {
         stats.byStatus.forEach(status => {
           result.byStatus[status] = (result.byStatus[status] || 0) + 1;
         });
       }

       // Count by severity
       if (stats.bySeverity) {
         stats.bySeverity.forEach(severity => {
           result.bySeverity[severity] = (result.bySeverity[severity] || 0) + 1;
         });
       }

       // Count by type
       if (stats.byType) {
         stats.byType.forEach(type => {
           result.byType[type] = (result.byType[type] || 0) + 1;
         });
       }

       res.json({
         success: true,
         data: result
       });
     } catch (error) {
       logger.error('Error fetching incident statistics:', error);
       res.status(500).json({
         success: false,
         message: 'Failed to fetch incident statistics',
         error: error.message
       });
     }
   };
   ```

### Phase 2: Verify Data Models

**Check if incidents exist in database:**

1. **Check AlertLog collection:**
   ```javascript
   // In MongoDB shell or backend script
   db.alertlogs.find({}).count()
   db.alertlogs.find({ institutionId: "YOUR_INSTITUTION_ID" }).count()
   ```

2. **Check for HistoricalIncident model:**
   - Look for `backend/src/models/HistoricalIncident.js`
   - If it exists, use it for historical counts
   - If not, check if `AlertLog` has `isHistorical` field

### Phase 3: Fix Frontend Data Fetching

**File:** `web/app/admin/incidents/page.tsx`

**Current Issue:**
- `loadStats` function might not be called properly
- Response might not be parsed correctly
- Institution ID might not be passed correctly

**Fix:**

```typescript
const loadStats = useCallback(async () => {
  if (!isAuthenticated || !user) {
    console.warn('User not authenticated for stats');
    return;
  }

  try {
    const schoolId = getInstitutionId(user.institutionId);
    if (!schoolId) {
      console.warn('No institution ID for stats');
      setStats({
        total: 0,
        active: 0,
        resolved: 0,
        historical: 0,
        bySource: {},
        byStatus: {},
        bySeverity: {},
        byType: {}
      });
      return;
    }

    console.log('Loading stats for institution:', schoolId); // Debug log

    const response = await incidentsApi.getStats({
      institutionId: schoolId,
      startDate: filters.startDate,
      endDate: filters.endDate,
    });

    console.log('Stats API Response:', response); // Debug log

    if (response.success && response.data) {
      console.log('Setting stats:', response.data); // Debug log
      setStats(response.data);
    } else {
      console.warn('Failed to load stats:', response?.message || response?.error);
      // Set default stats instead of null
      setStats({
        total: 0,
        active: 0,
        resolved: 0,
        historical: 0,
        bySource: {},
        byStatus: {},
        bySeverity: {},
        byType: {}
      });
    }
  } catch (error: any) {
    console.error('Error loading stats:', error);
    // Set default stats on error
    setStats({
      total: 0,
      active: 0,
      resolved: 0,
      historical: 0,
      bySource: {},
      byStatus: {},
      bySeverity: {},
      byType: {}
    });
  }
}, [isAuthenticated, user, filters.startDate, filters.endDate]);
```

### Phase 4: Add Debugging & Error Handling

**Add console logs to track the flow:**

1. **Backend Controller:**
   ```javascript
   export const getIncidentStats = async (req, res) => {
     try {
       const { institutionId, startDate, endDate } = req.query;
       const user = req.user;

       console.log('Stats Request:', {
         institutionId,
         userInstitutionId: user.institutionId,
         userRole: user.role,
         startDate,
         endDate
       });

       // ... rest of the code
     }
   };
   ```

2. **Frontend API Call:**
   ```typescript
   getStats: async (params?: {
     institutionId?: string;
     startDate?: string;
     endDate?: string;
   }): Promise<ApiResponse<IncidentStats>> => {
     const queryParams = new URLSearchParams();
     if (params?.institutionId) queryParams.append('institutionId', params.institutionId);
     if (params?.startDate) queryParams.append('startDate', params.startDate);
     if (params?.endDate) queryParams.append('endDate', params.endDate);

     const query = queryParams.toString();
     console.log('Calling stats API:', `/incidents/stats${query ? `?${query}` : ''}`);
     
     return apiClient.get(`/incidents/stats${query ? `?${query}` : ''}`);
   },
   ```

### Phase 5: Verify API Endpoint

**Check route registration:**

1. **Verify route exists:** `backend/src/routes/incident.routes.js`
   ```javascript
   router.get('/stats', getIncidentStats);
   ```

2. **Verify route is registered in server:** `backend/src/server.js`
   ```javascript
   app.use('/api/incidents', incidentRoutes);
   ```

## Implementation Steps

### Step 1: Update Backend Controller
1. Open `backend/src/controllers/incident.controller.js`
2. Find `getIncidentStats` function
3. Replace with the enhanced version from Phase 1
4. Add proper aggregation for `active` and `resolved` counts
5. Add historical incidents count

### Step 2: Test Backend Endpoint
1. Start backend server
2. Test endpoint: `GET http://localhost:3000/api/incidents/stats?institutionId=YOUR_ID`
3. Check response structure
4. Verify counts match database

### Step 3: Update Frontend
1. Open `web/app/admin/incidents/page.tsx`
2. Update `loadStats` function with better error handling
3. Add default stats object instead of `null`
4. Add console logs for debugging

### Step 4: Test Frontend
1. Open browser console
2. Navigate to `/admin/incidents`
3. Check console logs for API calls
4. Verify stats are displayed correctly

### Step 5: Verify Data
1. Check if incidents exist in database
2. Verify institution ID matches
3. Check if date filters are working
4. Verify historical incidents are counted

## Testing Checklist

- [ ] Backend endpoint returns correct structure
- [ ] Backend calculates `active` count correctly
- [ ] Backend calculates `resolved` count correctly
- [ ] Backend calculates `historical` count correctly
- [ ] Frontend receives stats in correct format
- [ ] Frontend displays stats correctly
- [ ] Institution ID filtering works
- [ ] Date range filtering works
- [ ] Historical incidents are included when checkbox is checked
- [ ] Error handling works when API fails
- [ ] Default values (0) display when no data

## Expected Results

After fixes, the stats should show:
- **Total Incidents:** Actual count from database
- **Active Alerts:** Count of incidents with `status: 'active'`
- **Resolved Cases:** Count of incidents with `status: 'resolved'`
- **Historical Data:** Count of historical incidents

## Troubleshooting

### If stats still show 0:

1. **Check Database:**
   ```javascript
   // In MongoDB
   db.alertlogs.find({ institutionId: "YOUR_ID" }).count()
   ```

2. **Check API Response:**
   - Open browser DevTools → Network tab
   - Find `/api/incidents/stats` request
   - Check response body

3. **Check Console Logs:**
   - Look for error messages
   - Check institution ID value
   - Verify API call is made

4. **Check Backend Logs:**
   - Check server console for errors
   - Verify aggregation query works
   - Check if AlertLog model exists

### Common Issues:

1. **No incidents in database:**
   - Create test incidents
   - Or check if using correct institution ID

2. **Institution ID mismatch:**
   - Verify user's institution ID
   - Check if admin is filtering by different institution

3. **Model not found:**
   - Check if AlertLog model is imported correctly
   - Verify model name matches collection name

4. **Date filter issues:**
   - Check date format
   - Verify timezone handling

## Files to Modify

1. `backend/src/controllers/incident.controller.js` - Fix stats calculation
2. `web/app/admin/incidents/page.tsx` - Fix frontend data fetching
3. `web/lib/api/incidents.ts` - Add debugging (optional)

## Summary

The main issue is that the backend stats controller is not calculating the `active`, `resolved`, and `historical` fields that the frontend expects. The fix involves:

1. **Backend:** Update aggregation to calculate missing fields
2. **Frontend:** Add better error handling and default values
3. **Testing:** Verify data exists and API works correctly

Once these changes are implemented, the stats should display correctly.

