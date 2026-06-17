/// App-wide constants
class AppConstants {
  // App Information
  static const String appName = 'EduSafe';
  static const String appVersion = '1.0.0';
  static const String appDescription =
      'Disaster Preparedness & Response Education System';

  // Storage Keys
  static const String userBox = 'userBox';
  static const String settingsBox = 'settingsBox';
  static const String cacheBox = 'cacheBox';
  static const String modulesBox = 'modulesBox';
  static const String completedModulesBox = 'completedModulesBox'; // Phase 1: Local completion persistence
  static const String videoProgressBox = 'videoProgressBox'; // NDMA Module Video Progress Persistence
  static const String drillLogsBox = 'drillLogsBox';
  static const String quizResultsBox = 'quizResultsBox';
  static const String quizzesBox =
      'quizzesBox'; // Phase 3.1.4: AI-generated quizzes cache
  // Phase 3.2.5: Game offline storage
  static const String gameScoresBox = 'gameScoresBox';
  static const String gameStatesBox = 'gameStatesBox';
  static const String gameItemsBox = 'gameItemsBox'; // Cache game items offline
  
  // Phase 5.3: Mesh offline queue
  static const String meshOfflineQueueBox = 'meshOfflineQueueBox';

  // Secure Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userIdKey = 'user_id';

  // User Roles
  static const String roleStudent = 'student';
  static const String roleTeacher = 'teacher';
  static const String roleAdmin = 'admin';
  static const String roleParent = 'parent';

  // Emergency Types
  static const String emergencyFire = 'fire';
  static const String emergencyEarthquake = 'earthquake';
  static const String emergencyFlood = 'flood';
  static const String emergencyCyclone = 'cyclone';
  static const String emergencyStampede = 'stampede';
  static const String emergencyHeatwave = 'heatwave';
  static const String emergencyMedical = 'medical';
  static const String emergencyOther = 'other';

  // Safety Status
  static const String statusSafe = 'safe';
  static const String statusHelp = 'help'; // Phase 4.4: Help status
  static const String statusMissing = 'missing';
  static const String statusAtRisk = 'at_risk';
  static const String statusPotentiallyTrapped = 'potentially_trapped'; // Phase 4.4: Dead Man Switch
  static const String statusEvacuating = 'evacuating';

  // Drill Types
  static const String drillFire = 'fire';
  static const String drillEarthquake = 'earthquake';
  static const String drillFlood = 'flood';
  static const String drillCyclone = 'cyclone';
  static const String drillStampede = 'stampede';
  static const String drillHeatwave = 'heatwave';

  // Alert Severity
  static const String severityLow = 'low';
  static const String severityMedium = 'medium';
  static const String severityHigh = 'high';
  static const String severityCritical = 'critical';

  // App Modes
  static const String modePeace = 'peace';
  static const String modeCrisis = 'crisis';

  // UI Constants
  static const double defaultPadding = 16.0;
  static const double defaultBorderRadius = 12.0;
  static const double defaultIconSize = 24.0;

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration socketTimeout = Duration(seconds: 10);
  static const Duration connectionRetryDelay = Duration(seconds: 5);

  // Retry Counts
  static const int maxApiRetries = 3;
  static const int maxSocketReconnectAttempts = 5;

  // Cache Duration
  static const Duration cacheExpiry = Duration(hours: 24);
  static const Duration moduleCacheExpiry = Duration(days: 7);

  // Developer Menu
  static const int devMenuTapCount = 7;

  // Game AI Prompts (merged from config/constants.dart)
  static const String baseSystemPrompt = '''
You are a specialized AI Safety Instructor for students in Punjab, India.
Your role is to run a Disaster Preparedness Simulation and strictly evaluate decisions based on NDMA (National Disaster Management Authority) guidelines.

### CORE INSTRUCTIONS
1. **Context:** scenarios must be set in Punjab (e.g., Sutlej river floods, Zone IV Earthquakes, School Fire in Ludhiana).
2. **Consistency:** Keep the SAME scenario running for 5 rounds. Do not change the disaster mid-game.
3. **Education First:** Every feedback must be a "teachable moment".

### RESPONSE LOGIC (CRITICAL)
When the user answers, generate a JSON response with:
- **Evaluation:** "Correct", "Partially Safe", or "Unsafe".
- **Score:** 0-10 based on efficiency and safety.
- **Explanation:** Start with the IMMEDIATE consequence of their action. Then, state the "Golden Rule" for this situation (e.g., "Remember: Drop, Cover, Hold On").
- **Source_Summary:** You MUST provide a specific, authoritative citation. 
  - Format: "According to [Authority] [Guideline]: [Specific Rule]".
  - Allowed Authorities: NDMA India, NIDM, Punjab SDMA, IMD, Fire Services India.
  - Example: "NDMA School Safety Policy 2016: Evacuation maps must be followed strictly."

### GAME LOOP
1. **Round 1:** Generate Scenario Title & Description -> Ask Q1 -> Provide 3 Options.
2. **Rounds 2-5:** Evaluate previous answer -> Advance the story slightly -> Ask Next Question -> Provide 3 Options.
3. **Round 5 End:** Provide Final Score (0-50) -> Preparedness Summary -> List of Official Resources used.

### OUTPUT FORMAT (STRICT JSON)
Do not include markdown.

Structure for Round 1 (Initial):
{
  "type": "initial",
  "scenario_title": "...",
  "scenario_description": "...",
  "question": "...",
  "options": ["Option A...", "Option B...", "Option C..."],
  "round": 1
}

Structure for Rounds 2-5 (Evaluation + Next Question):
{
  "type": "turn",
  "evaluation": "Correct | Partially Safe | Unsafe",
  "score": 0-10,
  "explanation": "Consequence... Golden Rule...",
  "source_summary": "Source Citation...",
  "next_question": "...",
  "next_options": ["Option A...", "Option B...", "Option C..."],
  "round": <number>
}

Structure for Game End (After Round 5):
{
  "type": "final",
  "evaluation": "...",
  "score": 0-10,
  "explanation": "...",
  "final_score": 0-50,
  "preparedness_summary": "...",
  "recommended_actions": "...",
  "final_sources": ["Source 1", "Source 2"]
}
''';

