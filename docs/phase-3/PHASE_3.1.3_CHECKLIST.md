# Phase 3.1.3: Non-Reader Content Mode - Implementation Checklist ⭐ **CRITICAL**

## 🎯 **Goal**

Enable content consumption for KG-5 students who cannot read or navigate complex text. Implement audio narration, visual content, and picture-based quizzes.

---

## 📋 **Problem Statement**

**Target Audience**: KG-2, KG-5 students
- Cannot read text
- Cannot navigate complex UI
- Need audio/visual content
- Need picture-based interactions

---

## ✅ **PHASE 3.1.3 MASTER CHECKLIST**

### **BACKEND TASKS** (2-3 days)

#### **Task 1: Audio File Storage** 📁
- [ ] Add audio file upload endpoint (`POST /api/modules/:id/audio`)
- [ ] Create audio storage service
- [ ] Support audio file types (MP3, WAV, OGG)
- [ ] Store audio URLs in module schema
- [ ] Add audio content API (`GET /api/modules/:id/audio`)
- [ ] Test audio file upload
- [ ] Test audio file retrieval

#### **Task 2: Enhance Quiz Schema for Audio/Image Questions** 📝
- [ ] Add `audioUrl` field to quiz question schema
- [ ] Add `imageUrl` field to quiz question schema
- [ ] Add `questionType` enum: `text`, `audio`, `image`, `picture-only`
- [ ] Update quiz validation to support new question types
- [ ] Update seed data script to include audio/image questions
- [ ] Test quiz schema with new question types

#### **Task 3: Audio-Question Quiz Support** 🎵
- [ ] Create audio-question quiz type
- [ ] Add audio playback support in API response
- [ ] Support image-based answer options
- [ ] Add audio narration for questions
- [ ] Test audio-question quiz creation
- [ ] Test audio-question quiz retrieval

#### **Task 4: Image-Based Quiz Support** 🖼️
- [ ] Enhance quiz schema for image-to-image questions
- [ ] Add picture-only quiz options
- [ ] Support visual answer options (images instead of text)
- [ ] Test image-based quiz creation
- [ ] Test image-based quiz retrieval

---

### **MOBILE TASKS** (1-2 weeks)

#### **Task 5: Text-to-Speech (TTS) Integration** 🔊
- [ ] Add `flutter_tts` package to `pubspec.yaml`
- [ ] Create TTS service (`lib/core/services/tts_service.dart`)
- [ ] Implement text-to-speech conversion
- [ ] Add language support (English, Hindi)
- [ ] Add speech rate/pitch controls
- [ ] Test TTS with sample text
- [ ] Test TTS with different languages

#### **Task 6: Audio Player Component** 🎧
- [ ] Add audio player package (`audioplayers` or `just_audio`)
- [ ] Create audio player widget (`lib/features/modules/widgets/audio_player_widget.dart`)
- [ ] Implement play/pause/stop controls
- [ ] Add progress indicator
- [ ] Add seek functionality
- [ ] Support pre-recorded audio playback
- [ ] Test audio player with local files
- [ ] Test audio player with remote URLs

#### **Task 7: Tap-to-Listen Functionality** 👆
- [ ] Create tap-to-listen widget wrapper
- [ ] Add tap gesture detection
- [ ] Integrate TTS service
- [ ] Add audio icon/button
- [ ] Add loading state while speaking
- [ ] Add stop/restart functionality
- [ ] Test tap-to-listen on module text
- [ ] Test tap-to-listen on quiz questions

#### **Task 8: Lottie Animations** ✨
- [ ] Add `lottie` package to `pubspec.yaml`
- [ ] Create animation widget (`lib/features/modules/widgets/lottie_animation_widget.dart`)
- [ ] Add sample disaster animations (earthquake, fire, flood)
- [ ] Integrate animations into module content
- [ ] Test animation playback
- [ ] Optimize animation file sizes

