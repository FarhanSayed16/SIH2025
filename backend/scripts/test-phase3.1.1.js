/**
 * Phase 3.1.1: Backend API Testing Script
 * Tests all enhanced module endpoints and features
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logTest(message) {
  log(`🧪 ${message}`, 'blue');
}

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, details = '') {
  results.tests.push({ name, passed, details });
  if (passed) {
    results.passed++;
    logSuccess(`${name}`);
  } else {
    results.failed++;
    logError(`${name}${details ? `: ${details}` : ''}`);
  }
}

// Test functions
async function testHealthCheck() {
  logTest('Testing health check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    recordTest('Health Check', response.status === 200);
    return true;
  } catch (error) {
    recordTest('Health Check', false, error.message);
    return false;
  }
}

async function testListModulesBasic() {
  logTest('Testing GET /api/modules (basic)...');
  try {
    const response = await axios.get(`${API_URL}/modules`);
    const passed = response.status === 200 && response.data.success && Array.isArray(response.data.data);
    recordTest('List Modules (Basic)', passed, passed ? `Found ${response.data.data.length} modules` : 'Invalid response');
    return response.data.data;
  } catch (error) {
    recordTest('List Modules (Basic)', false, error.message);
    return [];
  }
}

async function testListModulesWithFilters() {
  logTest('Testing GET /api/modules with filters...');
  
  const filters = [
    { name: 'Type Filter (fire)', params: { type: 'fire' } },
    { name: 'Category Filter (safety)', params: { category: 'safety' } },
    { name: 'Difficulty Filter (beginner)', params: { difficulty: 'beginner' } },
    { name: 'Grade Level Filter (10)', params: { gradeLevel: '10' } },
    { name: 'Tags Filter', params: { tags: 'fire' } },
    { name: 'Search Filter', params: { search: 'fire' } },
    { name: 'Multiple Filters', params: { type: 'fire', difficulty: 'beginner', category: 'safety' } }
  ];

  for (const filter of filters) {
    try {
      const response = await axios.get(`${API_URL}/modules`, { params: filter.params });
      const passed = response.status === 200 && response.data.success;
      recordTest(`List Modules - ${filter.name}`, passed, passed ? `Found ${response.data.data.length} modules` : 'Invalid response');
    } catch (error) {
      recordTest(`List Modules - ${filter.name}`, false, error.message);
    }
  }
}

async function testListModulesSorting() {
  logTest('Testing GET /api/modules with sorting...');
  
  const sortOptions = [
    { name: 'Sort by Order', params: { sortBy: 'order', sortOrder: 'asc' } },
    { name: 'Sort by Popularity', params: { sortBy: 'popularity', sortOrder: 'desc' } },
    { name: 'Sort by Completions', params: { sortBy: 'completions', sortOrder: 'desc' } },
    { name: 'Sort by Title', params: { sortBy: 'title', sortOrder: 'asc' } }
  ];

  for (const sort of sortOptions) {
    try {
      const response = await axios.get(`${API_URL}/modules`, { params: sort.params });
      const passed = response.status === 200 && response.data.success;
      recordTest(`List Modules - ${sort.name}`, passed, passed ? `Sorted ${response.data.data.length} modules` : 'Invalid response');
    } catch (error) {
      recordTest(`List Modules - ${sort.name}`, false, error.message);
    }
  }
}

async function testGetModuleById(modules) {
  logTest('Testing GET /api/modules/:id...');
  
  if (!modules || modules.length === 0) {
    recordTest('Get Module by ID', false, 'No modules available');
    return null;
  }

  const moduleId = modules[0]._id;
  try {
    const response = await axios.get(`${API_URL}/modules/${moduleId}`);
    const passed = response.status === 200 && 
                   response.data.success && 
                   response.data.data.module &&
                   response.data.data.module._id === moduleId;
    
    if (passed) {
      // Check if view count was incremented (stats should exist)
      const hasStats = response.data.data.module.stats !== undefined;
      recordTest('Get Module by ID', passed, hasStats ? 'Module retrieved with stats' : 'Module retrieved (no stats yet)');
      
      // Test version parameter
      try {
        const versionResponse = await axios.get(`${API_URL}/modules/${moduleId}`, {
          params: { version: '1.0.0' }
        });
        recordTest('Get Module by ID with Version', versionResponse.status === 200, 'Version parameter works');
      } catch (error) {
        recordTest('Get Module by ID with Version', false, error.message);
      }
    } else {
      recordTest('Get Module by ID', false, 'Invalid response');
    }
    
    return response.data.data.module;
  } catch (error) {
    recordTest('Get Module by ID', false, error.message);
    return null;
  }
}

async function testModuleStructure(module) {
  logTest('Testing module structure (Phase 3.1.1 enhancements)...');
  
  if (!module) {
    recordTest('Module Structure Check', false, 'No module available');
    return;
  }

  const checks = [
    { name: 'Has version field', check: module.version !== undefined },
    { name: 'Has category field', check: module.category !== undefined },
    { name: 'Has gradeLevel field', check: module.gradeLevel !== undefined },
    { name: 'Has tags field', check: module.tags !== undefined },
    { name: 'Has stats field', check: module.stats !== undefined },
    { name: 'Has lessons structure', check: module.content?.lessons !== undefined },
    { name: 'Stats has totalViews', check: module.stats?.totalViews !== undefined },
    { name: 'Stats has totalCompletions', check: module.stats?.totalCompletions !== undefined },
    { name: 'Stats has averageScore', check: module.stats?.averageScore !== undefined }
  ];

  checks.forEach(check => {
    recordTest(`Module Structure - ${check.name}`, check.check);
  });
}

async function testQuizTypes(module) {
  logTest('Testing enhanced quiz types...');
  
  // Check across ALL modules by fetching each one individually (detail endpoint has full quiz data)
  try {
    // First get list of all modules
    const listResponse = await axios.get(`${API_URL}/modules`, { params: { limit: 100 } });
    const modulesList = listResponse.data.data?.docs || listResponse.data.data || [];
    
    if (modulesList.length === 0) {
      recordTest('Quiz Types Check', false, 'No modules available');
      return;
    }

    // Collect all questions from all modules by fetching each module detail
    const allQuestions = [];
    for (const mod of modulesList) {
      try {
        const detailResponse = await axios.get(`${API_URL}/modules/${mod._id}`);
        const detailModule = detailResponse.data.data?.module || detailResponse.data.data;
        if (detailModule && detailModule.quiz && detailModule.quiz.questions) {
          allQuestions.push(...detailModule.quiz.questions);
        }
      } catch (err) {
        // Skip if module detail fetch fails
        console.log(`  Warning: Could not fetch details for module ${mod._id}`);
      }
    }

    if (allQuestions.length === 0) {
      recordTest('Quiz Types Check', false, 'No quiz questions available');
      return;
    }

    // Debug: Log question types found
    const questionTypes = allQuestions.map(q => q.questionType || 'text');
    const uniqueTypes = [...new Set(questionTypes)];
    console.log(`  Found ${allQuestions.length} questions with types: ${uniqueTypes.join(', ')}`);

    const hasTextQuestions = allQuestions.some(q => q.questionType === 'text' || !q.questionType);
    const hasImageQuestions = allQuestions.some(q => q.questionType === 'image');
    const hasAudioQuestions = allQuestions.some(q => q.questionType === 'audio');

    recordTest('Quiz - Has Text Questions', hasTextQuestions);
    recordTest('Quiz - Has Image Questions', hasImageQuestions);
    recordTest('Quiz - Has Audio Questions', hasAudioQuestions);
    
    // Check if image questions have proper structure
    const imageQuestion = allQuestions.find(q => q.questionType === 'image');
    if (imageQuestion) {
      recordTest('Quiz - Image Question Structure', 
        imageQuestion.questionImage !== undefined && 
        imageQuestion.optionImages !== undefined);
    }
  } catch (error) {
    recordTest('Quiz Types Check', false, error.message);
  }
}

async function testPagination() {
  logTest('Testing pagination...');
  
  try {
    const page1 = await axios.get(`${API_URL}/modules`, { params: { page: 1, limit: 2 } });
    const page2 = await axios.get(`${API_URL}/modules`, { params: { page: 2, limit: 2 } });
    
    const passed = page1.status === 200 && 
                   page2.status === 200 &&
                   page1.data.pagination &&
                   page2.data.pagination &&
                   page1.data.pagination.page === 1 &&
                   page2.data.pagination.page === 2;
    
    recordTest('Pagination', passed, passed ? 
      `Page 1: ${page1.data.data.length}, Page 2: ${page2.data.data.length}` : 
      'Invalid pagination');
  } catch (error) {
    recordTest('Pagination', false, error.message);
  }
}

async function testInvalidRequests() {
  logTest('Testing error handling...');
  
  // Test invalid module ID
  try {
    await axios.get(`${API_URL}/modules/invalid-id`);
    recordTest('Error Handling - Invalid ID', false, 'Should return 400/404');
  } catch (error) {
    const passed = error.response && (error.response.status === 400 || error.response.status === 404);
    recordTest('Error Handling - Invalid ID', passed);
  }

  // Test non-existent module
  try {
    const fakeId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
    await axios.get(`${API_URL}/modules/${fakeId}`);
    recordTest('Error Handling - Non-existent Module', false, 'Should return 404');
  } catch (error) {
    const passed = error.response && error.response.status === 404;
    recordTest('Error Handling - Non-existent Module', passed);
  }
}

// Main test function
async function runTests() {
  log('\n🚀 Starting Phase 3.1.1 Backend API Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Check if server is running
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    logError('Server is not running. Please start the backend server first.');
    logInfo('Run: npm run dev (in backend directory)');
    process.exit(1);
  }

  log('\n📋 Testing Module APIs...\n', 'blue');
  
  // Basic list test
  const modules = await testListModulesBasic();
  
  // Filter tests
  await testListModulesWithFilters();
  
  // Sorting tests
  await testListModulesSorting();
  
  // Get by ID test
  const module = await testGetModuleById(modules);
  
  // Structure tests
  await testModuleStructure(module);
  
  // Quiz type tests
  await testQuizTypes(module);
  
  // Pagination tests
  await testPagination();
  
  // Error handling tests
  await testInvalidRequests();
  
  // Print summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Test Results Summary\n', 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📈 Total: ${results.passed + results.failed}\n`, 'cyan');
  
  if (results.failed === 0) {
    logSuccess('All tests passed! 🎉\n');
  } else {
    logError('Some tests failed. Please review the errors above.\n');
  }
  
  // Detailed results
  log('\n📝 Detailed Results:\n', 'blue');
  results.tests.forEach(test => {
    const icon = test.passed ? '✅' : '❌';
    const color = test.passed ? 'green' : 'red';
    log(`${icon} ${test.name}${test.details ? ` - ${test.details}` : ''}`, color);
  });
  
  log('\n');
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  logError(`Test execution failed: ${error.message}`);
  process.exit(1);
});

