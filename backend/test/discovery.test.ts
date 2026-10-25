import assert from 'assert';
import path from 'path';
import fs from 'fs';
import http from 'http';
import app from '../src/app';
import { prisma } from '../src/lib/prisma';

// Helper to make local HTTP requests to Express
function makeRequest(
  server: http.Server,
  options: {
    method: string;
    path: string;
    headers?: Record<string, string>;
    body?: any;
    isRawBuffer?: boolean;
  }
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const addr = server.address() as { port: number };
    let payload = options.body;
    const headers: Record<string, any> = { ...options.headers };

    if (!options.isRawBuffer && payload && typeof payload === 'object') {
      payload = JSON.stringify(payload);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: addr.port,
        path: options.path,
        method: options.method,
        headers,
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

// Multipart helper
function buildMultipartBody(boundary: string, fieldName: string, filePath: string): Buffer {
  const filename = path.basename(filePath);
  const fileContent = fs.readFileSync(filePath);

  const header = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: text/csv\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;

  return Buffer.concat([
    Buffer.from(header, 'utf8'),
    fileContent,
    Buffer.from(footer, 'utf8'),
  ]);
}

async function runDiscoveryTests() {
  console.log('🧪 Starting Discovery & PII Scanner Test Suite...\n');

  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    // 1. Authenticate using seeded MSME user
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
    console.log('   ✅ Authenticated successfully.');

    // 2. Upload and Scan sample clinic CSV
    console.log('2. Uploading and scanning sample clinic patient file...');
    const fixturePath = path.resolve(__dirname, 'fixtures/sample_clinic.csv');
    const boundary = `----WebKitFormBoundary${Date.now()}`;
    const multipartBuffer = buildMultipartBody(boundary, 'file', fixturePath);

    const uploadRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/discovery/upload',
      isRawBuffer: true,
      body: multipartBuffer,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(multipartBuffer.length),
      },
    });

    assert.strictEqual(uploadRes.status, 201);
    assert.strictEqual(uploadRes.data.success, true);
    const sourceId = uploadRes.data.data.source.sourceId;
    const findings = uploadRes.data.data.findings;
    const flags = uploadRes.data.data.flags;

    console.log(`   ✅ File uploaded. DataSource ID: ${sourceId}`);
    console.log(`   ✅ Discovered ${findings.length} PII fields via Python & Verhoeff checksum:`);
    for (const f of findings) {
      console.log(`      - [${f.sensitivityLevel}] ${f.fieldName} -> ${f.piiCategories}`);
    }

    assert.ok(findings.length >= 4, 'Should find at least 4 PII fields');
    assert.ok(findings.some((f: any) => f.piiCategories === 'AADHAAR'), 'Should detect Aadhaar');
    assert.ok(findings.some((f: any) => f.piiCategories === 'PAN'), 'Should detect PAN');
    assert.ok(findings.some((f: any) => f.piiCategories === 'PHONE_NUMBER'), 'Should detect Phone Number');

    console.log(`   ✅ Generated ${flags.length} remediation risk flags:`);
    for (const fl of flags) {
      console.log(`      - [${fl.severity}] ${fl.flagType}`);
    }
    assert.ok(flags.length >= 1, 'Should generate risk flags');

    // 3. List Data Sources
    console.log('3. Listing Data Sources for tenant...');
    const listRes = await makeRequest(server, {
      method: 'GET',
      path: '/api/v1/discovery/sources',
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(listRes.status, 200);
    assert.ok(listRes.data.data.length > 0);
    console.log(`   ✅ Retrieved ${listRes.data.data.length} registered data sources.`);

    // 4. Retrieve Findings Endpoint
    console.log('4. Testing GET /api/v1/discovery/sources/:id/findings...');
    const findingsRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/discovery/sources/${sourceId}/findings`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(findingsRes.status, 200);
    assert.strictEqual(findingsRes.data.data.findings.length, findings.length);
    console.log('   ✅ Findings endpoint verified.');

    // 5. Retrieve Flags Endpoint
    console.log('5. Testing GET /api/v1/discovery/sources/:id/flags...');
    const flagsRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/discovery/sources/${sourceId}/flags`,
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(flagsRes.status, 200);
    assert.ok(flagsRes.data.data.length >= 1);
    console.log('   ✅ Remediation flags endpoint verified.');

    console.log('\n🎉 ALL DISCOVERY & PII SCANNER TESTS PASSED!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runDiscoveryTests().catch((err) => {
  console.error('\n❌ Discovery test suite failed:', err);
  process.exit(1);
});
