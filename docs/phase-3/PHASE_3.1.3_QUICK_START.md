# Phase 3.1.3: Non-Reader Content Mode - Quick Start Guide 🚀

## 🎯 **What We're Building**

Enable KG-5 students (who cannot read) to use the app with:
- **Audio narration** for all text
- **Picture-based quizzes** (tap on images)
- **Audio questions** (listen and answer)
- **Visual animations** (Lottie)

---

## ✅ **Prerequisites**

### **Completed Phases**:
- ✅ Phase 3.1.1 - Content Schema & Structure
- ✅ Phase 3.1.2 - Offline Content Caching & Sync

### **Current Status**:
- Backend APIs are ready
- Mobile app structure is ready
- Content modules are working

---

## 🚀 **Quick Start Steps**

### **Step 1: Review the Checklist** (5 minutes)
📄 Open `PHASE_3.1.3_CHECKLIST.md` and review all tasks

### **Step 2: Start with Backend** (Day 1)

#### **Task 1: Audio File Storage**
```bash
cd backend
```

1. Create audio upload endpoint
2. Add audio storage service
3. Update module schema for audio URLs

#### **Task 2: Enhance Quiz Schema**
1. Add `audioUrl` to quiz questions
2. Add `imageUrl` to quiz questions
3. Add `questionType` enum

### **Step 3: Move to Mobile** (Day 2-3)

#### **Task 1: Add Dependencies**
```bash
cd mobile
```

Edit `pubspec.yaml`:
```yaml
dependencies:
  flutter_tts: ^4.0.0
  audioplayers: ^6.0.0
  lottie: ^3.0.0
```

Run:
```bash
flutter pub get
```

#### **Task 2: Create TTS Service**
Create `lib/core/services/tts_service.dart`

#### **Task 3: Create Audio Player Widget**
Create `lib/features/modules/widgets/audio_player_widget.dart`

### **Step 4: Implement Quiz Features** (Week 2)

#### **Task 1: Picture Quiz Widget**
Create `lib/features/quiz/widgets/picture_quiz_widget.dart`

#### **Task 2: Audio Quiz Widget**
Create `lib/features/quiz/widgets/audio_quiz_widget.dart`

---

## 📁 **File Structure to Create**

### **Backend** (New Files):
```
backend/src/
  ├── controllers/
  │   └── audioController.js (NEW)
  ├── services/
  │   └── audioService.js (NEW)
  └── models/
      └── Module.js (UPDATE - add audio fields)
```

### **Mobile** (New Files):
```
mobile/lib/
  ├── core/services/
  │   └── tts_service.dart (NEW)
  ├── features/
  │   ├── modules/widgets/
  │   │   ├── audio_player_widget.dart (NEW)
  │   │   ├── lottie_animation_widget.dart (NEW)
  │   │   └── tap_to_listen_widget.dart (NEW)
  │   └── quiz/widgets/
  │       ├── picture_quiz_widget.dart (NEW)
  │       └── audio_quiz_widget.dart (NEW)
```

---

## 🎯 **Implementation Order**

### **Week 1: Foundation**
1. **Day 1**: Backend audio storage
2. **Day 2**: Backend quiz schema updates
3. **Day 3-4**: Mobile TTS integration
4. **Day 5**: Audio player component

### **Week 2: Quiz Features**
1. **Day 1-2**: Picture quiz UI
2. **Day 3-4**: Audio quiz UI
3. **Day 5**: Visual enhancements

### **Week 3: Polish**
1. **Day 1-2**: Module screen updates
2. **Day 3**: Testing
3. **Day 4**: Documentation
4. **Day 5**: Final review

---

## 📋 **Key Tasks Breakdown**

### **Backend** (2-3 days):
- [ ] Audio file upload endpoint
- [ ] Audio retrieval API
- [ ] Quiz schema updates (audio/image fields)
- [ ] Test audio endpoints

### **Mobile - TTS** (1-2 days):
- [ ] Add `flutter_tts` package
- [ ] Create TTS service
- [ ] Add tap-to-listen widget
- [ ] Test TTS functionality

### **Mobile - Audio Player** (1-2 days):
- [ ] Add `audioplayers` package
- [ ] Create audio player widget
- [ ] Add play/pause controls
- [ ] Test audio playback

### **Mobile - Picture Quiz** (2-3 days):
- [ ] Create picture quiz widget
- [ ] Add image selection UI
- [ ] Implement quiz logic
- [ ] Test picture quiz

### **Mobile - Audio Quiz** (2-3 days):
- [ ] Create audio quiz widget
- [ ] Add audio playback
- [ ] Add image-based answers
- [ ] Test audio quiz

---

## 🧪 **Testing Checklist**

### **Audio Features**:
- [ ] TTS reads text correctly
- [ ] Tap-to-listen works
- [ ] Audio player plays files
- [ ] Audio works offline (if cached)

### **Visual Features**:
- [ ] Lottie animations play
- [ ] Images display correctly
- [ ] Visual navigation works

### **Quiz Features**:
- [ ] Picture quizzes work
- [ ] Audio quizzes work
- [ ] Quiz submission works

---

## 📚 **Helpful Resources**

### **Documentation**:
- `PHASE_3.1.3_PLAN.md` - Detailed plan
- `PHASE_3.1.3_CHECKLIST.md` - Complete checklist
- `PHASE_3_PROGRESS_SUMMARY.md` - Overall progress

### **Code References**:
- `mobile/lib/features/modules/` - Module system
- `mobile/lib/features/quiz/` - Quiz system
- `backend/src/models/Module.js` - Module schema
- `backend/src/controllers/module.controller.js` - Module controller

---

## ✅ **Definition of Done**

Phase 3.1.3 is complete when:
1. ✅ All backend audio/image support works
2. ✅ TTS works for all text content
3. ✅ Audio player works for pre-recorded content
4. ✅ Picture quizzes are functional
5. ✅ Audio-question quizzes are functional
6. ✅ All features work offline (if cached)
7. ✅ Testing is complete
8. ✅ Documentation is updated

---

## 🆘 **Common Issues & Solutions**

### **Issue**: TTS not working
**Solution**: Check device language settings, ensure `flutter_tts` is properly initialized

### **Issue**: Audio file not playing
**Solution**: Check file format (MP3, WAV, OGG), verify file path/URL

### **Issue**: Images not loading in quiz
**Solution**: Check image URLs, ensure `CachedNetworkImage` is used

---

## 🚀 **Ready to Start!**

1. ✅ Review `PHASE_3.1.3_CHECKLIST.md`
2. ✅ Set up backend audio storage
3. ✅ Add mobile dependencies
4. ✅ Start implementing!

---

**Status**: 📋 **READY TO BEGIN IMPLEMENTATION**

**Next**: Start with Backend Task 1 (Audio File Storage)

---

**Created**: 2025-01-27  
**Last Updated**: 2025-01-27

