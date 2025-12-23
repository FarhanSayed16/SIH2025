/**
 * Phase 3.5.4: Test Bulk User Operations & Export
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
};

let accessToken = null;
let testUsers = [];

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function loginAsAdmin() {
  logSection('1. Login as Admin');
  
  try {
    // Try to login with admin credentials
    // Update these with actual admin credentials from your seed data
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@school.com', // Update if different
      password: 'admin123' // Update if different
    });

    if (response.data.success && response.data.data?.accessToken) {
      accessToken = response.data.data.accessToken;
      log('✅ Admin login successful', 'green');
      return true;
    } else {
      log('❌ Admin login failed: Invalid credentials', 'red');
      log('⚠️  Please update login credentials in the test script', 'yellow');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log('❌ Admin login failed: Invalid credentials', 'red');
      log('⚠️  Please update login credentials in the test script', 'yellow');
      log(`   Email: admin@school.com`, 'yellow');
      log(`   Password: (check your seed data)`, 'yellow');
    } else {
      log(`❌ Admin login failed: ${error.message}`, 'red');
    }
    return false;
  }
}

async function testListUsers() {
  logSection('2. Test List Users Endpoint');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (response.data.success && response.data.data) {
      const users = Array.isArray(response.data.data) 
        ? response.data.data 
        : response.data.data.users || [];
      
      testUsers = users.slice(0, 3); // Get first 3 users for testing
      log(`✅ List users successful: Found ${users.length} user(s)`, 'green');
      
      if (testUsers.length > 0) {
        log(`   Selected ${testUsers.length} user(s) for bulk operations:`, 'blue');
        testUsers.forEach((u, i) => {
          log(`   ${i + 1}. ${u.name || u.email} (${u._id})`, 'blue');
        });
      }
      return true;
    } else {
      log('❌ List users failed: Invalid response format', 'red');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 403) {
      log('❌ List users failed: Access denied (requires admin role)', 'red');
    } else {
      log(`❌ List users failed: ${error.response?.data?.message || error.message}`, 'red');
    }
    return false;
  }
}

async function testBulkActivate() {
  logSection('3. Test Bulk Activate Operation');
  
  if (testUsers.length === 0) {
    log('⚠️  Skipping: No test users available', 'yellow');
    return false;
  }

  try {
    const userIds = testUsers.map(u => u._id);
    const response = await axios.post(
      `${BASE_URL}/api/users/bulk`,
      {
        userIds,
        action: 'activate'
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (response.data.success) {
      const affected = response.data.data?.affected || 0;
      log(`✅ Bulk activate successful: ${affected} user(s) activated`, 'green');
      return true;
    } else {
      log(`❌ Bulk activate failed: ${response.data.message || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Bulk activate failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testBulkDeactivate() {
  logSection('4. Test Bulk Deactivate Operation');
  
  if (testUsers.length === 0) {
    log('⚠️  Skipping: No test users available', 'yellow');
    return false;
  }

  try {
    const userIds = testUsers.map(u => u._id);
    const response = await axios.post(
      `${BASE_URL}/api/users/bulk`,
      {
        userIds,
        action: 'deactivate'
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (response.data.success) {
      const affected = response.data.data?.affected || 0;
      log(`✅ Bulk deactivate successful: ${affected} user(s) deactivated`, 'green');
      return true;
    } else {
      log(`❌ Bulk deactivate failed: ${response.data.message || 'Unknown error'}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Bulk deactivate failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testExportCSV() {
  logSection('5. Test Export Users to CSV');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/export?format=csv`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'text'
    });

    if (response.status === 200 && response.data) {
      // Save CSV file
      const csvPath = path.join(process.cwd(), 'test-export-users.csv');
      fs.writeFileSync(csvPath, response.data, 'utf8');
      
      log(`✅ CSV export successful: Saved to ${csvPath}`, 'green');
      log(`   File size: ${fs.statSync(csvPath).size} bytes`, 'blue');
      return true;
    } else {
      log('❌ CSV export failed: Invalid response', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ CSV export failed: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testExportExcel() {
  logSection('6. Test Export Users to Excel');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/users/export?format=excel`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      responseType: 'arraybuffer'
    });

    if (response.status === 200 && response.data) {
      // Save Excel file
      const excelPath = path.join(process.cwd(), 'test-export-users.xlsx');
      fs.writeFileSync(excelPath, Buffer.from(response.data));
      
      log(`✅ Excel export successful: Saved to ${excelPath}`, 'green');
      log(`   File size: ${fs.statSync(excelPath).size} bytes`, 'blue');
      return true;
    } else {
      log('❌ Excel export failed: Invalid response', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Excel export failed: ${error.response?.data?.message || error.message}`, 'red');
    if (error.response?.status === 500) {
      log('   Note: Excel export requires ExcelJS library', 'yellow');
    }
    return false;
  }
}

async function testFiltersAndPagination() {
  logSection('7. Test Filters and Pagination');
  
  try {
    // Test role filter
    const roleResponse = await axios.get(`${BASE_URL}/api/users?role=student&limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (roleResponse.data.success) {
      log('✅ Role filter working', 'green');
    } else {
      log('❌ Role filter failed', 'red');
    }

    // Test search
    const searchResponse = await axios.get(`${BASE_URL}/api/users?search=test&limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (searchResponse.data.success) {
      log('✅ Search filter working', 'green');
    } else {
      log('❌ Search filter failed', 'red');
    }

    // Test pagination
    const pageResponse = await axios.get(`${BASE_URL}/api/users?page=1&limit=2`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (pageResponse.data.success) {
      const users = Array.isArray(pageResponse.data.data) 
        ? pageResponse.data.data 
        : pageResponse.data.data?.users || [];
      log(`✅ Pagination working: Retrieved ${users.length} user(s)`, 'green');
    } else {
      log('❌ Pagination failed', 'red');
    }

    return true;
  } catch (error) {
    log(`❌ Filters/pagination test failed: ${error.message}`, 'red');
    return false;
  }
}

function displaySummary(results) {
  logSection('Test Summary');
  
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  log(`\nTotal Tests: ${results.length}`, 'cyan');
  log(`✅ Passed: ${passed}`, 'green');
  log(`❌ Failed: ${failed}`, 'red');
  
  console.log('\n' + '='.repeat(60));
  
  if (failed === 0) {
    log('\n🎉 All tests passed! Phase 3.5.4 bulk operations are working!', 'green');
    return 0;
  } else {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    return 1;
  }
}

async function main() {
  log('\n🚀 Phase 3.5.4: Bulk Operations Testing Started', 'cyan');
  log(`Testing against: ${BASE_URL}`, 'blue');
  
  const results = [];

  try {
    // Login first
    const loggedIn = await loginAsAdmin();
    if (!loggedIn) {
      log('\n❌ Cannot proceed without admin authentication', 'red');
      log('⚠️  Please update login credentials and try again', 'yellow');
      process.exit(1);
    }

    // Run tests
    results.push(await testListUsers());
    
    if (testUsers.length > 0) {
      results.push(await testBulkActivate());
      results.push(await testBulkDeactivate());
    } else {
      log('⚠️  Skipping bulk operations: No users available for testing', 'yellow');
      results.push(false, false);
    }
    
    results.push(await testExportCSV());
    results.push(await testExportExcel());
    results.push(await testFiltersAndPagination());
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
  
  const exitCode = displaySummary(results);
  process.exit(exitCode);
}

main();

