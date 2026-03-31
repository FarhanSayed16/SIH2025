import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../config/logger.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  logger.warn('⚠️  GEMINI_API_KEY not set. AI features will be disabled.');
}

let genAI = null;

if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  logger.info(`Gemini AI configured (model: ${modelName}). Restart server after changing .env.`);
}

/**
 * Analyze hazard in image using Gemini AI (Add-on 3)
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Promise<Object>} Analysis result
 */
export const analyzeHazard = async (imageBase64, mimeType = 'image/jpeg') => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    // Prepare image
    const imageParts = [
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType
        }
      }
    ];

    // Get model - use gemini-2.5-flash (stable and fast)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create prompt
    const prompt = `Analyze this image for safety hazards in a school/educational institution context. 
    
Look for:
- Fire hazards (exposed wires, overheating equipment, flammable materials)
- Structural hazards (cracks, loose fixtures, blocked exits)
- Electrical hazards (damaged outlets, exposed wiring, water near electrical)
- Other safety concerns

Return a JSON response with:
{
  "hazardDetected": true/false,
  "hazardType": "fire" | "structural" | "electrical" | "other" | null,
  "severity": "low" | "medium" | "high" | null,
  "description": "Detailed description of the hazard",
  "recommendations": ["recommendation1", "recommendation2"],
  "confidence": 0.0-1.0
}`;

    // Generate content
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      // If JSON parsing fails, create structured response from text
      logger.warn('Failed to parse Gemini JSON response, creating structured response');
      analysis = {
        hazardDetected: text.toLowerCase().includes('hazard') || text.toLowerCase().includes('danger'),
        hazardType: extractHazardType(text),
        severity: extractSeverity(text),
        description: text,
        recommendations: extractRecommendations(text),
        confidence: 0.7,
        rawResponse: text
      };
    }

    logger.info(`AI hazard analysis completed: ${analysis.hazardDetected ? 'Hazard detected' : 'No hazard'}`);

    return analysis;
  } catch (error) {
    logger.error('AI analysis error:', error);
    throw new Error(`AI analysis failed: ${error.message}`);
  }
};

/**
 * Extract hazard type from text
 */
const extractHazardType = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('fire') || lowerText.includes('smoke') || lowerText.includes('flame')) {
    return 'fire';
  }
  if (lowerText.includes('structural') || lowerText.includes('crack') || lowerText.includes('damage')) {
    return 'structural';
  }
  if (lowerText.includes('electrical') || lowerText.includes('wire') || lowerText.includes('outlet')) {
    return 'electrical';
  }
  return 'other';
};

/**
 * Extract severity from text
 */
const extractSeverity = (text) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes('critical') || lowerText.includes('severe') || lowerText.includes('urgent')) {
    return 'high';
  }
  if (lowerText.includes('moderate') || lowerText.includes('medium')) {
    return 'medium';
  }
  return 'low';
};

/**
 * Extract recommendations from text
 */
const extractRecommendations = (text) => {
  const recommendations = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.toLowerCase().includes('recommend') || 
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('action')) {
      recommendations.push(line.trim());
    }
  }
  
  return recommendations.slice(0, 5); // Max 5 recommendations
};

/**
 * Phase 3.1.4: Generate quiz questions from module content using Gemini AI
 * @param {string} moduleText - Text content from the module
 * @param {Object} options - Quiz generation options
 * @param {number} options.numQuestions - Number of questions to generate (default: 5)
 * @param {string} options.difficulty - Difficulty level: 'beginner', 'intermediate', 'advanced' (default: 'beginner')
 * @param {string} options.gradeLevel - Grade level for appropriate language (default: 'all')
 * @returns {Promise<Array>} Array of quiz questions
 */
