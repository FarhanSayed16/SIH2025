# Phase 3.1.1: Testing Guide

## 🧪 **Testing Phase 3.1.1 Backend Enhancements**

This guide explains how to test all the Phase 3.1.1 backend enhancements.

---

## 📋 **Prerequisites**

1. **Backend server running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Database seeded with sample modules**
   ```bash
   cd backend
   node scripts/seed-modules.js
   ```

3. **Dependencies installed**
   ```bash
   cd backend
   npm install axios  # For test script
   ```

---

## 🚀 **Running Tests**

### **Automated Test Script**

Run the comprehensive test script:

```bash
cd backend
node scripts/test-phase3.1.1.js
```

This will test:
- ✅ Health check
- ✅ List modules (basic)
- ✅ List modules with filters
- ✅ List modules with sorting
- ✅ Get module by ID
- ✅ Module structure validation
- ✅ Quiz types validation
- ✅ Pagination
- ✅ Error handling

---

## 📝 **Manual Testing**

### **1. Test List Modules (Basic)**

```bash
curl http://localhost:3000/api/modules
```

**Expected**: Returns list of modules with pagination

---

### **2. Test Filtering**

**By Type:**
```bash
curl "http://localhost:3000/api/modules?type=fire"
```

**By Category:**
```bash
curl "http://localhost:3000/api/modules?category=safety"
```

**By Difficulty:**
```bash
curl "http://localhost:3000/api/modules?difficulty=beginner"
```

**By Grade Level:**
```bash
curl "http://localhost:3000/api/modules?gradeLevel=10"
```

**By Tags:**
```bash
curl "http://localhost:3000/api/modules?tags=fire"
```

**By Search:**
```bash
curl "http://localhost:3000/api/modules?search=fire"
```

**Multiple Filters:**
```bash
curl "http://localhost:3000/api/modules?type=fire&difficulty=beginner&category=safety"
```

---

### **3. Test Sorting**

**By Order:**
```bash
curl "http://localhost:3000/api/modules?sortBy=order&sortOrder=asc"
```

**By Popularity:**
```bash
curl "http://localhost:3000/api/modules?sortBy=popularity&sortOrder=desc"
```

**By Completions:**
```bash
curl "http://localhost:3000/api/modules?sortBy=completions&sortOrder=desc"
```

**By Title:**
```bash
curl "http://localhost:3000/api/modules?sortBy=title&sortOrder=asc"
```

---

### **4. Test Get Module by ID**

```bash
# Get a module ID from the list first
curl "http://localhost:3000/api/modules/:id"
```

**With Version:**
```bash
curl "http://localhost:3000/api/modules/:id?version=1.0.0"
```

**Expected**: 
- Returns module details
- View count increments (check stats.totalViews)
- Correct answers hidden for students

---

### **5. Test Module Structure**

Check that modules have:
- ✅ `version` field
- ✅ `category` field
- ✅ `gradeLevel` array
- ✅ `tags` array
- ✅ `stats` object (totalViews, totalCompletions, averageScore)
- ✅ `content.lessons` array (structured lessons)
- ✅ Enhanced quiz types

---

### **6. Test Pagination**

```bash
# Page 1
curl "http://localhost:3000/api/modules?page=1&limit=2"

# Page 2
curl "http://localhost:3000/api/modules?page=2&limit=2"
```

**Expected**: Different modules on each page, pagination metadata

---

### **7. Test Error Handling**

**Invalid Module ID:**
```bash
curl "http://localhost:3000/api/modules/invalid-id"
```

**Expected**: 400 Bad Request

**Non-existent Module:**
```bash
curl "http://localhost:3000/api/modules/507f1f77bcf86cd799439011"
```

**Expected**: 404 Not Found

---

## ✅ **Expected Results**

### **Module Structure**

Each module should have:

```json
{
  "_id": "...",
  "title": "...",
  "description": "...",
  "type": "fire",
  "category": "safety",
  "difficulty": "beginner",
  "gradeLevel": ["all"],
  "tags": ["fire", "safety"],
  "version": "1.0.0",
  "content": {
    "lessons": [...],
    "videos": [...],
    "images": [...],
    "text": "..."
  },
  "quiz": {
    "questions": [
      {
        "question": "...",
        "questionType": "text|image|audio",
        "options": [...],
        "points": 10
      }
    ]
  },
  "stats": {
    "totalViews": 0,
    "totalCompletions": 0,
    "averageScore": 0
  }
}
```

---

## 🐛 **Troubleshooting**

### **Server Not Running**
```
Error: connect ECONNREFUSED
```
**Solution**: Start the backend server with `npm run dev`

### **No Modules Found**
```
Empty array returned
```
**Solution**: Run the seed script: `node scripts/seed-modules.js`

### **Module Structure Missing Fields**
```
stats is undefined
```
**Solution**: Check that you're using the updated Module model. Restart the server.

---

## 📊 **Test Results**

After running tests, you should see:

```
✅ Passed: X
❌ Failed: 0
📈 Total: X
```

All tests should pass for Phase 3.1.1 to be considered complete.

---

**Status**: 📋 **Testing Guide Ready**

**Next**: Run tests and verify all features work correctly

