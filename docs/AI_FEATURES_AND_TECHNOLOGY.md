# Kavach – AI Features & Technology (For Judges)

**Use this document when judges ask: “What AI did you use? For what? Image, voice, text-to-speech?”**

---

## 1. High-level summary

| Category | What we use | Where it runs |
|----------|-------------|----------------|
| **Image / Vision AI** | Google Gemini (vision) | Backend only |
| **Text / Language AI** | Google Gemini (text) | Backend only |
| **Speech-to-Text (STT)** | `speech_to_text` (Flutter plugin, on-device) | Mobile app only |
| **Text-to-Speech (TTS)** | `flutter_tts` (Flutter plugin, on-device) | Mobile app only |

- **Cloud AI:** All generative AI (image understanding, text generation, summaries, Q&A, scenario, etc.) is done on the **backend** using **Google Gemini API** (`gemini-2.5-flash` by default). The mobile and web apps do **not** call any AI API directly; they call our backend REST APIs.
- **Voice:** Speech-to-text and text-to-speech run **on the device** using Flutter plugins. There is **no cloud voice API** (no Google Cloud Speech-to-Text / Text-to-Speech in our stack). Voice is used to **input questions** and **hear AI replies** in the “Ask Kavach” chatbot.

---

## 2. Image / Vision AI (all via Gemini on backend)

Every vision feature sends a **base64 image** from the client to the backend; the backend calls **Gemini with image + prompt** and returns structured JSON.

| # | Feature | What it does | API endpoint | Used in |
|---|---------|--------------|--------------|---------|
| 1 | **Hazard detection** | Analyzes photo for fire, structural, electrical hazards. Returns: hazardDetected, hazardType, severity, description, recommendations, confidence. | `POST /api/ai/analyze` | Mobile (hazard scan), Web (upload) |
| 2 | **Evacuation route check** | Is corridor/exit clear, blocked, or partially blocked? Returns: status, reason, recommendation. | `POST /api/ai/evacuation/check` | Mobile (evacuation check screen) |
| 3 | **Floor plan analysis** | Suggests assembly points, primary/secondary exits, bottlenecks from floor plan image. | `POST /api/ai/floorplan/analyze` | Web (floor plan tool) |
| 4 | **Damage scan** | Post-drill/post-incident: damage yes/no, severity, description, follow-up suggestion. | `POST /api/ai/damage/scan` | Web (after drill/incident) |
| 5 | **Describe image (accessibility)** | Plain-language 2–3 sentence description of image for visually impaired users. | `POST /api/ai/describe` | Mobile/Web (optional “describe image”) |

**Technology:** Backend: `@google/generative-ai` (GoogleGenerativeAI), `model.generateContent([prompt, ...imageParts])` with `inlineData: { data: imageBase64, mimeType }`. Model: `gemini-2.5-flash` (configurable via `GEMINI_MODEL`).

---

## 3. Text / Language AI (all via Gemini on backend)

All text features use **Gemini text** (no image). Client sends text or parameters; backend returns generated text or JSON.

| # | Feature | What it does | API endpoint | Used in |
|---|---------|--------------|--------------|---------|
| 1 | **Today’s safety tip** | One short (1–2 sentence) disaster safety tip for schools. Cached per day; optional translation (hi, mr, etc.). | `GET /api/ai/tip/today?lang=...` | Mobile (home/dashboard), Web |
| 2 | **Ask Kavach (Q&A)** | User asks a safety question; AI answers in 2–4 sentences. Optional language: en, hi, mr (answer in that language). | `POST /api/ai/ask` | Mobile (Ask Kavach tab – text + voice), Web |
| 3 | **Disaster scenario (game)** | Interactive “choose your own adventure”: AI generates scenario steps, options, consequences, game-over feedback and tip. | `POST /api/ai/scenario/next` | Mobile (Disaster Scenario game) |
| 4 | **Quiz generation** | Generates multiple-choice quiz questions from module content (number, difficulty, grade level). Cached. | `GET /api/ai/quiz/generate/:moduleId` | Mobile (module quiz), Web |
| 5 | **Drill report summary** | After a drill: 2–3 sentence summary + one improvement tip (from type, participant count, response time, etc.). | `POST /api/ai/drill/summarise` | Web (drill detail) |
| 6 | **Incident report summariser** | Long incident text → 3–5 bullet points (what happened, cause, actions, lessons). | `POST /api/ai/incident/summarise` | Web (incident flow) |
| 7 | **Alert message draft** | Draft short crisis alert (type + severity). Max ~160 chars (SMS/push length). | `POST /api/ai/alert/draft` | Web (broadcast/alert) |
| 8 | **Crisis message to parents** | Draft short, calm message to parents (incident type, severity, one-line description). Max ~160 chars. | `POST /api/ai/crisis-parent-message` | Web (incident detail, broadcast) |
| 9 | **Guideline summariser** | Long guideline document → 5–7 bullet points for teachers. | `POST /api/ai/guideline/summarise` | Web (guideline tool) |
| 10 | **Drill feedback (student)** | One short, encouraging sentence for a student after drill (acknowledged, response time, drill type). | `POST /api/ai/drill/feedback` | Mobile (drill completion) |
| 11 | **Next module recommendation** | Suggests next learning module from completed titles/grades and available titles. | `POST /api/ai/recommend/next-module` | Mobile (learning path) |
| 12 | **Quiz difficulty suggestion** | Suggests beginner / intermediate / advanced from grade level and optional last quiz score. | `POST /api/ai/quiz/suggest-difficulty` | Mobile (quiz setup) |
| 13 | **Translate safety text** | Translates safety message to Hindi, Marathi, Punjabi, etc. | `POST /api/ai/translate` | Backend (e.g. tip translation); can be used from Web |
| 14 | **Simplify for grade** | Simplifies educational text for lower grade / age. | `POST /api/ai/simplify` | Web (content editor / accessibility) |
| 15 | **School safety report card** | Last 30 days stats → grade (A–F), strengths, improvements, one bold next step. | `POST /api/ai/report-card` | Web (admin report) |

