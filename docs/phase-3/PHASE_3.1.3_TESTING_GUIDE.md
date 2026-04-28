# Phase 3.1.3: Non-Reader Content Mode - Testing Guide 🧪

## 🎯 **Testing Overview**

This guide will help you test all Phase 3.1.3 features: TTS, audio playback, picture quizzes, and audio quizzes.

---

## 📋 **Quick Testing Checklist**

### **1. Backend Audio API** ⭐
- [ ] Test audio file upload
- [ ] Test audio file retrieval
- [ ] Test audio file deletion
- [ ] Verify static file serving
- [ ] Test file validation (size, type)

### **2. Mobile TTS (Text-to-Speech)** ⭐
- [ ] TTS service initializes
- [ ] TTS speaks text correctly
- [ ] Tap-to-listen works on module text
- [ ] Tap-to-listen works on quiz questions
- [ ] TTS stops when navigating away
- [ ] Multiple text blocks work independently

### **3. Mobile Audio Player** ⭐
- [ ] Audio player loads audio file
- [ ] Play button works
- [ ] Pause button works
- [ ] Stop button works
- [ ] Progress indicator updates
- [ ] Duration displays correctly
- [ ] Error handling for invalid URLs

### **4. Picture Quiz** ⭐
- [ ] Picture quiz displays correctly
- [ ] Images load in grid layout
- [ ] Tap to select answer works
- [ ] Selection indicator shows
- [ ] Quiz submission works
- [ ] Works offline (if cached)

### **5. Audio Quiz** ⭐
- [ ] Audio player appears for question
- [ ] Audio plays when tapped
- [ ] Image-based answers display
- [ ] Tap to select answer works
- [ ] Quiz submission works
- [ ] Works offline (if cached)

### **6. Integration Testing** ⭐
- [ ] Module content with TTS works
- [ ] Module content with audio works
- [ ] All quiz types work in quiz screen
- [ ] Quiz results sync correctly
- [ ] Offline mode works (if cached)

---

## 🔍 **What to Look For**

### **Success Indicators** ✅
- TTS speaks clearly
- Audio plays smoothly
- Images load quickly
- Quiz selection is responsive
- No crashes or errors
- Smooth user experience

### **Potential Issues** ⚠️
- TTS not speaking
- Audio not playing
- Images not loading
- Quiz selection not working
- Performance issues
- Memory leaks

---

## 📝 **Detailed Testing Steps**

### **Backend Testing**

#### **Test 1: Audio File Upload**
```bash
# Using curl or Postman
POST http://localhost:3000/api/audio/modules/{moduleId}/audio
Headers:
  Authorization: Bearer {token}
  Content-Type: multipart/form-data
Body:
  audio: [select audio file - MP3, WAV, OGG]
```

**Expected**: 
- Status 201
- Response with audioUrl, filename, size

#### **Test 2: Get Audio File**
```bash
GET http://localhost:3000/api/audio/{filename}
```

**Expected**: 
- Status 200
- Audio file streamed

#### **Test 3: Static File Serving**
```bash
GET http://localhost:3000/uploads/audio/{filename}
```

**Expected**: 
- Status 200
- Audio file served

---

### **Mobile Testing**

#### **Test 1: TTS Service**
1. Open app
2. Navigate to a module
3. Find text content
4. Tap on text (should see volume icon)
5. Verify text is spoken
6. Navigate away
7. Verify TTS stops

#### **Test 2: Audio Player**
1. Open module with audio content
2. Find audio player widget
3. Tap play button
4. Verify audio plays
5. Tap pause button
6. Verify audio pauses
7. Tap stop button
8. Verify audio stops

#### **Test 3: Picture Quiz**
1. Open module with quiz
2. Start quiz
3. If question type is "image-to-image":
   - Verify images display in grid
   - Tap on an image
   - Verify selection indicator appears
   - Submit quiz
   - Verify results

#### **Test 4: Audio Quiz**
1. Open module with audio quiz
2. Start quiz
3. If question type is "audio":
   - Verify audio player appears
   - Tap play to hear question
   - Tap on image answer
   - Verify selection
   - Submit quiz
   - Verify results

#### **Test 5: Integration**
1. Open module
2. Navigate through content
3. Verify TTS works on all text
4. Verify audio content plays
5. Start quiz
6. Verify all quiz types work
7. Submit quiz
8. Verify results sync

---

## 🧪 **Automated Test Script**

Run the backend test script:
```bash
cd backend
node scripts/test-phase3.1.3.js
```

---

## 📊 **Test Results Template**

### **Backend Tests**
- [ ] Audio upload: ✅ / ❌
- [ ] Audio retrieval: ✅ / ❌
- [ ] Static serving: ✅ / ❌
- [ ] File validation: ✅ / ❌

### **Mobile Tests**
- [ ] TTS initialization: ✅ / ❌
- [ ] TTS speaking: ✅ / ❌
- [ ] Audio player: ✅ / ❌
- [ ] Picture quiz: ✅ / ❌
- [ ] Audio quiz: ✅ / ❌
- [ ] Integration: ✅ / ❌

---

## 🚀 **Ready to Test!**

Follow the checklist above and document any issues you find.

**Monitor Terminal**: Watch for:
- ✅ Success messages
- ❌ Error messages
- 🔄 Loading states
- 📥 File uploads
- 🔊 Audio playback

---

**Status**: 📋 **READY FOR TESTING**

