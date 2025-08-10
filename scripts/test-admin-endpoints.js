/**
 * @fileoverview Test script for admin endpoints functionality
 * @module test-admin-endpoints
 */

/**
 * Base URL for API testing
 */
const BASE_URL = 'http://localhost:3000/api';

/**
 * Test configuration
 */
const TEST_CONFIG = {
  timeout: 10000,
  adminCredentials: {
    email: 'admin@example.com',
    password: 'AdminPassword123!',
  },
};

/**
 * Global variables for testing
 */
let adminToken = '';
let testSessionId = '';

/**
 * Logs test results with colors using console styling
 */
function logTest(testName, success, message = '') {
  const status = success ? '\x1b[32m✓ PASS\x1b[0m' : '\x1b[31m✗ FAIL\x1b[0m';
  console.log(`${status} ${testName}${message ? ` - ${message}` : ''}`);
}

/**
 * Logs section headers with blue color
 */
function logSection(sectionName) {
  console.log(`\x1b[34m\n--- ${sectionName} ---\x1b[0m`);
}

/**
 * Simple HTTP client to replace axios
 */
async function httpRequest(url, options = {}) {
  const https = require('https');
  const http = require('http');
  const urlParsed = new URL(url);

  return new Promise((resolve, reject) => {
    const client = urlParsed.protocol === 'https:' ? https : http;

    const requestOptions = {
      hostname: urlParsed.hostname,
      port: urlParsed.port || (urlParsed.protocol === 'https:' ? 443 : 80),
      path: urlParsed.pathname + urlParsed.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || TEST_CONFIG.timeout,
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            data: parsedData,
            status: res.statusCode,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            data: data,
            status: res.statusCode,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({ response: { status: 500, data: { message: error.message } } });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        response: { status: 408, data: { message: 'Request timeout' } },
      });
    });

    if (options.data) {
      req.write(JSON.stringify(options.data));
    }

    req.end();
  });
}

/**
 * Creates HTTP client with authorization header
 */
function createAuthRequest(token) {
  return {
    get: (path) =>
      httpRequest(`${BASE_URL}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
    post: (path, data) =>
      httpRequest(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        data,
      }),
    delete: (path) =>
      httpRequest(`${BASE_URL}${path}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }),
  };
}

/**
 * Tests admin authentication
 */