#### **Task 9: Visual Content Enhancements** 🎨
- [ ] Enhance module detail screen for image-heavy content
- [ ] Add image gallery view
- [ ] Add fullscreen image viewer
- [ ] Improve visual navigation (swipe gestures)
- [ ] Add visual progress indicators
- [ ] Test image-heavy module viewing

#### **Task 10: Picture-Based Quiz UI** 🖼️
- [ ] Create picture quiz widget (`lib/features/quiz/widgets/picture_quiz_widget.dart`)
- [ ] Design image-to-image quiz interface
- [ ] Add visual answer selection (tap on images)
- [ ] Add image preview/zoom
- [ ] Implement picture-only quiz support
- [ ] Test picture quiz functionality

#### **Task 11: Audio-Question Quiz UI** 🎵
- [ ] Create audio quiz widget (`lib/features/quiz/widgets/audio_quiz_widget.dart`)
- [ ] Add audio playback button for questions
- [ ] Design image-based answer options
- [ ] Implement "listen and tap to answer" flow
- [ ] Add audio replay functionality
- [ ] Test audio-question quiz flow

#### **Task 12: Teacher-Assisted Group Quiz** 👨‍🏫
- [ ] Create group quiz mode toggle
- [ ] Design projector-friendly UI
- [ ] Add teacher controls (next question, reveal answer)
- [ ] Implement group quiz state management
- [ ] Test group quiz in projector mode

#### **Task 13: Module Screen Updates** 📚
- [ ] Add audio narration button to module content
- [ ] Add TTS for all text content in modules
- [ ] Integrate audio player for pre-recorded audio
- [ ] Add visual navigation aids
- [ ] Update module UI for non-readers
- [ ] Test complete module experience

#### **Task 14: Quiz Screen Updates** ✅
- [ ] Add support for all quiz types (text, audio, image, picture-only)
- [ ] Integrate TTS for quiz questions
- [ ] Add audio playback for audio questions
- [ ] Update quiz UI for non-readers
- [ ] Test all quiz types

---

### **TESTING TASKS** (2-3 days)

#### **Task 15: Unit Tests** 🧪
- [ ] Test TTS service
- [ ] Test audio player widget
- [ ] Test picture quiz widget
- [ ] Test audio quiz widget
- [ ] Test tap-to-listen functionality

#### **Task 16: Integration Tests** 🔗
- [ ] Test audio narration in modules
- [ ] Test picture quiz flow
- [ ] Test audio-question quiz flow
- [ ] Test offline audio playback (if cached)
- [ ] Test TTS with different languages

#### **Task 17: Manual Testing** 👤
- [ ] Test with KG-5 student (age-appropriate)
- [ ] Verify audio narration works
- [ ] Verify picture quizzes work
- [ ] Verify audio quizzes work
- [ ] Verify visual navigation works
- [ ] Verify all content is accessible without reading

#### **Task 18: Accessibility Testing** ♿
- [ ] Test with screen reader
- [ ] Test with voice commands
- [ ] Verify large tap targets
- [ ] Verify visual contrast
- [ ] Test with assistive technologies

---

### **DOCUMENTATION TASKS** (1 day)

#### **Task 19: Documentation** 📖
- [ ] Document TTS integration
- [ ] Document audio player usage
- [ ] Document picture quiz creation
- [ ] Document audio quiz creation
- [ ] Create user guide for teachers
- [ ] Update API documentation

---

## 🎯 **Acceptance Criteria**

### **Must Have (Critical)**
- [ ] ✅ All text content has TTS support
- [ ] ✅ Tap-to-listen works for all text
- [ ] ✅ Audio player plays pre-recorded audio
- [ ] ✅ Image-to-image quizzes work
- [ ] ✅ Audio-question quizzes work
- [ ] ✅ Picture-only quizzes work

### **Should Have (Important)**
- [ ] ✅ Lottie animations display correctly
- [ ] ✅ Visual navigation is intuitive
- [ ] ✅ Teacher-assisted group quiz works
- [ ] ✅ Audio works offline (if cached)
- [ ] ✅ Visual content loads offline