export const generateQuizQuestions = async (moduleText, options = {}) => {
  try {
    if (!genAI) {
      throw new Error('Gemini API key not configured');
    }

    const {
      numQuestions = 5,
      difficulty = 'beginner',
      gradeLevel = 'all'
    } = options;

    // Get model - use gemini-2.5-flash (stable and fast)
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });

    // Create prompt for quiz generation
    const difficultyInstructions = {
      beginner: 'simple, easy-to-understand questions suitable for young learners (ages 5-8)',
      intermediate: 'moderate difficulty questions suitable for middle school students (ages 9-13)',
      advanced: 'challenging questions suitable for high school students (ages 14-18)'
    };

    const prompt = `You are an educational content creator specializing in disaster preparedness and safety education.

Generate ${numQuestions} multiple-choice quiz questions based on the following module content about disaster safety:

${moduleText}

Requirements:
- Generate exactly ${numQuestions} questions
- Difficulty level: ${difficultyInstructions[difficulty] || difficultyInstructions.beginner}
- Each question should have exactly 4 answer options (A, B, C, D)
- Only ONE option should be correct
- Questions should test understanding, not just memorization
- Make questions age-appropriate for ${gradeLevel === 'all' ? 'all ages' : `grade ${gradeLevel}`}
- Include a brief explanation for each correct answer

Return ONLY a valid JSON array in this exact format (no markdown, no additional text):
[
  {
    "question": "Question text here",
    "questionType": "text",
    "options": [
      "Option A text",
      "Option B text",
      "Option C text",
      "Option D text"
    ],
    "correctAnswer": 0,
    "points": 10,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Important:
- "correctAnswer" is the INDEX (0-3) of the correct option in the options array
- Return ONLY the JSON array, nothing else
- Make sure the JSON is valid and parseable`;

    logger.info(`Generating ${numQuestions} quiz questions (difficulty: ${difficulty}, grade: ${gradeLevel})`);

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response
    let questions;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\[[\s\S]*\]/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text.trim();
      
      // Clean up the JSON string (remove markdown, whitespace)
      let cleanedJson = jsonString.trim();
      if (cleanedJson.startsWith('```json')) {
        cleanedJson = cleanedJson.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      } else if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/```\s*/g, '');
      }
      
      questions = JSON.parse(cleanedJson);
      
      // Validate questions structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Validate each question
      questions = questions.map((q, index) => {
        if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Invalid question structure at index ${index}`);
        }
        if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer > 3) {
          throw new Error(`Invalid correctAnswer at index ${index}: must be 0-3`);
        }
        return {
          question: q.question,
          questionType: q.questionType || 'text',
          options: q.options.map((opt, optIdx) => ({
            text: typeof opt === 'string' ? opt : opt.text || String(opt),
            imageUrl: typeof opt === 'object' && opt.imageUrl ? opt.imageUrl : null,
            audioUrl: typeof opt === 'object' && opt.audioUrl ? opt.audioUrl : null
          })),
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          explanation: q.explanation || '',
          explanationImage: q.explanationImage || null
        };
      });

      logger.info(`Successfully generated ${questions.length} quiz questions`);
      return questions;
    } catch (parseError) {
      logger.error('Failed to parse quiz questions from Gemini response:', parseError);
      logger.error('Raw response:', text.substring(0, 500));
      throw new Error(`Failed to parse quiz questions: ${parseError.message}`);
    }
  } catch (error) {
    logger.error('AI quiz generation error:', error);
    throw new Error(`Quiz generation failed: ${error.message}`);
  }
};

// --- Category A: Vision & Image (beyond hazard) ---

/**
 * Helper: build image parts and get model for vision calls
 */
const getModelAndImageParts = (imageBase64, mimeType = 'image/jpeg') => {
  if (!genAI) throw new Error('Gemini API key not configured');
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });
  const imageParts = [{ inlineData: { data: imageBase64, mimeType } }];
  return { model, imageParts };
};

/**
 * Parse JSON from Gemini text response (handles ```json blocks)
 */
const parseJsonFromResponse = (text, fallback) => {
  try {
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : text.trim();
    const cleaned = jsonString.replace(/^```\w*\s*/, '').replace(/\s*```\s*$/, '');
    return JSON.parse(cleaned);
  } catch (e) {
    return fallback;
  }
};

/**
 * A1: Evacuation route check - is corridor/exit clear, blocked, or partially blocked?
 */
