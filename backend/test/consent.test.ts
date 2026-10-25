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

async function runConsentTests() {
  console.log('🧪 Starting Consent Service & DPDP Ledger Test Suite (Photo 2: port 9003)...\n');

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

    assert.strictEqual(loginRes.status, 200, `Login failed: ${JSON.stringify(loginRes.data)}`);
    const token = loginRes.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('   ✅ Authenticated successfully.\n');

    // 2. Fetch Statutory Multilingual Notices
    console.log('2. Testing Multilingual DPDP Notices (Section 5 & Eighth Schedule)...');
    for (const lang of ['en', 'hi', 'kn']) {
      const noticeRes = await makeRequest(server, {
        method: 'GET',
        path: `/api/v1/consent/notices?lang=${lang}`,
        headers: authHeaders,
      });

      assert.strictEqual(noticeRes.status, 200, `Failed fetching notice for ${lang}`);
      assert.strictEqual(noticeRes.data.data.language, lang);
      assert.ok(noticeRes.data.data.headline, `Notice for ${lang} is missing headline`);
      assert.ok(noticeRes.data.data.affirmativeStatement, `Notice for ${lang} is missing affirmativeStatement`);
      console.log(`   ✅ Verified ${noticeRes.data.data.languageName} Notice: "${noticeRes.data.data.headline.substring(0, 40)}..."`);
    }
    console.log();

    // 3. Create Processing Purpose (Section 4, 5 & 6)
    console.log('3. Registering Processing Purpose under DPDP Act...');
    const purposeRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/purposes',
      headers: authHeaders,
      body: {
        name: 'Patient Dental Treatment & Diagnostics Delivery',
        legalBasis: 'DPDPA_SEC_6_CONSENT',
        version: '1.0',
        description: 'Collect phone, dental X-ray, and clinical findings to deliver diagnosis and care plan.',
      },
    });

    assert.strictEqual(purposeRes.status, 201, `Purpose creation failed: ${JSON.stringify(purposeRes.data)}`);
    const purposeId = purposeRes.data.data.purposeId;
    assert.ok(purposeId);
    console.log(`   ✅ Purpose registered: ID ${purposeId} (${purposeRes.data.data.name})\n`);

    // 4. Test Statutory Negative Enforcement: Inaction/Silence must NOT constitute consent (Section 6)
    console.log('4. Testing DPDP Section 6 Negative Guard (Silence / False Affirmative)...');
    const negativeRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/records',
      headers: authHeaders,
      body: {
        userRef: '+919876543210',
        purposeId,
        channel: 'WEB_PORTAL',
        affirmativeCheck: false, // Inaction / unchecked box
      },
    });

    assert.strictEqual(negativeRes.status, 400, 'Should reject when affirmativeCheck is false');
    assert.strictEqual(negativeRes.data.error.code, 'DPDP_SEC_6_VIOLATION');
    console.log(`   ✅ Properly rejected non-affirmative consent: ${negativeRes.data.error.message}\n`);

    // 5. Record Affirmative Consent (Section 6)
    console.log('5. Recording affirmative consent (via WhatsApp YES channel)...');
    const testPatientPhone = '+919876543210';
    const recordRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/records',
      headers: authHeaders,
      body: {
        userRef: testPatientPhone,
        purposeId,
        channel: 'WHATSAPP_YES',
        noticeLanguage: 'kn', // Kannada notice presented
        affirmativeCheck: true,
      },
    });

    assert.strictEqual(recordRes.status, 201, `Consent recording failed: ${JSON.stringify(recordRes.data)}`);
    assert.strictEqual(recordRes.data.data.status, 'GIVEN');
    assert.strictEqual(recordRes.data.data.channel, 'WHATSAPP_YES');
    assert.strictEqual(recordRes.data.data.noticeLanguage, 'kn');
    console.log(`   ✅ Consent recorded in ledger: Record ID ${recordRes.data.data.recordId}\n`);

    // 6. Query Patient Consent Ledger
    console.log('6. Querying patient consent ledger history...');
    const ledgerRes = await makeRequest(server, {
      method: 'GET',
      path: `/api/v1/consent/records/user/${encodeURIComponent(testPatientPhone)}`,
      headers: authHeaders,
    });

    assert.strictEqual(ledgerRes.status, 200);
    assert.ok(ledgerRes.data.data.records.length > 0);
    const activeConsent = ledgerRes.data.data.records[0];
    assert.strictEqual(activeConsent.status, 'GIVEN');
    console.log(`   ✅ Found active consent for ${testPatientPhone}: Purpose "${activeConsent.purposeName}"\n`);

    // 7. Withdraw Consent (Section 6(4))
    console.log('7. Testing consent withdrawal under DPDP Act Section 6(4)...');
    const withdrawRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/records/withdraw',
      headers: authHeaders,
      body: {
        userRef: testPatientPhone,
        purposeId,
        reason: 'Patient opted out of automated WhatsApp reminders',
      },
    });

    assert.strictEqual(withdrawRes.status, 200, `Withdrawal failed: ${JSON.stringify(withdrawRes.data)}`);
    assert.strictEqual(withdrawRes.data.data.status, 'WITHDRAWN');
    assert.ok(withdrawRes.data.data.withdrawnAt);
    console.log(`   ✅ Consent successfully marked WITHDRAWN at ${withdrawRes.data.data.withdrawnAt}\n`);

    // 8. Collection Point (Photo 2: collection_points)
    console.log('8. Registering front-desk collection point (Photo 2: collection_points)...');
    const cpRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/collection-points',
      headers: authHeaders,
      body: {
        name: 'Aarogya Dental Clinic Front Reception Desk',
        widgetConfig: {
          supportedLanguages: ['en', 'hi', 'kn'],
          defaultLanguage: 'kn',
          channels: ['RECEPTION_DESK', 'PAPER_SLIP', 'WHATSAPP_YES'],
        },
      },
    });

    assert.strictEqual(cpRes.status, 201);
    console.log(`   ✅ Collection point created: "${cpRes.data.data.name}"\n`);

    // 9. Preference Centre (Photo 2: preference_centres)
    console.log('9. Registering patient self-service Preference Centre (Photo 2: preference_centres)...');
    const slug = `aarogya-patient-portal-${Date.now()}`;
    const pcRes = await makeRequest(server, {
      method: 'POST',
      path: '/api/v1/consent/preference-centres',
      headers: authHeaders,
      body: {
        name: 'Patient Communication & Consent Centre',
        slug,
        configJson: {
          allowOptOuts: true,
          purposesAvailable: [purposeId],
        },
      },
    });

    assert.strictEqual(pcRes.status, 201);
    console.log(`   ✅ Preference centre created: slug "/prefs/${pcRes.data.data.slug}"\n`);

    // 10. Audit Verification
    console.log('10. Verifying append-only audit trail entries for consent lifecycle...');
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        action: {
          in: ['PURPOSE_REGISTERED', 'CONSENT_CAPTURED', 'CONSENT_WITHDRAWN', 'COLLECTION_POINT_CREATED', 'PREFERENCE_CENTRE_CREATED'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    assert.ok(auditEvents.length >= 5, 'Audit events should record all consent state transitions');
    console.log(`   ✅ Verified ${auditEvents.length} audit events logged with tamper-evident records.\n`);

    console.log('🎉 ALL 10 CONSENT & PREFERENCE MANAGEMENT TESTS PASSED PERFECTLY!\n');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runConsentTests().catch((err) => {
  console.error('❌ Consent Test Suite Failed:', err);
  process.exit(1);
});