### **Nice to Have (Optional)**
- [ ] ✅ Multiple language support (Hindi)
- [ ] ✅ Voice assistant mode
- [ ] ✅ Gesture-based navigation

---

## 📦 **Dependencies**

### **Backend**
- No new dependencies (uses existing storage)

### **Mobile**
- `flutter_tts` - Text-to-Speech
- `audioplayers` or `just_audio` - Audio playback
- `lottie` - Animations
- `cached_network_image` - Image caching (already installed)

---

## 🏗️ **File Structure**

### **Backend**
```
backend/src/
  ├── controllers/
  │   └── audioController.js (new)
  ├── services/
  │   └── audioService.js (new)
  └── models/
      └── Module.js (update for audio fields)
```

### **Mobile**
```
mobile/lib/
  ├── core/services/
  │   └── tts_service.dart (new)
  ├── features/
  │   ├── modules/widgets/
  │   │   ├── audio_player_widget.dart (new)
  │   │   ├── lottie_animation_widget.dart (new)
  │   │   └── tap_to_listen_widget.dart (new)
  │   └── quiz/widgets/
  │       ├── picture_quiz_widget.dart (new)
  │       └── audio_quiz_widget.dart (new)
```

---

## 🚀 **Implementation Order**

### **Week 1: Foundation**
1. **Day 1-2**: Backend audio storage and quiz enhancements
2. **Day 3-4**: Mobile TTS integration and audio player
3. **Day 5**: Tap-to-listen functionality

### **Week 2: Quiz Features**
1. **Day 1-2**: Picture-based quiz UI
2. **Day 3-4**: Audio-question quiz UI
3. **Day 5**: Visual enhancements and animations

### **Week 3: Polish & Testing**
1. **Day 1-2**: Module screen updates
2. **Day 3**: Testing and bug fixes
3. **Day 4**: Documentation
4. **Day 5**: Final review and deployment

---

## 📝 **Testing Checklist**

### **Audio Features**
- [ ] TTS reads all text content correctly
- [ ] Tap-to-listen works on all text elements
- [ ] Audio player plays pre-recorded audio
- [ ] Audio controls (play/pause/stop) work
- [ ] Audio works offline (if cached)
- [ ] Multiple languages supported (if implemented)

### **Visual Features**
- [ ] Lottie animations play correctly
- [ ] Images load and display properly
- [ ] Visual navigation works (swipe, tap)
- [ ] Image gallery works
- [ ] Fullscreen image viewer works

### **Quiz Features**
- [ ] Picture quizzes work correctly
- [ ] Audio-question quizzes work correctly
- [ ] Picture-only quizzes work correctly
- [ ] Quiz answers can be selected visually
- [ ] Quiz submission works for all types

### **Integration**
- [ ] Modules work with audio/visual enhancements
- [ ] Quizzes work with all question types
- [ ] Offline mode works with cached audio/images
- [ ] Sync works for quiz results from non-reader modes

---

## ✅ **Phase 3.1.3 Completion Criteria**

Phase 3.1.3 is complete when:
1. ✅ All backend audio/image support is implemented
2. ✅ TTS works for all text content
3. ✅ Audio player works for pre-recorded content
4. ✅ Picture quizzes are functional
5. ✅ Audio-question quizzes are functional
6. ✅ Visual navigation is intuitive
7. ✅ All features work offline (if cached)
8. ✅ Testing is complete
9. ✅ Documentation is updated

---

## 🎉 **Ready to Start!**

This phase is **CRITICAL** for KG-5 students who cannot read. It enables full participation in the learning system.

**Next Phase**: Phase 3.1.4 - AI-Powered Quiz Generation

---

**Status**: 📋 **READY FOR IMPLEMENTATION**

**Created**: 2025-01-27

**Last Updated**: 2025-01-27

