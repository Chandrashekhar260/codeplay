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

async function runMappingTests() {
  console.log('🧪 Starting RoPA Mapping & Relationship Graph Test Suite...\n');

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

    // 2. Fetch real uploaded data source
    console.log('2. Fetching real uploaded data source from PostgreSQL...');
    const sourcesRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/discovery/sources',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(sourcesRes.status, 200);
    const sources = sourcesRes.data.data;
    assert.ok(sources.length > 0, 'Should have at least 1 uploaded data source');
    const realSource = sources[0];
    console.log(`   ✅ Using real uploaded source: "${realSource.name}" (ID: ${realSource.sourceId})`);

    // 3. Create RoPA Processing Activity mapped to this real source
    console.log('3. Creating RoPA activity linked to real uploaded source...');
    const actRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/mapping/activities',
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'Patient Consultation & Blood Report Dispatch',
        businessFunction: 'Diagnostics & Healthcare',
        legalBasis: 'CONSENT',
        sourceId: realSource.sourceId, // Auto-maps discovered PII from this file!
      },
    });

    assert.strictEqual(actRes.status, 201);
    const activity = actRes.data.data.activity;
    const elements = actRes.data.data.dataElements;
    console.log(`   ✅ Activity created: "${activity.name}" (ID: ${activity.activityId})`);
    console.log(`   ✅ Automatically imported ${elements.length} data elements from uploaded file:`);
    for (const el of elements) {
      console.log(`      - PII Category: ${el.piiCategory} | Subjects: ${el.dataSubjects}`);
    }
    assert.ok(elements.length >= 1, 'Should auto-import discovered elements');

    // 4. Record Data Flow Stages (Collection -> Storage)
    console.log('4. Adding Data Flow stages...');
    const flow1Res = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/mapping/activities/${activity.activityId}/flows`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        flowStage: 'COLLECTION',
        systemName: 'Reception WhatsApp Phone',
        location: 'Bengaluru, India',
        safeguards: 'Device PIN and 2FA',
      },
    });
    assert.strictEqual(flow1Res.status, 201);

    const flow2Res = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/mapping/activities/${activity.activityId}/flows`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        flowStage: 'STORAGE',
        systemName: 'Local Clinic Reception PC (Excel)',
        location: 'Bengaluru, India',
        safeguards: 'BitLocker local drive encryption',
      },
    });
    assert.strictEqual(flow2Res.status, 201);
    console.log('   ✅ Added 2 data flow stages (Collection & Storage).');

    // 5. Record Third-Party Recipient
    console.log('5. Adding third-party recipient...');
    const recRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/mapping/activities/${activity.activityId}/recipients`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'Meta Platforms (WhatsApp Business API)',
        recipientType: 'PROCESSOR',
        country: 'India',
      },
    });
    assert.strictEqual(recRes.status, 201);
    console.log('   ✅ Added recipient: Meta / WhatsApp.');

    // 6. Record Retention Policy
    console.log('6. Adding retention policy...');
    const retRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/mapping/activities/${activity.activityId}/retention`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        retentionPeriodMonths: 36,
        triggerEvent: 'DIAGNOSTIC_REPORT_DISPATCH',
      },
    });
    assert.strictEqual(retRes.status, 201);
    console.log('   ✅ Added retention policy: 36 months.');

    // 7. List Activities
    console.log('7. Listing full RoPA activities...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/mapping/activities',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.data.data.length >= 1);
    console.log(`   ✅ Retrieved ${listRes.data.data.length} complete RoPA records.`);

    // 8. Generate React Flow Relationship Graph
    console.log('8. Generating React Flow relationship graph...');
    const graphRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/mapping/graph',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(graphRes.status, 200);
    const { nodes, edges } = graphRes.data.data;
    console.log(`   ✅ Graph generated with ${nodes.length} nodes and ${edges.length} edges:`);
    console.log(`      - Node Types: ${Array.from(new Set(nodes.map((n: any) => n.type))).join(', ')}`);
    assert.ok(nodes.length >= 4, 'Graph should contain source, element, activity, and system nodes');
    assert.ok(edges.length >= 2, 'Graph should contain connection edges');

    console.log('\n🎉 ALL ROPA MAPPING & RELATIONSHIP GRAPH TESTS PASSED!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runMappingTests().catch((err) => {
  console.error('\n❌ Mapping test suite failed:', err);
  process.exit(1);
});
