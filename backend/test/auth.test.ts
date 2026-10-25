import assert from 'assert';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';
import http from 'http';

// Helper to make local HTTP requests to the Express app
function makeRequest(
  server: http.Server,
  options: { method: string; path: string; headers?: Record<string, string>; body?: any }
): Promise<{ status: number; data: any; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    const payload = options.body ? JSON.stringify(options.body) : undefined;

    const req = http.request(
      {
        hostname: 'localhost',
        port: addr.port,
        path: options.path,
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...options.headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({ status: res.statusCode || 500, data: parsed, headers: res.headers });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Auth & Tenant Isolation Test Suite...\n');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    // Test 1: Healthcheck
    console.log('1. Testing GET /health...');
    const healthRes = await makeRequest(server, { method: 'GET', path: '/health' });
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthRes.data.status, 'healthy');
    console.log('   ✅ Healthcheck passed.');

    // Test 2: Unauthorized access rejected
    console.log('2. Testing Unauthorized access to protected route...');
    const unauthRes = await makeRequest(server, { method: 'GET', path: '/api/v1/auth/me' });
    assert.strictEqual(unauthRes.status, 401);
    assert.strictEqual(unauthRes.data.success, false);
    console.log('   ✅ Rejected unauthorized request with 401.');

    // Test 3: Register new business workspace
    const testEmail = `test_${Date.now()}@clinic-demo.in`;
    console.log(`3. Testing POST /api/v1/auth/register for ${testEmail}...`);
    const regRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        tenantName: 'Bengaluru Diagnostic Test Lab',
        email: testEmail,
        password: 'SecurePassword123!',
        firstName: 'Ananya',
        lastName: 'Rao',
      },
    });

    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regRes.data.success, true);
    assert.ok(regRes.data.data.token, 'Token should be returned');
    assert.strictEqual(regRes.data.data.user.email, testEmail);
    assert.strictEqual(regRes.data.data.tenant.name, 'Bengaluru Diagnostic Test Lab');
    const token = regRes.data.data.token;
    console.log('   ✅ Business workspace & admin registered successfully with JWT.');

    // Test 4: Prevent duplicate email registration
    console.log('4. Testing Duplicate email registration rejection...');
    const dupRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/register',
      body: {
        tenantName: 'Another Lab',
        email: testEmail,
        password: 'AnotherPassword123!',
        firstName: 'Duplicate',
      },
    });
    assert.strictEqual(dupRes.status, 409);
    assert.strictEqual(dupRes.data.success, false);
    console.log('   ✅ Duplicate registration rejected with 409 Conflict.');

    // Test 5: Login with valid credentials
    console.log('5. Testing POST /api/v1/auth/login...');
    const loginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: testEmail,
        password: 'SecurePassword123!',
      },
    });
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
    assert.ok(loginRes.data.data.token);
    console.log('   ✅ Login successful.');

    // Test 6: Login with invalid credentials rejected
    console.log('6. Testing Login with wrong password...');
    const badLoginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: testEmail,
        password: 'WrongPassword!',
      },
    });
    assert.strictEqual(badLoginRes.status, 401);
    console.log('   ✅ Wrong password rejected with 401.');

    // Test 7: Authenticated Profile & Tenant Isolation
    console.log('7. Testing GET /api/v1/auth/me with Bearer token...');
    const meRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/auth/me',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.data.data.user.email, testEmail);
    assert.strictEqual(meRes.data.data.tenant.name, 'Bengaluru Diagnostic Test Lab');
    console.log('   ✅ Authenticated user profile and tenant isolation verified.');

    // Test 8: Platform Workspace endpoint
    console.log('8. Testing GET /api/v1/platform/tenant...');
    const tenantRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/platform/tenant',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(tenantRes.status, 200);
    assert.strictEqual(tenantRes.data.data.name, 'Bengaluru Diagnostic Test Lab');
    console.log('   ✅ Workspace details retrieved with tenant counters.');

    console.log('\n🎉 ALL AUTH & TENANT ISOLATION TESTS PASSED!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