export const checkEvacuationRoute = async (imageBase64, mimeType = 'image/jpeg') => {
  try {
    const { model, imageParts } = getModelAndImageParts(imageBase64, mimeType);
    const prompt = `Look at this image of a corridor, exit, or evacuation route in a school. Is the route CLEAR for evacuation, BLOCKED, or PARTIALLY BLOCKED? Return ONLY valid JSON: { "status": "clear" | "blocked" | "partially_blocked", "reason": "one sentence explanation", "recommendation": "one sentence recommendation" }. No markdown.`;
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response?.text() || '';
    const data = parseJsonFromResponse(text, { status: 'unknown', reason: 'Unable to analyze.', recommendation: 'Verify route manually.' });
    if (!data.status) data.status = 'unknown';
    if (!data.reason) data.reason = 'Unable to analyze.';
    if (!data.recommendation) data.recommendation = 'Verify route manually.';
    logger.info(`Evacuation route check: ${data.status}`);
    return data;
  } catch (error) {
    logger.error('Evacuation check error:', error);
    throw new Error(`Evacuation route check failed: ${error.message}`);
  }
};

/**
 * A2: Floor plan analysis - assembly points, exits, bottlenecks
 */
export const analyzeFloorPlan = async (imageBase64, mimeType = 'image/jpeg') => {
  try {
    const { model, imageParts } = getModelAndImageParts(imageBase64, mimeType);
    const prompt = `This image is a floor plan or layout of a school building. Identify: (1) Best assembly points (safe gathering areas), (2) Primary evacuation exits, (3) Secondary exits, (4) Potential bottlenecks (narrow passages, stairs, etc.). Return ONLY valid JSON: { "assemblyPoints": ["string"], "primaryExits": ["string"], "secondaryExits": ["string"], "bottlenecks": ["string"], "summary": "one sentence overall suggestion" }. Use short strings. No markdown.`;
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response?.text() || '';
    const data = parseJsonFromResponse(text, { assemblyPoints: [], primaryExits: [], secondaryExits: [], bottlenecks: [], summary: 'Review floor plan manually.' });
    if (!Array.isArray(data.assemblyPoints)) data.assemblyPoints = [];
    if (!Array.isArray(data.primaryExits)) data.primaryExits = [];
    if (!Array.isArray(data.secondaryExits)) data.secondaryExits = [];
    if (!Array.isArray(data.bottlenecks)) data.bottlenecks = [];
    if (!data.summary) data.summary = 'Review floor plan manually.';
    logger.info('Floor plan analysis completed');
    return data;
  } catch (error) {
    logger.error('Floor plan analysis error:', error);
    throw new Error(`Floor plan analysis failed: ${error.message}`);
  }
};

/**
 * A3: Post-drill / post-incident damage scan
 */
export const scanDamage = async (imageBase64, mimeType = 'image/jpeg') => {
  try {
    const { model, imageParts } = getModelAndImageParts(imageBase64, mimeType);
    const prompt = `This image was taken after a drill or safety incident at a school. Is there any visible damage or concern (e.g. structural, electrical, fire-related)? Return ONLY valid JSON: { "damageDetected": true/false, "severity": "low" | "medium" | "high" | null, "description": "short description", "followUp": "one sentence follow-up suggestion" }. If no damage, severity can be null and followUp can be "No action needed." No markdown.`;
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response?.text() || '';
    const data = parseJsonFromResponse(text, { damageDetected: false, severity: null, description: 'Unable to analyze.', followUp: 'Review manually.' });
    if (typeof data.damageDetected !== 'boolean') data.damageDetected = false;
    if (data.severity === undefined) data.severity = null;
    if (!data.description) data.description = 'Unable to analyze.';
    if (!data.followUp) data.followUp = 'Review manually.';
    logger.info(`Damage scan: ${data.damageDetected ? 'damage' : 'no damage'}`);
    return data;
  } catch (error) {
    logger.error('Damage scan error:', error);
    throw new Error(`Damage scan failed: ${error.message}`);
  }
};

/**
 * A4: Describe image for accessibility (plain text, 2-3 sentences)
 */
