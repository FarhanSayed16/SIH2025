/**
 * List available Gemini models using the ListModels API
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env');
  process.exit(1);
}

console.log('🔍 Listing available Gemini models...\n');

// Use the REST API directly to list models
async function listModels() {
  try {
    const response = await axios.get(
      'https://generativelanguage.googleapis.com/v1beta/models',
      {
        headers: {
          'x-goog-api-key': GEMINI_API_KEY
        }
      }
    );

    const models = response.data.models || [];
    console.log(`✅ Found ${models.length} available models:\n`);
    
    const generateContentModels = models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );

    if (generateContentModels.length > 0) {
      console.log('📝 Models that support generateContent:\n');
      generateContentModels.forEach(model => {
        console.log(`  ✅ ${model.name.replace('models/', '')}`);
        if (model.displayName) {
          console.log(`     Display: ${model.displayName}`);
        }
      });
      console.log(`\n🎯 RECOMMENDED: ${generateContentModels[0].name.replace('models/', '')}\n`);
      return generateContentModels[0].name.replace('models/', '');
    } else {
      console.log('❌ No models found that support generateContent');
      return null;
    }
  } catch (error) {
    console.error('❌ Error listing models:', error.response?.data || error.message);
    
    // Try v1 API
    try {
      console.log('\n🔄 Trying v1 API...\n');
      const response = await axios.get(
        'https://generativelanguage.googleapis.com/v1/models',
        {
          headers: {
            'x-goog-api-key': GEMINI_API_KEY
          }
        }
      );

      const models = response.data.models || [];
      console.log(`✅ Found ${models.length} available models in v1:\n`);
      
      models.forEach(model => {
        console.log(`  ✅ ${model.name.replace('models/', '')}`);
      });
      
      if (models.length > 0) {
        console.log(`\n🎯 RECOMMENDED: ${models[0].name.replace('models/', '')}\n`);
        return models[0].name.replace('models/', '');
      }
    } catch (v1Error) {
      console.error('❌ v1 API also failed:', v1Error.response?.data || v1Error.message);
    }
    
    return null;
  }
}

listModels().then(modelName => {
  if (modelName) {
    console.log('✅ Add this to your .env file:');
    console.log(`GEMINI_MODEL=${modelName}\n`);
    console.log('Then restart the server and test again.\n');
  }
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

