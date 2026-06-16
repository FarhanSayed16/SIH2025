# Phase 3.5.1: Query Optimization Guide

**Status**: ✅ **READY**  
**Purpose**: Guide for analyzing and optimizing database queries

---

## 🎯 **Overview**

Query optimization ensures:
- Fast response times
- Efficient database usage
- Scalability
- Low server load

---

## 📊 **Query Analysis**

### **1. MongoDB Profiling**

Enable profiling to identify slow queries:

```javascript
// Enable profiling for queries > 100ms
db.setProfilingLevel(1, { slowms: 100 });

// Check profiling data
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty();

// Find slowest queries
db.system.profile.find({ millis: { $gt: 100 } }).sort({ millis: -1 }).limit(10);
```

### **2. Explain Plans**

Analyze query execution:

```javascript
// Explain query
db.users.find({ email: "test@example.com" }).explain("executionStats");

// Check index usage
db.users.find({ institutionId: ObjectId("...") }).explain("executionStats");
```

---

## 🔍 **Common Optimization Areas**

### **1. Missing Indexes**

Check for queries not using indexes:

```javascript
// Queries with COLLSCAN (full collection scan) are slow
db.collection.find().explain("executionStats");
// Look for: executionStats.executionStages.stage === "COLLSCAN"
```

**Solution**: Add indexes for frequently queried fields.

### **2. Inefficient Populate()**

Avoid populating large arrays:

```javascript
// ❌ Bad: Populating entire array
await User.find().populate('completedModules');

// ✅ Good: Populate specific fields only
await User.find().populate('completedModules', 'title category');

// ✅ Better: Limit population
await User.find().populate({
  path: 'completedModules',
  select: 'title category',
  options: { limit: 10 }
});
```

### **3. N+1 Query Problem**

**Problem**:
```javascript
// ❌ Bad: N queries for N users
for (const user of users) {
  const profile = await UserProfile.findOne({ userId: user.id });
}
```

**Solution**:
```javascript
// ✅ Good: Single query
const userIds = users.map(u => u.id);
const profiles = await UserProfile.find({ userId: { $in: userIds } });
```

### **4. Unnecessary Data Fetching**

Use `.select()` to limit fields:

```javascript
// ❌ Bad: Fetching all fields
const users = await User.find();

// ✅ Good: Select only needed fields
const users = await User.find().select('name email role');

// ✅ Best: Exclude heavy fields
const users = await User.find().select('-password -refreshToken');
```

---

## 📈 **Index Optimization**

### **Existing Indexes**

Our models already have optimized indexes:

#### **User Model**
- ✅ `email` (unique)
- ✅ `institutionId + role` (compound)
- ✅ `currentLocation` (2dsphere)
- ✅ `safetyStatus + institutionId`
- ✅ `classId`
- ✅ `grade + section + institutionId`
- ✅ `accessLevel`

#### **Module Model**
- ✅ `type + region` (compound)
- ✅ `isActive + order`
- ✅ `category + type`
- ✅ `gradeLevel + difficulty`
- ✅ `tags`
- ✅ `title + description + tags` (text search)

#### **QuizResult Model**
- ✅ `userId + moduleId`
- ✅ `institutionId + completedAt`
- ✅ `synced + completedAt`
- ✅ `userId + completedAt`

### **Adding New Indexes**

If analysis shows slow queries:

```javascript
// Add compound index
db.collection.createIndex({ field1: 1, field2: -1 });

// Add partial index (for filtered queries)
db.collection.createIndex(
  { field: 1 },
  { partialFilterExpression: { status: 'active' } }
);

// Add text index (for search)
db.collection.createIndex({ title: 'text', description: 'text' });
```

---

## 🚀 **Query Optimization Strategies**

### **1. Use Lean Queries**

For read-only operations:

```javascript
// ✅ Faster: Returns plain JavaScript objects
const modules = await Module.find().lean();

// ⚠️ Slower: Returns Mongoose documents with methods
const modules = await Module.find();
```

### **2. Batch Operations**

Use bulk operations for multiple updates:

```javascript
// ❌ Bad: Multiple queries
for (const user of users) {
  await User.updateOne({ _id: user.id }, { $set: { lastLogin: new Date() } });
}

// ✅ Good: Single bulk operation
await User.bulkWrite(
  users.map(user => ({
    updateOne: {
      filter: { _id: user.id },
      update: { $set: { lastLogin: new Date() } }
    }
  }))
);
```

### **3. Use Aggregation Pipelines**

For complex queries, use aggregation:

```javascript
// ✅ Efficient aggregation
const stats = await QuizResult.aggregate([
  { $match: { institutionId: ObjectId("...") } },
  { $group: {
      _id: "$moduleId",
      avgScore: { $avg: "$score" },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgScore: -1 } },
  { $limit: 10 }
]);
```

### **4. Pagination**

Always paginate large result sets:

```javascript
// ✅ Good: Paginated
const page = 1;
const limit = 20;
const skip = (page - 1) * limit;

const modules = await Module.find()
  .skip(skip)
  .limit(limit)
  .lean();
```

---

## 📝 **Monitoring Slow Queries**

### **MongoDB Slow Query Log**

```javascript
// Set slow query threshold (100ms)
db.setProfilingLevel(1, { slowms: 100 });

// Query slow operations
db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 });

// Get slow query statistics
db.system.profile.aggregate([
  { $match: { millis: { $gt: 100 } } },
  { $group: {
      _id: "$command",
      avgTime: { $avg: "$millis" },
      maxTime: { $max: "$millis" },
      count: { $sum: 1 }
    }
  },
  { $sort: { avgTime: -1 } }
]);
```

### **Application-Level Monitoring**

Use our performance middleware to track queries:

```javascript
import { trackDatabaseQuery } from '../middleware/performance.middleware.js';

const result = await trackDatabaseQuery('getUserById', async () => {
  return await User.findById(userId);
});
```

---

## ✅ **Optimization Checklist**

- [ ] Enabled MongoDB profiling
- [ ] Analyzed slow queries
- [ ] Verified index usage
- [ ] Optimized populate() calls
- [ ] Fixed N+1 query problems
- [ ] Added missing indexes
- [ ] Used lean() for read-only queries
- [ ] Implemented pagination
- [ ] Used bulk operations
- [ ] Optimized aggregation pipelines

---

## 🎯 **Performance Targets**

| Operation | Target Time | Critical Threshold |
|-----------|-------------|-------------------|
| Single document lookup | < 10ms | < 50ms |
| Paginated list query | < 50ms | < 200ms |
| Aggregation query | < 100ms | < 500ms |
| Populate operation | < 50ms | < 200ms |
| Complex join/aggregation | < 200ms | < 1000ms |

---

## 📊 **Query Analysis Tools**

### **1. MongoDB Compass**

Visual query analyzer with explain plans.

### **2. Studio 3T**

Advanced query analysis and optimization tools.

### **3. Application Logs**

Monitor query times in application logs:

```javascript
const startTime = Date.now();
const result = await User.find();
const duration = Date.now() - startTime;

if (duration > 100) {
  logger.warn(`Slow query detected: ${duration}ms`);
}
```

---

## 🚀 **Next Steps**

1. Enable MongoDB profiling
2. Run application and collect slow query data
3. Analyze slow queries
4. Add missing indexes
5. Optimize queries
6. Re-test performance
7. Document optimizations

---

**Query Optimization**: ✅ **Documentation Complete**  
**Ready for**: Query analysis and optimization

