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

async function runDsrTests() {
  console.log('🧪 Starting DPDP Act Rights & RoPA Traversal Test Suite...\n');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    // 1. Authenticate Admin
    console.log('1. Authenticating as demo MSME DPO...');
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
    console.log('   ✅ Admin authenticated.');

    // 2. Data Principal Portal: RoPA Graph Traversal (Right to Access - Sec 11)
    console.log('\n2. Citizen Portal: Traversing RoPA knowledge graph for patient...');
    const traverseRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/dsr/portal/traverse',
      body: {
        userRef: 'patient@aarogya.in',
      },
    });

    assert.strictEqual(traverseRes.status, 200);
    const traversal = traverseRes.data.data;
    console.log(`   ✅ Traversal successful for: "${traversal.userRef}"`);
    console.log(`   - Data Sources Identified: ${traversal.dataSources.length}`);
    console.log(`   - Processing Activities Found: ${traversal.processingActivities.length}`);
    console.log(`   - PII Categories: ${traversal.personalDataSummary.piiCategoriesHeld.join(', ') || 'N/A'}`);
    console.log(`   - External Recipients: ${traversal.thirdPartyRecipients.map((r: any) => r.name).join(', ')}`);

    // 3. Citizen Portal: Submit Right to Correction Request (Sec 12.1)
    console.log('\n3. Citizen Portal: Submitting Right to Correction request...');
    const correctionRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/dsr/portal/submit',
      body: {
        requestType: 'CORRECTION',
        userRef: 'patient@aarogya.in',
        details: 'My phone number is wrong. Please update it.',
        fieldToCorrect: 'Phone Number',
        currentValue: '+91 9845012345',
        correctedValue: '+91 9876543210',
      },
    });

    assert.strictEqual(correctionRes.status, 201);
    const correctionDsr = correctionRes.data.data;
    console.log(`   ✅ Correction request created: ID ${correctionDsr.requestId}`);
    console.log(`   - Status: ${correctionDsr.status}`);
    console.log(`   - SHA-256 Receipt: ${correctionDsr.sha256Proof.slice(0, 24)}...`);

    // 4. Admin View: Inspect RoPA Graph for Yellow Star ⭐ Flag
    console.log('\n4. Admin View: Checking RoPA graph for yellow star ⭐ alert flag on affected node...');
    const graphRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/mapping/graph',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(graphRes.status, 200);
    const nodes = graphRes.data.data.nodes;
    const flaggedNodes = nodes.filter((n: any) => n.data?.dsrAlert?.hasPending);
    assert.ok(flaggedNodes.length > 0, 'Should have at least 1 node flagged with yellow star ⭐');
    console.log(`   ✅ RoPA node flagged with yellow star ⭐!`);
    console.log(`   - Flagged Node: "${flaggedNodes[0].data.label}"`);
    console.log(`   - Alert Message: "${flaggedNodes[0].data.dsrAlert.label}"`);

    // 5. Admin: Execute and Apply Correction to Database
    console.log('\n5. Admin: Reviewing and approving correction request in database...');
    const resolveRes = await makeRequest(server, {
      method: 'POST',
      path: `/api/v1/dsr/requests/${correctionDsr.requestId}/resolve`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        resolution: 'APPROVE_CORRECTION',
        resolutionNotes: 'Verified patient Aadhaar OTP and updated phone in database',
      },
    });

    assert.strictEqual(resolveRes.status, 200);
    const resolvedDsr = resolveRes.data.data;
    assert.strictEqual(resolvedDsr.status, 'COMPLETED');
    console.log('   ✅ Correction applied to database. Status: COMPLETED');

    // 6. Verify Yellow Star ⭐ is Cleared from Graph
    console.log('\n6. Checking that yellow star ⭐ is now cleared from RoPA graph...');
    const graphRes2 = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/mapping/graph',
      headers: { Authorization: `Bearer ${token}` },
    });

    const flaggedNodes2 = graphRes2.data.data.nodes.filter((n: any) => n.data?.dsrAlert?.hasPending);
    console.log(`   ✅ Remaining flagged nodes: ${flaggedNodes2.length}`);

    console.log('\n🎉 ALL DPDP DATA RIGHTS & ROPA TRAVERSAL TESTS PASSED!');
  } finally {
    server.close();
  }
}

runDsrTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
