# Phase 3.1.3: Testing Steps - Step by Step Guide 🧪

## 🚀 **Quick Start**

Follow these steps to test Phase 3.1.3 features.

---

## 📋 **Step 1: Start Backend Server**

### **Terminal 1: Backend**
```bash
cd backend
npm run dev
```

**Wait for**: `🚀 Kavach Backend running on 0.0.0.0:3000`

---

## 📋 **Step 2: Run Backend Tests**

### **Terminal 2: Run Test Script**
```bash
cd backend
node scripts/test-phase3.1.3.js
```

**Expected Results**:
- ✅ Health Check
- ✅ Login Authentication
- ✅ Upload endpoint exists
- ✅ Get audio endpoint exists
- ✅ Static serving endpoint exists
- ✅ Unauthorized access rejected

---

## 📋 **Step 3: Test Mobile Dependencies**

### **Terminal 3: Install Mobile Dependencies**
```bash
cd mobile
flutter pub get
```

**Check for**:
- ✅ `flutter_tts` installed
- ✅ `audioplayers` installed
- ✅ No errors

---

## 📋 **Step 4: Test Mobile App**

### **Start Mobile App**
```bash
cd mobile
flutter run
```

**Or use your IDE to run the app**

---

## 📋 **Step 5: Manual Testing Checklist**

### **A. Test TTS (Text-to-Speech)**

1. **Open a Module**
   - Navigate to Learn/Modules tab
   - Open any module with text content

2. **Test Tap-to-Listen**
   - Find text content
   - Look for volume icon (🔊) next to text
   - Tap on the text
   - ✅ **Expected**: Text is spoken aloud
   - ✅ **Expected**: Icon changes to show speaking state

3. **Test Multiple Text Blocks**
   - Navigate through different sections
   - Tap on different text blocks
   - ✅ **Expected**: Each text block can be spoken independently

4. **Test Navigation**
   - While text is speaking, navigate away
   - ✅ **Expected**: TTS stops automatically

---

### **B. Test Audio Player**

1. **Find Audio Content**
   - Open a module with audio sections
   - Or use a module with audio quiz questions

2. **Test Audio Playback**
   - Find audio player widget
   - Tap play button (▶️)
   - ✅ **Expected**: Audio starts playing
   - ✅ **Expected**: Progress bar shows progress
   - ✅ **Expected**: Duration displays

3. **Test Controls**
   - Tap pause button (⏸️)
   - ✅ **Expected**: Audio pauses
   - Tap play again
   - ✅ **Expected**: Audio resumes
   - Tap stop button (⏹️)
   - ✅ **Expected**: Audio stops and resets

4. **Test Error Handling**
   - Try invalid audio URL (if possible)
   - ✅ **Expected**: Error message displayed

---

### **C. Test Picture Quiz**

1. **Start a Quiz**
   - Open a module with quiz
   - Start the quiz

2. **Find Picture Quiz**
   - Look for question type "image-to-image"
   - Or question with images as answers

3. **Test Selection**
   - See images displayed in grid (2x2 or similar)
   - Tap on an image
   - ✅ **Expected**: Selection indicator appears (checkmark)
   - ✅ **Expected**: Border highlights selected image
   - Tap another image
   - ✅ **Expected**: Previous selection clears, new one selected

4. **Test Submission**
   - Select an answer
   - Tap "Next" or "Submit Quiz"
   - ✅ **Expected**: Quiz proceeds/submits correctly

---

### **D. Test Audio Quiz**

1. **Start a Quiz**
   - Open a module with audio quiz
   - Start the quiz

2. **Find Audio Question**
   - Look for question type "audio"
   - Or question with audio player widget

3. **Test Audio Playback**
   - See audio player widget
   - Tap play button
   - ✅ **Expected**: Question audio plays
   - Listen to the question

4. **Test Answer Selection**
   - See image-based answer options
   - Tap on an image answer
   - ✅ **Expected**: Selection indicator appears
   - ✅ **Expected**: Can submit answer

5. **Test Replay**
   - Tap play button again
   - ✅ **Expected**: Audio replays from beginning

---

### **E. Test Integration**

1. **Complete Module Flow**
   - Open a module
   - Navigate through content
   - Use TTS on text sections
   - Play audio sections
   - Start quiz
   - Complete quiz with all question types
   - Submit quiz
   - ✅ **Expected**: All features work together smoothly

2. **Test Offline Mode** (if applicable)
   - Download module for offline
   - Turn off WiFi/Mobile data
   - Try TTS
   - ✅ **Expected**: TTS works (uses device TTS)
   - Try audio player
   - ✅ **Expected**: Audio plays if cached
   - Try quizzes
   - ✅ **Expected**: Quizzes work offline

---

## 📊 **Test Results Template**

### **Backend Tests**
- [ ] Health Check: ✅ / ❌
- [ ] Login: ✅ / ❌
- [ ] Upload endpoint: ✅ / ❌
- [ ] Get audio endpoint: ✅ / ❌
- [ ] Static serving: ✅ / ❌
- [ ] Unauthorized access: ✅ / ❌

### **Mobile Tests**
- [ ] TTS initialization: ✅ / ❌
- [ ] TTS speaking: ✅ / ❌
- [ ] Tap-to-listen: ✅ / ❌
- [ ] Audio player: ✅ / ❌
- [ ] Picture quiz: ✅ / ❌
- [ ] Audio quiz: ✅ / ❌
- [ ] Integration: ✅ / ❌

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: TTS Not Speaking**
**Solution**: 
- Check device volume
- Check TTS service initialization
- Verify text is not empty
- Check device language settings

### **Issue 2: Audio Not Playing**
**Solution**:
- Check audio URL is valid
- Check network connection
- Verify audio file format (MP3, WAV, OGG)
- Check audio player initialization

### **Issue 3: Images Not Loading in Quiz**
**Solution**:
- Check image URLs are valid
- Check network connection
- Verify cached_network_image is working
- Check image format support

### **Issue 4: Quiz Selection Not Working**
**Solution**:
- Check tap gesture is registered
- Verify state management
- Check widget rebuild on selection
- Verify quiz question structure

---

## 📝 **Document Test Results**

After testing, document your results in:
- `PHASE_3.1.3_TEST_RESULTS.md` (create this file)

Include:
- Test date
- Test environment
- Pass/fail for each test
- Screenshots (if possible)
- Issues found
- Performance notes

---

## ✅ **Success Criteria**

Phase 3.1.3 testing is successful when:
- ✅ All backend endpoints work
- ✅ TTS speaks all text correctly
- ✅ Audio player plays files correctly
- ✅ Picture quizzes work correctly
- ✅ Audio quizzes work correctly
- ✅ All features work together
- ✅ No crashes or critical errors

---

## 🚀 **Ready to Test!**

Start with Step 1 and work through each step systematically.

**Good luck!** 🎉

---

**Status**: 📋 **READY FOR TESTING**