async function testAdminAuth() {
  logSection('Admin Authentication');

  try {
    const response = await httpRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      data: TEST_CONFIG.adminCredentials,
      timeout: TEST_CONFIG.timeout,
    });

    if (response.data.status === 'success' && response.data.data.accessToken) {
      adminToken = response.data.data.accessToken;
      logTest('Admin login', true, 'Token obtained successfully');
      return true;
    } else {
      logTest('Admin login', false, 'No access token in response');
      return false;
    }
  } catch (error) {
    logTest(
      'Admin login',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests session statistics endpoint
 */
async function testSessionStats() {
  logSection('Session Statistics');

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.get('/admin/sessions/stats');

    if (response.data.status === 'success') {
      const stats = response.data.data;
      logTest(
        'Get session stats',
        true,
        `Total: ${stats.totalSessions}, Active: ${stats.activeSessions}`
      );
      return true;
    } else {
      logTest('Get session stats', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest(
      'Get session stats',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests active sessions endpoint
 */
async function testActiveSessions() {
  logSection('Active Sessions');

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.get('/admin/sessions/active?page=1&limit=5');

    if (response.data.status === 'success') {
      const sessions = response.data.data.sessions;
      const pagination = response.data.data.pagination;

      logTest(
        'Get active sessions',
        true,
        `Found ${sessions.length} sessions, Page ${pagination.currentPage}/${pagination.totalPages}`
      );

      if (sessions.length > 0) {
        testSessionId = sessions[0]._id;
        logTest(
          'Session ID extracted',
          true,
          `Using session: ${testSessionId.substring(0, 8)}...`
        );
      }

      return true;
    } else {
      logTest('Get active sessions', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest(
      'Get active sessions',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests inactive sessions endpoint
 */
async function testInactiveSessions() {
  logSection('Inactive Sessions');

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.get(
      '/admin/sessions/inactive?page=1&limit=5'
    );

    if (response.data.status === 'success') {
      const sessions = response.data.data.sessions;
      const pagination = response.data.data.pagination;

      logTest(
        'Get inactive sessions',
        true,
        `Found ${sessions.length} sessions, Page ${pagination.currentPage}/${pagination.totalPages}`
      );
      return true;
    } else {
      logTest('Get inactive sessions', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest(
      'Get inactive sessions',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests force cleanup inactive sessions endpoint
 */
async function testForceCleanup() {
  logSection('Force Cleanup Inactive Sessions');

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.delete('/admin/sessions/inactive');

    if (response.data.status === 'success') {
      const deletedCount = response.data.data.deletedCount;
      logTest(
        'Force cleanup inactive',
        true,
        `Cleaned ${deletedCount} sessions`
      );
      return true;
    } else {
      logTest('Force cleanup inactive', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest(
      'Force cleanup inactive',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests comprehensive cleanup endpoint
 */
async function testComprehensiveCleanup() {
  logSection('Comprehensive System Cleanup');

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.post('/admin/cleanup');

    if (response.data.status === 'success') {
      const data = response.data.data;
      logTest(
        'System cleanup',
        true,
        `Total cleaned: ${data.totalCleaned} (Sessions: ${data.expiredSessions + data.inactiveSessions}, Tokens: ${data.expiredTokens})`
      );
      return true;
    } else {
      logTest('System cleanup', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    logTest(
      'System cleanup',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests session deactivation endpoint (only if we have a test session)
 */
async function testSessionDeactivation() {
  logSection('Session Deactivation');

  if (!testSessionId) {
    logTest('Deactivate session', false, 'No test session ID available');
    return false;
  }

  const client = createAuthRequest(adminToken);

  try {
    const response = await client.delete(`/admin/sessions/${testSessionId}`);

    if (response.data.status === 'success') {
      logTest(
        'Deactivate session',
        true,
        `Session ${testSessionId.substring(0, 8)}... deactivated`
      );
      return true;
    } else {
      logTest('Deactivate session', false, 'Unexpected response format');
      return false;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      logTest(
        'Deactivate session',
        true,
        'Session already deactivated or not found (expected)'
      );
      return true;
    }
    logTest(
      'Deactivate session',
      false,
      error.response?.data?.message || error.message
    );
    return false;
  }
}

/**
 * Tests unauthorized access to admin endpoints
 */
async function testUnauthorizedAccess() {
  logSection('Security Tests - Unauthorized Access');

  try {
    const response = await httpRequest(`${BASE_URL}/admin/sessions/stats`, {
      timeout: TEST_CONFIG.timeout,
    });

    logTest('Unauthorized access blocked', false, 'Should have been rejected');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logTest(
        'Unauthorized access blocked',
        true,
        'Correctly rejected with 401'
      );
      return true;
    } else {
      logTest(
        'Unauthorized access blocked',
        false,
        `Unexpected error: ${error.message}`
      );
      return false;
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\x1b[33m🧪 Starting Admin Endpoints Test Suite\x1b[0m\n');

  const tests = [
    { name: 'Unauthorized Access Test', fn: testUnauthorizedAccess },
    { name: 'Admin Authentication', fn: testAdminAuth },
    { name: 'Session Statistics', fn: testSessionStats },
    { name: 'Active Sessions', fn: testActiveSessions },
    { name: 'Inactive Sessions', fn: testInactiveSessions },
    { name: 'Force Cleanup', fn: testForceCleanup },
    { name: 'System Cleanup', fn: testComprehensiveCleanup },
    { name: 'Session Deactivation', fn: testSessionDeactivation },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logTest(test.name, false, `Unexpected error: ${error.message}`);
      failed++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log('\x1b[33m\n📊 Test Results:\x1b[0m');
  console.log(`\x1b[32m✓ Passed: ${passed}\x1b[0m`);
  console.log(`\x1b[31m✗ Failed: ${failed}\x1b[0m`);
  console.log(`\x1b[34m📝 Total: ${passed + failed}\x1b[0m`);

  if (failed === 0) {
    console.log(
      '\x1b[32m\n🎉 All tests passed! Admin endpoints are working correctly.\x1b[0m'
    );
  } else {
    console.log(
      `\x1b[31m\n⚠️  ${failed} test(s) failed. Please check the output above.\x1b[0m`
    );
  }

  console.log(
    '\x1b[90m\nNote: Make sure the server is running and you have an admin user with the credentials specified in TEST_CONFIG.\x1b[0m'
  );
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