**Technology:** Backend: same Gemini client, `getTextModel()` → `model.generateContent(prompt)`. All prompts and response parsing (JSON or plain text) are implemented in `backend/src/services/ai.service.js`.

---

## 4. Voice: Speech-to-Text (STT) and Text-to-Speech (TTS)

Voice is **not** a cloud AI service in our project. We use **on-device** Flutter plugins.

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Speech-to-Text (STT)** | `speech_to_text` (Flutter plugin, v7.x) | User **speaks** their question in the Ask Kavach screen; plugin converts speech to text, which is then sent to `POST /api/ai/ask` (same as typed questions). |
| **Text-to-Speech (TTS)** | `flutter_tts` (Flutter plugin, v4.x) | **Reads aloud** the AI’s reply in Ask Kavach (and optionally today’s tip or other content). User can tap “Listen” on a message to hear it. |

**Flow:**
1. User taps mic → STT listens → text is sent to backend `/api/ai/ask` → Gemini generates answer.
2. Backend returns answer text → mobile app shows it and can play it with TTS (auto or on “Listen” tap).

**Where it’s used:**
- **Ask Kavach screen** (mobile): type **or** speak question; read reply **or** hear it via TTS.
- **Tap-to-listen** (e.g. module content, quiz questions): TTS only, for accessibility.
- **Kid module screen**: optional TTS for module name (no Gemini involved in voice part).

**We do not use:** Google Cloud Speech-to-Text, Google Cloud Text-to-Speech, or any other cloud voice API. Only on-device STT/TTS.

---

## 5. Where each technology lives (code reference)

| Layer | What | Location |
|-------|------|----------|
| **AI (Gemini) – all features** | Image + text generation, prompts, parsing | `backend/src/services/ai.service.js` |
| **AI API routes** | REST endpoints for all AI features | `backend/src/routes/ai.routes.js` |
| **AI controllers** | Request/response handling, error handling (e.g. 503 for quota) | `backend/src/controllers/ai.controller.js` |
| **Quiz generation (AI)** | Uses ai.service + cache | `backend/src/controllers/quiz.controller.js` |
| **STT (speech-to-text)** | Listen for voice input | `mobile/lib/features/dashboard/screens/ask_kavach_screen.dart`, `mobile/lib/core/services/voice_service.dart` |
| **TTS (text-to-speech)** | Speak text aloud | `mobile/lib/core/services/tts_service.dart` (uses `flutter_tts`), used in Ask Kavach and tap-to-listen |
| **Tap-to-listen widget** | TTS for content/quiz | `mobile/lib/features/modules/widgets/tap_to_listen_widget.dart` |

---

## 6. One-line answers for judges

| Question | Answer |
|----------|--------|
| **What AI do you use?** | Google Gemini (vision + text) on the backend for all image and text AI. On mobile we use on-device speech-to-text and text-to-speech (Flutter plugins), not a cloud voice AI. |
| **For images?** | Gemini vision: hazard detection, evacuation route check, floor plan analysis, damage scan, and image description for accessibility. All via backend APIs. |
| **For voice?** | Speech-to-text and text-to-speech are on-device (Flutter: `speech_to_text`, `flutter_tts`). They are used to talk to the AI chatbot and hear its replies; the “AI” part is still Gemini on the backend. |
| **For text?** | Gemini text for: today’s tip, Ask Kavach Q&A, disaster scenario game, quiz generation, drill summary, incident/guideline summariser, alert and parent message drafts, drill feedback, recommendations, translation, simplification, and school report card. |
| **Where does the AI run?** | All generative AI runs on our backend (Node.js) using the Gemini API. Mobile and web are clients that call our REST APIs; they do not call Gemini directly. |

---

## 7. Quick checklist (for demo / Q&A)

- [ ] **Image AI:** Show hazard scan or evacuation check (upload image → result).
- [ ] **Text AI:** Show Ask Kavach (type or speak question → answer); or today’s tip; or one scenario step.
- [ ] **Voice:** Show “Talk to Kavach” (mic → speak → hear reply with TTS).
- [ ] **Clarify:** “We use Gemini for all generative AI; voice is on-device STT/TTS so users can speak and hear the same AI chatbot.”

---

*This document reflects the current codebase. Backend AI: `backend/src/services/ai.service.js` + `ai.controller.js` + `ai.routes.js`. Mobile voice: `speech_to_text`, `flutter_tts` in Ask Kavach and tap-to-listen.*
