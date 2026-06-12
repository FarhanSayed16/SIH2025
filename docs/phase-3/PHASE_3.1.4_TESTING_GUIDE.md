# Phase 3.1.4: Testing Guide

## 🧪 Complete Testing Guide for AI Quiz Generation

---

## Prerequisites

1. **Backend Server Running**
   ```bash
   cd backend
   npm run dev
   ```

2. **Environment Variables**
   - Ensure `backend/.env` has:
     ```env
     MONGODB_URI=your_mongodb_connection
     JWT_SECRET=your_jwt_secret
     GEMINI_API_KEY=your_gemini_api_key  # For AI features
     GEMINI_MODEL=gemini-pro  # Optional, defaults to gemini-pro
     ```

3. **Database Seeded**
   ```bash
   cd backend
   npm run seed
   ```

---

## Backend Testing

### Automated Tests

Run the automated test script:

```bash
cd backend
node scripts/test-phase3.1.4.js
```

**Expected Results**:
- ✅ Health check passes
- ✅ Login successful
- ✅ Module ID found
- ✅ Quiz generation endpoint accessible
- ✅ Error handling works

**Note**: Quiz generation requires `GEMINI_API_KEY`. Without it, the endpoint will return 503 (Service Unavailable).

---

### Manual API Testing

#### 1. Health Check
```bash
curl http://localhost:3000/health
```

**Expected**: `{"status":"OK","db":"connected"}`

---

#### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

**Expected**: Returns access token

---

#### 3. Get Module ID
```bash
curl http://localhost:3000/api/modules?limit=1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns module list with `_id` field

---

#### 4. Generate Quiz (Requires GEMINI_API_KEY)
```bash
curl "http://localhost:3000/api/ai/quiz/generate/MODULE_ID?numQuestions=5&difficulty=beginner" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Quiz generated successfully",
  "data": {
    "moduleId": "xxx",
    "questions": [
      {
        "question": "What is...?",
        "questionType": "text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "points": 10,
        "explanation": "..."
      }
    ],
    "cached": false,
    "numQuestions": 5
  }
}
```

**Parameters**:
- `numQuestions`: 3-10 (default: 5)
- `difficulty`: beginner, intermediate, advanced (default: beginner)
- `gradeLevel`: all, KG, 1-12 (default: all)
- `useCache`: true, false (default: true)

---

#### 5. Get Cached Quiz
```bash
curl "http://localhost:3000/api/ai/quiz/cached/MODULE_ID?numQuestions=5&difficulty=beginner" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: Returns cached quiz if available, or 404 if not cached

---

#### 6. Test Error Handling

