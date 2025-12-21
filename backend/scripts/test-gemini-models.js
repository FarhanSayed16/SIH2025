/**
 * Quick script to test Gemini API and list available models
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Common model names to try
const modelsToTry = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-pro-vision',
  'gemini-1.0-pro',
];

console.log('🧪 Testing Gemini API with different model names...\n');

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say "Hello, World!" in one word.');
    const response = await result.response;
    const text = response.text();
    console.log(`✅ ${modelName}: WORKS - Response: "${text.trim()}"`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}: FAILED - ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function findWorkingModel() {
  for (const modelName of modelsToTry) {
    const works = await testModel(modelName);
    if (works) {
      console.log(`\n🎯 RECOMMENDED MODEL: ${modelName}\n`);
      return modelName;
    }
  }
  console.log('\n❌ No working model found. Please check your API key or SDK version.\n');
  return null;
}

findWorkingModel().then(workingModel => {
  if (workingModel) {
    console.log('✅ Add this to your .env file:');
    console.log(`GEMINI_MODEL=${workingModel}\n`);
  }
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

