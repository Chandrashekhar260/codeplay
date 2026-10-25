import assert from 'assert';
import http from 'http';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

function makeRequest(
  server: http.Server,
  options: { method: string; path: string; headers?: Record<string, string>; body?: any }
): Promise<{ status: number; data: any }> {
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
          resolve({ status: res.statusCode || 500, data: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runGovernanceTests() {
  console.log('🧪 Starting Governance Service & Rules Catalog Test Suite...\n');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    // 1. Authenticate
    console.log('1. Authenticating as demo MSME user...');
    const loginRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: {
        email: 'ramesh.kumar@aarogyadiagnostics.in',
        password: 'Password123!',
      },
    });

    assert.strictEqual(loginRes.status, 200);
    const token = loginRes.data.data.token;
    console.log('   ✅ Authenticated.');

    // 2. Test Rules Catalog Endpoint
    console.log('2. Testing GET /api/v1/governance/rules...');
    const rulesRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/governance/rules',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(rulesRes.status, 200);
    const catalog = rulesRes.data.data;
    assert.ok(catalog.classificationRules.AADHAAR.classification === 'RESTRICTED');
    assert.ok(catalog.classificationRules.HEALTH_DATA.classification === 'RESTRICTED');
    assert.ok(catalog.classificationRules.PAN.classification === 'CONFIDENTIAL');
    assert.ok(catalog.retentionRules.FINANCE_BILLING.retentionMonths === 72);
    assert.ok(catalog.penaltyReferences.SECURITY_SAFEGUARDS.maximum.includes('250'));
    console.log('   ✅ Rules catalog loaded: Classification, Retention, Security, and Penalties.');

    // 3. Fetch real uploaded data source
    console.log('3. Fetching real uploaded source from PostgreSQL...');
    const sourcesRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/discovery/sources',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(sourcesRes.status, 200);
    const sources = sourcesRes.data.data;
    assert.ok(sources.length > 0);
    const realSource = sources[0];
    console.log(`   ✅ Using real source: "${realSource.name}" (${realSource.sourceId})`);

    // 4. Register Data Asset using real source and auto-resolve classification + retention
    console.log('4. Registering Data Asset with auto-resolved classification & retention...');
    const assetRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/governance/assets',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'Dental Clinic Patient Archive 2026',
        type: 'SPREADSHEET',
        sourceId: realSource.sourceId,
        owner: 'Ramesh Kumar (Managing Partner)',
        steward: 'Dr. Ananya Rao (Chief Dentist)',
        businessFunction: 'Clinical Diagnostics',
      },
    });

    assert.strictEqual(assetRes.status, 201);
    const asset = assetRes.data.data.asset;
    const meta = assetRes.data.data.governanceMetadata;

    console.log(`   ✅ Asset Created: "${asset.name}" (ID: ${asset.assetId})`);
    console.log(`   ✅ Auto-resolved Classification: [${asset.classification}]`);
    console.log(`      - Legal Reason: ${meta.classificationRule.reason}`);
    console.log(`      - Legal References: ${meta.classificationRule.legalReferences.join(', ')}`);
    console.log(`      - Controls Applied: ${meta.classificationRule.controls.join(', ')}`);
    console.log(`   ✅ Auto-resolved Retention Policy:`);
    console.log(`      - Statutory Law: ${meta.retentionRule.statutoryLaw.join(', ')}`);
    console.log(`      - Trigger Event: ${meta.retentionRule.triggerEvent}`);

    // Since DentalClinic.xlsx has Health Data / Patient Identity, it MUST be classified as RESTRICTED
    assert.strictEqual(asset.classification, 'RESTRICTED');

    // 5. List Assets
    console.log('5. Listing governed data assets...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/governance/assets',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.data.data.length >= 1);
    console.log(`   ✅ Retrieved ${listRes.data.data.length} governed data assets.`);

    console.log('\n🎉 ALL GOVERNANCE & STATUTORY RULES TESTS PASSED!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runGovernanceTests().catch((err) => {
  console.error('\n❌ Governance test suite failed:', err);
  process.exit(1);
});