**Invalid Module ID**:
```bash
curl "http://localhost:3000/api/ai/quiz/generate/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: 404 error

**Missing API Key** (if not configured):
```bash
# Remove GEMINI_API_KEY from .env and restart server
```

**Expected**: 503 error with message about API key

---

## Mobile Testing

### Setup

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Update Mobile API Base URL**
   - Check `mobile/lib/core/config/env.dart`
   - Ensure it points to your backend

3. **Run Flutter App**
   ```bash
   cd mobile
   flutter run
   ```

---

### Manual Mobile Tests

#### 1. Open Module Detail Screen
- Navigate to any module
- Scroll to quiz section
- Verify you see:
  - ✅ "Module Quiz" button (if module has quiz)
  - ✅ "AI-Generated Quiz" section
  - ✅ "Generate AI Quiz" button

#### 2. Generate AI Quiz
- Tap "Generate AI Quiz" button
- Dialog should appear with:
  - ✅ Question count slider (3-10)
  - ✅ Difficulty selector (Easy, Medium, Hard)
  - ✅ Generate button
  - ✅ Cancel button

#### 3. Generate Quiz Flow
1. Set number of questions (e.g., 5)
2. Select difficulty (e.g., Easy)
3. Tap "Generate" button
4. **Expected**:
   - ✅ Loading indicator appears
   - ✅ "Generating..." text shown
   - ✅ Dialog closes after generation
   - ✅ Quiz screen opens with generated questions

#### 4. Quiz Display
- Verify quiz questions display correctly:
  - ✅ Question text visible
  - ✅ 4 options shown
  - ✅ Options are selectable
  - ✅ Navigation works (Next/Previous)

#### 5. Quiz Submission
- Answer all questions
- Tap "Submit Quiz"
- **Expected**:
  - ✅ Results shown
  - ✅ Score displayed
  - ✅ Explanations shown (if available)

#### 6. Offline Testing
1. Generate a quiz (while online)
2. Turn off internet/WiFi
3. Navigate to same module
4. Tap "Generate AI Quiz"
5. **Expected**:
   - ✅ Cached quiz loads (if previously generated)
   - ✅ Error message shown if no cache

---

## Test Checklist

### Backend ✅
- [x] Health check endpoint
- [x] Authentication works
- [x] Module retrieval works
- [x] Quiz generation endpoint exists
- [x] Error handling works
- [ ] Full quiz generation (requires API key)
- [ ] Cache retrieval works
- [ ] Different difficulty levels
- [ ] Different question counts

### Mobile
- [ ] AI quiz dialog appears
- [ ] Dialog controls work
- [ ] Quiz generation request sent
- [ ] Loading states work
- [ ] Error handling works
- [ ] Generated quiz displays correctly
- [ ] Quiz can be taken
- [ ] Quiz submission works
- [ ] Offline caching works
- [ ] Cached quiz loads offline

---

## Troubleshooting

### Issue: Quiz Generation Fails

**Symptoms**: 503 error or model not found

**Solutions**:
1. Check `GEMINI_API_KEY` in `.env`
2. Verify API key is valid
3. Check model name (use `gemini-pro` for compatibility)
4. Restart backend server after changing `.env`

---

### Issue: Mobile Can't Connect to Backend

**Symptoms**: Connection timeout or refused

**Solutions**:
1. Verify backend is running (`http://localhost:3000/health`)
2. Check API base URL in mobile config
3. For Android emulator, use `10.0.2.2:3000` instead of `localhost`
4. Check CORS settings in backend

---

### Issue: No Cached Quiz Offline

**Symptoms**: Error when trying to generate quiz offline

**Solutions**:
1. Generate quiz while online first
2. Check local storage permissions
3. Verify `quizzesBox` constant is set
4. Check storage service initialization

---

## Performance Testing

### Load Testing

1. **Generate Multiple Quizzes**:
   ```bash
   for i in {1..10}; do
     curl "http://localhost:3000/api/ai/quiz/generate/MODULE_ID?numQuestions=5" \
       -H "Authorization: Bearer TOKEN"
   done
   ```

2. **Check Cache Performance**:
   - First request: Should generate new quiz
   - Second request: Should return cached quiz (faster)

3. **Monitor**:
   - Response times
   - Memory usage
   - API rate limits

---

## Integration Testing

### End-to-End Flow

1. **Backend**: Generate quiz via API
2. **Mobile**: Display generated quiz
3. **User**: Complete quiz
4. **Mobile**: Submit answers
5. **Backend**: Save results

**Verify**:
- ✅ Data flows correctly
- ✅ Error states handled
- ✅ Loading states shown
- ✅ Success feedback provided

---

## Test Results Template

```markdown
## Test Run: [Date]

### Backend
- Health Check: ✅/❌
- Authentication: ✅/❌
- Quiz Generation: ✅/❌
- Cache: ✅/❌

### Mobile
- UI Display: ✅/❌
- Generation: ✅/❌
- Quiz Taking: ✅/❌
- Offline: ✅/❌

### Issues Found
1. [Issue description]
2. [Issue description]

### Notes
[Any additional observations]
```

---

**Last Updated**: 2025-11-25
**Phase**: 3.1.4 - AI-Powered Quiz Generation