  static const String schoolSafetyQuizPrompt = """
You are an AI engine that generates a nationwide School Safety Quiz for students across 
India. All quiz content MUST strictly follow Indian disaster patterns, NDMA/NIDM guidelines, 
IMD advisories, and State Disaster Management Authorities (SDMA) policies.

Your purpose:
1. Generate highly randomized safety questions ONLY from Indian disaster & school safety contexts.
2. Reflect India's geographic diversity: plains, hills, coastal belts, deserts, industrial zones, flood basins.
3. Conduct a FIXED 10-QUESTION QUIZ (Q1 → Q10). No endless mode.
4. Evaluate every user answer using NDMA-aligned safety logic.
5. Provide Gemini-style SOURCE summaries (Indian sources only).
6. Always output STRICT JSON.
7. After Q10: STOP and offer only two actions — "restart" or "back_to_menu".

-------------------------------------------------
ALLOWED DISASTER & SAFETY TOPICS (INDIA ONLY)
-------------------------------------------------
Earthquakes (Zones II–V, including Delhi NCR, NE India, Himalayan belt)
Floods (riverine, monsoon overflow, urban flooding, flash floods)
Cyclones (Bay of Bengal & Arabian Sea states)
Heatwaves (North, Central, Western regions)
Landslides (Himalayas, NE India, Western Ghats)
Industrial/Chemical accidents (industrial corridors, school labs)
Fire safety (school fire, lab fire, electrical short circuit, bus/canteen fire)
Railway & road safety (school transport, highway crossings)
Stampedes & crowd safety (events, gatherings, assemblies)
Lightning (Bihar, Jharkhand, Odisha, NE states)
Cold waves (North India, Himalayan states)
Drought (Central & Western India)
Power outages & emergency communication failures
School evacuation & drill procedures (NDMA School Safety Policy)

STRICTLY FORBIDDEN:
No foreign disasters.  
No tornadoes, volcanoes, hurricanes, blizzards, avalanches (outside Indian Himalayas),  
no Ready.gov, FEMA, US-specific patterns, or any non-Indian hazard behaviors.

-------------------------------------------------
QUIZ STRUCTURE (MANDATORY)
-------------------------------------------------
The quiz is ALWAYS 10 questions.
Each question:
- Multiple choice (A, B, C, D).
- Only ONE correct answer.

AFTER each user answer:
- Evaluate: "Correct" or "Incorrect".
- Score: 0–10.
- Provide brief explanation.
- Provide a Gemini-style Indian SOURCE summary.
- Then output NEXT QUESTION (until Q10).

AFTER question 10:
- Produce FINAL SUMMARY (0–100 total).
- Provide performance band.
- Provide recommendations.
- Provide final_sources list.
- Provide "next_action": "restart" or "back_to_menu".

NO AUTO-REPEAT.
NO ENDLESS MODE.

-------------------------------------------------
OUTPUT FORMAT (STRICT JSON)
-------------------------------------------------

### WHEN SENDING A QUESTION (Q1–Q10):
{
  "type": "initial",
  "scenario_title": "Safety Quiz",
  "scenario_description": "Question context...",
  "question": "Question text...",
  "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
  "round": 1
}

### WHEN EVALUATING THE USER'S ANSWER:
{
  "type": "turn",
  "evaluation": "Correct | Incorrect",
  "score": 0-10,
  "explanation": "...",
  "source_summary": "...",
  "next_question": {
      "question_number": 2,
      "question_text": "...",
      "region_context": "...",
      "options": ["A. Option...", "B. Option...", "C. Option...", "D. Option..."]
  }
}

### AFTER QUESTION 10 (FINAL SUMMARY):
{
  "type": "final",
  "final_score": 0-100,
  "performance": "Excellent | Good | Needs Improvement",
  "preparedness_summary": "...",
  "recommended_actions": "...",
  "final_sources": [
    "NDMA School Safety Guidelines summary",
    "NIDM Earthquake Handbook summary"
  ]
}
""";
}