export const describeImageForAccessibility = async (imageBase64, mimeType = 'image/jpeg') => {
  try {
    const { model, imageParts } = getModelAndImageParts(imageBase64, mimeType);
    const prompt = `Describe this image in 2-3 simple sentences for a person who cannot see it. The image may show a building, corridor, exit, hazard, or safety-related scene. Focus on: what is visible, where things are, and any important safety-related details. Use plain language. Return ONLY the description text, no labels, no JSON, no quotes.`;
    const result = await model.generateContent([prompt, ...imageParts]);
    const text = (result.response?.text() || '').trim();
    const description = text || 'Image description is currently unavailable.';
    logger.info('Accessibility description generated');
    return { description };
  } catch (error) {
    logger.error('Describe image error:', error);
    throw new Error(`Image description failed: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Category B: Text & NLP
// ---------------------------------------------------------------------------

const getTextModel = () => {
  if (!genAI) throw new Error('Gemini API key not configured');
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * B1: Drill report auto-summary (2-3 sentences + one improvement tip)
 */
export const summariseDrill = async (drillSummary) => {
  try {
    const model = getTextModel();
    const { type, participantCount, acknowledgedCount, avgResponseTimeSeconds, durationMinutes } = drillSummary;
    const prompt = `You are a school safety analyst. Given: drill type ${type || 'unknown'}, ${participantCount ?? 0} participants, ${acknowledgedCount ?? 0} acknowledged, avg response time ${avgResponseTimeSeconds ?? 0} seconds, duration ${durationMinutes ?? 0} min. Return ONLY valid JSON: { "summary": "2-3 sentences summarising the drill outcome", "improvementTip": "one sentence suggestion for improvement" }. No markdown, no other text.`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const data = parseJsonFromResponse(text, { summary: 'Summary unavailable.', improvementTip: 'Review drill logs.' });
    if (!data.summary) data.summary = 'Summary unavailable.';
    if (!data.improvementTip) data.improvementTip = 'Review drill logs.';
    logger.info('Drill summary generated');
    return data;
  } catch (error) {
    logger.error('Drill summarise error:', error);
    throw new Error(`Drill summary failed: ${error.message}`);
  }
};

/** In-memory fallback for today's tip when Redis is unavailable */
let tipMemory = { date: null, text: null };

/**
 * B2: Today's safety tip (cached per day)
 */
export const getTodaysSafetyTip = async (lang = 'en') => {
  const { getCache, setCache } = await import('./cache.service.js');
  const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const cacheKey = `tip:${dateStr}${lang !== 'en' ? `:${lang}` : ''}`;

  try {
    const cached = await getCache('ai', cacheKey);
    if (cached && cached.tip) {
      logger.debug('Today tip cache hit');
      return { tip: cached.tip, date: dateStr };
    }
  } catch (e) {
    logger.debug('Cache get for tip failed', e.message);
  }

  // G1: For non-English, get English tip first then translate
  const englishKey = `tip:${dateStr}`;
  let englishTip = null;
  try {
    const enCached = await getCache('ai', englishKey);
    if (enCached && enCached.tip) englishTip = enCached.tip;
  } catch (_) {}
  if (!englishTip && tipMemory.date === dateStr && tipMemory.text) englishTip = tipMemory.text;

  if (!genAI) {
    const fallback = 'Keep evacuation routes clear and practice drills regularly.';
    if (lang !== 'en' && englishTip) {
      try {
        const { translated } = await translateSafetyText(englishTip, lang);
        return { tip: translated || englishTip, date: dateStr };
      } catch (_) {
        return { tip: englishTip, date: dateStr };
      }
    }
    tipMemory = { date: dateStr, text: englishTip || fallback };
    return { tip: englishTip || fallback, date: dateStr };
  }

  try {
    if (!englishTip) {
      const model = getTextModel();
      const prompt = `Give one short (1-2 sentence) disaster safety tip for schools, in simple English. Only the tip, no quotes or labels.`;
      const result = await model.generateContent(prompt);
      englishTip = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '') || 'Stay calm and follow evacuation procedures.';
      try {
        await setCache('ai', englishKey, { tip: englishTip, date: dateStr }, 86400);
      } catch (e) {
        tipMemory = { date: dateStr, text: englishTip };
      }
    }
    if (lang !== 'en') {
      const { translated } = await translateSafetyText(englishTip, lang);
      const data = { tip: translated || englishTip, date: dateStr };
      try {
        await setCache('ai', cacheKey, data, 86400);
      } catch (_) {}
      return data;
    }
    return { tip: englishTip, date: dateStr };
  } catch (error) {
    logger.error('Today tip error:', error);
    if (tipMemory.date === dateStr && tipMemory.text) {
      return { tip: tipMemory.text, date: dateStr };
    }
    return { tip: 'Stay calm and follow evacuation procedures.', date: dateStr };
  }
};

/**
 * B4: Ask Kavach – answer safety question (2-4 sentences)
 * O6: Optional preferredResponseLang (en, hi, mr) – answer in that language; else auto-detect from question (Hindi/Marathi/Hinglish → same language).
 */
export const answerSafetyQuestion = async (question, preferredResponseLang) => {
  try {
    const model = getTextModel();
    const langHint = preferredResponseLang && ['hi', 'mr', 'en'].includes(String(preferredResponseLang).toLowerCase())
      ? `Answer in ${preferredResponseLang === 'hi' ? 'Hindi' : preferredResponseLang === 'mr' ? 'Marathi' : 'English'}. `
      : 'If the question is in Hindi, Marathi, or Hinglish, answer in the same language. Otherwise answer in English. ';
    const prompt = `You are a school safety expert. Answer this question about disaster preparedness or safety in 2-4 clear sentences. Be accurate and practical. ${langHint}Question: ${question}. Reply with only the answer, no labels or quotes.`;
    const result = await model.generateContent(prompt);
    const answer = (result.response?.text() || '').trim() || 'I could not generate an answer. Please try rephrasing your question.';
    logger.info('Ask Kavach answer generated', { preferredResponseLang: preferredResponseLang || 'auto' });
    return { answer };
  } catch (error) {
    logger.error('Ask Kavach error:', error);
    throw new Error(`Answer failed: ${error.message}`);
  }
};

/**
 * B3: Incident report summariser – 3–5 bullet points
 */
export const summariseIncidentReport = async (longText) => {
  try {
    const model = getTextModel();
    const prompt = `Summarise this incident report for school admins. Return 3-5 bullet points: what happened, cause if mentioned, actions taken, lessons. Return ONLY a JSON array of strings: ["point1", "point2", ...]. No other text, no markdown. Incident text:\n\n${longText}`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const bullets = parseJsonFromResponse(text, []);
    const arr = Array.isArray(bullets) ? bullets : (bullets.bullets ? bullets.bullets : []);
    const list = arr.filter((b) => typeof b === 'string').slice(0, 7);
    logger.info('Incident summary generated');
    return { bullets: list };
  } catch (error) {
    logger.error('Incident summarise error:', error);
    throw new Error(`Incident summary failed: ${error.message}`);
  }
};

/**
 * B6: AI-generated alert / broadcast message (max 160 chars for SMS)
 */
export const draftAlertMessage = async (type, severity) => {
  try {
    const model = getTextModel();
    const prompt = `Draft a short crisis alert message for schools. Type: ${type || 'emergency'}. Severity: ${severity || 'high'}. Max 160 characters. Tone: clear, calm. Include what to do (e.g. evacuate to assembly). Return only the message text, no labels or quotes.`;
    const result = await model.generateContent(prompt);
    const message = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '').slice(0, 160);
    logger.info('Alert draft generated');
    return { message: message || 'Proceed to assembly point. Follow staff instructions.' };
  } catch (error) {
    logger.error('Alert draft error:', error);
    throw new Error(`Alert draft failed: ${error.message}`);
  }
};

/**
 * O7: AI Crisis Message to Parents – short, calm message for parents (SMS/push length)
 */
export const draftCrisisParentMessage = async (incidentType, severity, oneLineDescription) => {
  try {
    const model = getTextModel();
    const desc = (oneLineDescription || '').trim() || 'Incident at school';
    const prompt = `Write a short message to parents about a school incident. Max 160 characters (SMS length). Tone: calm, factual, no alarm. Include that children are safe or what parents should do (e.g. "Please do not call the school during evacuation"). No jargon. Incident type: ${incidentType || 'incident'}. Severity: ${severity || 'medium'}. Brief description: ${desc}. Return only the message text, no labels or quotes.`;
    const result = await model.generateContent(prompt);
    const message = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '').slice(0, 160);
    logger.info('Crisis parent message drafted');
    return { message: message || 'Your child is safe. The school has followed safety procedures. We will update you as needed.' };
  } catch (error) {
    logger.error('Crisis parent message error:', error);
    throw new Error(`Crisis parent message failed: ${error.message}`);
  }
};

/**
 * B5: Long guideline summariser – 5–7 bullet points for teachers
 */
export const summariseGuideline = async (longText) => {
  try {
    const model = getTextModel();
    const prompt = `Summarise this safety or guideline document for teachers in 5-7 bullet points. Keep each point clear and actionable. Return ONLY a valid JSON array of strings, e.g. ["point 1", "point 2"]. No other text, no markdown. Document:\n\n${longText}`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const bullets = parseJsonFromResponse(text, []);
    const arr = Array.isArray(bullets) ? bullets : (bullets.bullets ? bullets.bullets : []);
    const list = arr.filter((b) => typeof b === 'string').slice(0, 10);
    logger.info('Guideline summary generated');
    return { bullets: list };
  } catch (error) {
    logger.error('Guideline summarise error:', error);
    throw new Error(`Guideline summary failed: ${error.message}`);
  }
};

/**
 * B7: Personalised drill feedback for student (one sentence)
 */
export const getDrillFeedbackForStudent = async ({ acknowledged, responseTimeSeconds, drillType }) => {
  try {
    const model = getTextModel();
    const timeStr = responseTimeSeconds != null ? `${responseTimeSeconds} seconds` : 'not recorded';
    const prompt = `Give one short, encouraging sentence of feedback for a student who just completed a ${drillType || 'safety'} drill. Acknowledged: ${acknowledged}. Response time: ${timeStr}. Be positive; add one small improvement tip if relevant. Return only the sentence, no labels or quotes.`;
    const result = await model.generateContent(prompt);
    const feedback = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '') || 'Well done participating in the drill.';
    logger.info('Drill feedback generated');
    return { feedback };
  } catch (error) {
    logger.error('Drill feedback error:', error);
    throw new Error(`Drill feedback failed: ${error.message}`);
  }
};

/**
 * E1: AI "next best module" – recommend one module from available list given completed titles/grades
 */
export const recommendNextModule = async ({ completedTitles = [], completedGrades = [], availableTitles = [] }) => {
  try {
    if (!availableTitles.length) {
      return { recommendedTitle: null, reason: 'No modules available to recommend.' };
    }
    const model = getTextModel();
    const completedStr = completedTitles.length
      ? completedTitles.map((t, i) => `"${t}"${completedGrades[i] != null ? ` (score: ${completedGrades[i]})` : ''}`).join(', ')
      : 'none';
    const availableStr = availableTitles.map((t) => `"${t}"`).join(', ');
    const prompt = `You are a learning path advisor for disaster preparedness. The student has completed: ${completedStr}. Available modules they have NOT completed: ${availableStr}. Pick exactly ONE module from the available list that is the best next step for their learning. Return ONLY valid JSON: { "recommendedTitle": "exact title from available list", "reason": "one sentence why" }. No other text.`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const data = parseJsonFromResponse(text, { recommendedTitle: null, reason: '' });
    const recommendedTitle = data.recommendedTitle && availableTitles.includes(data.recommendedTitle)
      ? data.recommendedTitle
      : availableTitles[0];
    const reason = typeof data.reason === 'string' ? data.reason : 'Continue your safety learning.';
    logger.info('Next module recommended');
    return { recommendedTitle, reason };
  } catch (error) {
    logger.error('Recommend next module error:', error);
    throw new Error(`Recommendation failed: ${error.message}`);
  }
};

/**
 * E2: AI suggest quiz difficulty from grade and optional last quiz score
 */
export const suggestQuizDifficulty = async ({ gradeLevel = 'all', lastQuizScore }) => {
  try {
    const model = getTextModel();
    const scoreStr = lastQuizScore != null ? `Last quiz score: ${lastQuizScore} out of 100.` : 'No recent quiz score.';
    const prompt = `For a student with grade level "${gradeLevel}" and ${scoreStr} Suggest quiz difficulty: beginner, intermediate, or advanced. Return ONLY a JSON object: { "difficulty": "beginner" | "intermediate" | "advanced" }. Nothing else.`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const data = parseJsonFromResponse(text, { difficulty: 'beginner' });
    const difficulty = ['beginner', 'intermediate', 'advanced'].includes(data.difficulty)
      ? data.difficulty
      : 'beginner';
    logger.info('Quiz difficulty suggested:', difficulty);
    return { difficulty };
  } catch (error) {
    logger.error('Suggest difficulty error:', error);
    return { difficulty: 'beginner' };
  }
};

/**
 * G1: Translate safety text to target language (Hindi, Marathi, etc.)
 */
export const translateSafetyText = async (text, targetLang) => {
  if (!text || !text.trim()) return { translated: '' };
  const lang = (targetLang || 'hi').toString().toLowerCase();
  const langNames = { hi: 'Hindi', mr: 'Marathi', pa: 'Punjabi', en: 'English' };
  const targetName = langNames[lang] || lang;
  if (targetName === 'English') return { translated: text.trim() };
  try {
    const model = getTextModel();
    const prompt = `Translate the following safety/disaster preparedness message to ${targetName}. Keep the same meaning and tone. Return ONLY the translated text, no labels or quotes. Text:\n\n${text.trim()}`;
    const result = await model.generateContent(prompt);
    const translated = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '') || text.trim();
    logger.info('Safety text translated to', targetName);
    return { translated };
  } catch (error) {
    logger.error('Translate error:', error);
    throw new Error(`Translation failed: ${error.message}`);
  }
};

/**
 * G2: Simplify content for lower grades / young learners
 */
export const simplifyContentForGrade = async (text, ageOrGrade = 8) => {
  if (!text || !text.trim()) return { simplified: '' };
  try {
    const model = getTextModel();
    const prompt = `Simplify this educational text for a ${ageOrGrade}-year-old or lower grade student. Use simple words and short sentences. Return 2-4 clear sentences. Return ONLY the simplified text, no labels or quotes. Text:\n\n${text.trim().slice(0, 3000)}`;
    const result = await model.generateContent(prompt);
    const simplified = (result.response?.text() || '').trim().replace(/^["']|["']$/g, '') || text.trim();
    logger.info('Content simplified');
    return { simplified };
  } catch (error) {
    logger.error('Simplify error:', error);
    throw new Error(`Simplify failed: ${error.message}`);
  }
};

/**
 * O1: AI Disaster Scenario Simulator (Choose Your Own Adventure)
 * First call: stepIndex 0, no userChoice → returns initial scenario + options.
 * Later calls: stepIndex, userChoice, previousContext → returns consequence + next scenario (or game over).
 */
export const scenarioNext = async ({ scenarioId, stepIndex = 0, userChoice, previousContext = [] }) => {
  try {
    const model = getTextModel();
    const isFirstStep = stepIndex === 0 && !userChoice && (!previousContext || previousContext.length === 0);

    if (isFirstStep) {
      const prompt = `You are a disaster safety simulator for schools. Generate the FIRST step of an interactive safety scenario.

Return ONLY valid JSON with no markdown or extra text:
{
  "nextScenario": "2-3 sentences setting the scene. E.g. You are in the chemistry lab. You smell smoke. What do you do?",
  "consequence": null,
  "options": ["Option A: Run out", "Option B: Tell the teacher", "Option C: Pull the alarm", "Option D: Use the extinguisher"],
  "isGameOver": false,
  "safetyScoreSentence": null,
  "tip": null
}
Keep options to exactly 4 short choices (A–D). nextScenario should be engaging and clear.`;
      const result = await model.generateContent(prompt);
      const text = (result.response?.text() || '').trim();
      const data = parseJsonFromResponse(text, {
        nextScenario: "You're in the chemistry lab. You smell smoke. What do you do?",
        consequence: null,
        options: ['Run out', 'Tell the teacher', 'Pull the alarm', 'Use the extinguisher'],
        isGameOver: false,
        safetyScoreSentence: null,
        tip: null
      });
      if (!Array.isArray(data.options)) data.options = [].slice(0, 4);
      logger.info('Scenario: initial step generated');
      return data;
    }

    const contextStr =
      previousContext
        .map((s) => `Scenario: ${s.scenario || ''}\nChoice: ${s.choice || ''}\nConsequence: ${s.consequence || ''}`)
        .join('\n\n') || 'None';
    const prompt = `You are a disaster safety simulator for schools. The user made a choice in an ongoing scenario.

Previous context:
${contextStr}

User's latest choice: ${userChoice || 'none'}

Return ONLY valid JSON with no markdown or extra text:
{
  "nextScenario": "2-3 sentences for the NEXT scenario (what happens next, new situation). If game over, set isGameOver true and this can be a short closing scene.",
  "consequence": "1-2 sentences: what happened because of their choice (good or bad).",
  "options": ["Option A: ...", "Option B: ...", "Option C: ...", "Option D: ..."] or [] if game over,
  "isGameOver": true or false,
  "safetyScoreSentence": "One sentence safety score or feedback (only if isGameOver is true, else null)",
  "tip": "One short safety tip (only if isGameOver is true, else null)"
}
Limit to 3-5 steps total; after 2-4 choices set isGameOver true. Keep options to 4 short choices when not game over.`;
    const result = await model.generateContent(prompt);
    const text = (result.response?.text() || '').trim();
    const data = parseJsonFromResponse(text, {
      nextScenario: 'The scenario continues.',
      consequence: 'Your choice had an effect.',
      options: [],
      isGameOver: false,
      safetyScoreSentence: null,
      tip: null
    });
    if (!Array.isArray(data.options)) data.options = [];
    if (data.isGameOver) {
      data.options = [];
      if (!data.safetyScoreSentence) data.safetyScoreSentence = 'You completed the scenario.';
      if (!data.tip) data.tip = 'Stay calm and follow school safety procedures.';
    }
    logger.info('Scenario: step generated', { isGameOver: data.isGameOver });
    return data;
  } catch (error) {
    logger.error('Scenario next error:', error);
    throw new Error(`Scenario failed: ${error.message}`);
  }
};

/**
 * O5: AI Safety Report Card for the School
 * Input: aggregated stats (last 30 days). Returns grade, strengths, improvements, boldNextStep.
 */
export const generateReportCard = async (statsSummary) => {
  try {
    const model = getTextModel();
    const text = typeof statsSummary === 'string' ? statsSummary : JSON.stringify(statsSummary);
    const prompt = `You are a school safety auditor. Given the following stats for the last 30 days, write a one-page "safety report card" for the school.

Stats (JSON or text):
${text}

Return ONLY valid JSON with no markdown or extra text:
{
  "grade": "A" or "B+" or "B" or "C+" or "C" or "D" or "F",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area to improve 1", "area to improve 2", "area to improve 3"],
  "boldNextStep": "One bold, specific next step (e.g. Run an unannounced fire drill next week)."
}
Be constructive and specific. strengths and improvements must be arrays of 2-3 short strings each.`;
    const result = await model.generateContent(prompt);
    const raw = (result.response?.text() || '').trim();
    const data = parseJsonFromResponse(raw, {
      grade: 'B',
      strengths: [],
      improvements: [],
      boldNextStep: 'Review and act on this report.'
    });
    if (!Array.isArray(data.strengths)) data.strengths = [];
    if (!Array.isArray(data.improvements)) data.improvements = [];
    if (!data.boldNextStep) data.boldNextStep = 'Schedule a safety review with staff.';
    logger.info('Report card generated', { grade: data.grade });
    return data;
  } catch (error) {
    logger.error('Report card error:', error);
    throw new Error(`Report card failed: ${error.message}`);
  }
};

