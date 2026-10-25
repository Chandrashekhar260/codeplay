import { randomUUID } from 'crypto';
import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';
import {
  CreatePurposeInput,
  RecordConsentInput,
  WithdrawConsentInput,
  CreateCollectionPointInput,
  CreatePreferenceCentreInput,
} from './consent.schema';
import { STATUTORY_NOTICES, ConsentNotice } from './consent.notices';

export async function createPurpose(
  tenantId: string,
  userId: string,
  input: CreatePurposeInput,
  ipAddress?: string,
  userAgent?: string
) {
  const purpose = await prisma.purpose.create({
    data: {
      tenantId,
      name: input.name.trim(),
      legalBasis: input.legalBasis || 'DPDPA_SEC_6_CONSENT',
      version: input.version || '1.0',
      description: input.description?.trim() || null,
    },
  });

  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'PURPOSE_REGISTERED',
    resourceType: 'PURPOSE',
    resourceId: purpose.purposeId,
    diffJson: {
      name: purpose.name,
      legalBasis: purpose.legalBasis,
      version: purpose.version,
    },
    ipAddress,
    userAgent,
  });

  return purpose;
}

export async function getPurposes(tenantId: string) {
  const purposes = await prisma.purpose.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { consentRecords: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return purposes.map((p) => ({
    purposeId: p.purposeId,
    name: p.name,
    legalBasis: p.legalBasis,
    version: p.version,
    description: p.description,
    createdAt: p.createdAt,
    consentCount: p._count.consentRecords,
  }));
}

export async function recordConsent(
  tenantId: string,
  userId: string,
  input: RecordConsentInput,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Statutory Enforcement: DPDP Act Section 6 mandates clear affirmative action
  if (!input.affirmativeCheck) {
    throw new Error(
      'DPDP_SEC_6_VIOLATION: Clear affirmative action is mandatory under Section 6. Silence, pre-ticked boxes, or inaction do not constitute valid consent.'
    );
  }

  // 2. Validate Purpose exists and belongs to tenant
  const purpose = await prisma.purpose.findFirst({
    where: { purposeId: input.purposeId, tenantId },
  });

  if (!purpose) {
    throw new Error('PURPOSE_NOT_FOUND: The specified processing purpose does not exist for this workspace.');
  }

  // 3. Create active consent record
  const consentRecord = await prisma.consentRecord.create({
    data: {
      tenantId,
      userRef: input.userRef.trim(),
      purposeId: input.purposeId,
      status: 'GIVEN',
      channel: input.channel || 'IN_PERSON_AFFIRMATIVE',
    },
  });

  // 4. If noticeLanguage column exists in Neon DB, sync it
  if (input.noticeLanguage) {
    await prisma
      .$executeRawUnsafe(
        `UPDATE "consent_records" SET "notice_language" = $1 WHERE "record_id" = $2`,
        input.noticeLanguage,
        consentRecord.recordId
      )
      .catch(() => {});
  }

  // 5. Record append-only audit event for DPDP compliance ledger
  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'CONSENT_CAPTURED',
    resourceType: 'CONSENT_RECORD',
    resourceId: consentRecord.recordId,
    diffJson: {
      userRef: consentRecord.userRef,
      purposeId: purpose.purposeId,
      purposeName: purpose.name,
      status: consentRecord.status,
      channel: consentRecord.channel,
      noticeLanguage: input.noticeLanguage || 'en',
      legalBasis: purpose.legalBasis,
    },
    ipAddress,
    userAgent,
  });

  return {
    ...consentRecord,
    noticeLanguage: input.noticeLanguage || 'en',
  };
}

export async function withdrawConsent(
  tenantId: string,
  userId: string,
  input: WithdrawConsentInput,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. Locate active consent record
  const existingRecord = await prisma.consentRecord.findFirst({
    where: {
      tenantId,
      userRef: input.userRef.trim(),
      purposeId: input.purposeId,
      status: 'GIVEN',
    },
    orderBy: { capturedAt: 'desc' },
  });

  if (!existingRecord) {
    throw new Error('NO_ACTIVE_CONSENT_FOUND: No active consent was found for this user and purpose.');
  }

  // 2. Mark consent as WITHDRAWN (DPDP Act Section 6(4))
  const updatedRecord = await prisma.consentRecord.update({
    where: { recordId: existingRecord.recordId },
    data: {
      status: 'WITHDRAWN',
    },
  });

  const now = new Date();
  await prisma
    .$executeRawUnsafe(
      `UPDATE "consent_records" SET "withdrawn_at" = NOW() WHERE "record_id" = $1`,
      existingRecord.recordId
    )
    .catch(() => {});

  // 3. Record audit event
  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'CONSENT_WITHDRAWN',
    resourceType: 'CONSENT_RECORD',
    resourceId: updatedRecord.recordId,
    diffJson: {
      userRef: updatedRecord.userRef,
      purposeId: input.purposeId,
      previousStatus: 'GIVEN',
      newStatus: 'WITHDRAWN',
      reason: input.reason || 'User requested withdrawal under DPDP Act Section 6(4)',
    },
    ipAddress,
    userAgent,
  });

  return {
    ...updatedRecord,
    withdrawnAt: now,
  };
}

export async function getUserConsentLedger(tenantId: string, userRef: string) {
  const records = await prisma.consentRecord.findMany({
    where: {
      tenantId,
      userRef: userRef.trim(),
    },
    include: {
      purpose: true,
    },
    orderBy: { capturedAt: 'desc' },
  });

  // Read extra notice_language / withdrawn_at columns if available
  const extraRows = await prisma
    .$queryRawUnsafe<Array<{ record_id: string; notice_language: string | null; withdrawn_at: Date | null }>>(
      `SELECT "record_id", "notice_language", "withdrawn_at" FROM "consent_records" WHERE "tenant_id" = $1 AND "user_ref" = $2`,
      tenantId,
      userRef.trim()
    )
    .catch(() => []);

  const extraMap = new Map(extraRows.map((r) => [r.record_id, r]));

  return records.map((r) => {
    const extra = extraMap.get(r.recordId);
    return {
      recordId: r.recordId,
      userRef: r.userRef,
      purposeId: r.purposeId,
      purposeName: r.purpose.name,
      legalBasis: r.purpose.legalBasis,
      status: r.status,
      channel: r.channel,
      noticeLanguage: extra?.notice_language || 'en',
      capturedAt: r.capturedAt,
      withdrawnAt: extra?.withdrawn_at || null,
    };
  });
}

export async function createCollectionPoint(
  tenantId: string,
  userId: string,
  input: CreateCollectionPointInput,
  ipAddress?: string,
  userAgent?: string
) {
  const cpId = randomUUID();
  const widgetConfigStr = input.widgetConfig ? JSON.stringify(input.widgetConfig) : null;

  await prisma.$executeRawUnsafe(
    `INSERT INTO "collection_points" ("cp_id", "tenant_id", "name", "widget_config", "created_at") VALUES ($1, $2, $3, $4, NOW())`,
    cpId,
    tenantId,
    input.name.trim(),
    widgetConfigStr
  );

  const rows = await prisma.$queryRawUnsafe<Array<{ cp_id: string; tenant_id: string; name: string; widget_config: string | null; created_at: Date }>>(
    `SELECT "cp_id", "tenant_id", "name", "widget_config", "created_at" FROM "collection_points" WHERE "cp_id" = $1`,
    cpId
  );

  const cp = rows[0] || {
    cp_id: cpId,
    tenant_id: tenantId,
    name: input.name.trim(),
    widget_config: widgetConfigStr,
    created_at: new Date(),
  };

  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'COLLECTION_POINT_CREATED',
    resourceType: 'COLLECTION_POINT',
    resourceId: cpId,
    diffJson: { name: cp.name },
    ipAddress,
    userAgent,
  });

  return {
    cpId: cp.cp_id,
    tenantId: cp.tenant_id,
    name: cp.name,
    widgetConfig: cp.widget_config ? JSON.parse(cp.widget_config) : null,
    createdAt: cp.created_at,
  };
}

export async function getCollectionPoints(tenantId: string) {
  const rows = await prisma
    .$queryRawUnsafe<Array<{ cp_id: string; tenant_id: string; name: string; widget_config: string | null; created_at: Date }>>(
      `SELECT "cp_id", "tenant_id", "name", "widget_config", "created_at" FROM "collection_points" WHERE "tenant_id" = $1 ORDER BY "created_at" DESC`,
      tenantId
    )
    .catch(() => []);

  return rows.map((r) => ({
    cpId: r.cp_id,
    tenantId: r.tenant_id,
    name: r.name,
    widgetConfig: r.widget_config ? JSON.parse(r.widget_config) : null,
    createdAt: r.created_at,
  }));
}

export async function createPreferenceCentre(
  tenantId: string,
  userId: string,
  input: CreatePreferenceCentreInput,
  ipAddress?: string,
  userAgent?: string
) {
  const pcId = randomUUID();
  const configJsonStr = input.configJson ? JSON.stringify(input.configJson) : null;
  const slug = input.slug.trim().toLowerCase();

  await prisma.$executeRawUnsafe(
    `INSERT INTO "preference_centres" ("pc_id", "tenant_id", "name", "slug", "config_json", "created_at") VALUES ($1, $2, $3, $4, $5, NOW())`,
    pcId,
    tenantId,
    input.name.trim(),
    slug,
    configJsonStr
  );

  const rows = await prisma.$queryRawUnsafe<Array<{ pc_id: string; tenant_id: string; name: string; slug: string; config_json: string | null; created_at: Date }>>(
    `SELECT "pc_id", "tenant_id", "name", "slug", "config_json", "created_at" FROM "preference_centres" WHERE "pc_id" = $1`,
    pcId
  );

  const pc = rows[0] || {
    pc_id: pcId,
    tenant_id: tenantId,
    name: input.name.trim(),
    slug,
    config_json: configJsonStr,
    created_at: new Date(),
  };

  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'PREFERENCE_CENTRE_CREATED',
    resourceType: 'PREFERENCE_CENTRE',
    resourceId: pcId,
    diffJson: { name: pc.name, slug: pc.slug },
    ipAddress,
    userAgent,
  });

  return {
    pcId: pc.pc_id,
    tenantId: pc.tenant_id,
    name: pc.name,
    slug: pc.slug,
    configJson: pc.config_json ? JSON.parse(pc.config_json) : null,
    createdAt: pc.created_at,
  };
}

export async function getPreferenceCentreBySlug(tenantId: string, slug: string) {
  const rows = await prisma
    .$queryRawUnsafe<Array<{ pc_id: string; tenant_id: string; name: string; slug: string; config_json: string | null; created_at: Date }>>(
      `SELECT "pc_id", "tenant_id", "name", "slug", "config_json", "created_at" FROM "preference_centres" WHERE "tenant_id" = $1 AND "slug" = $2 LIMIT 1`,
      tenantId,
      slug.trim().toLowerCase()
    )
    .catch(() => []);

  if (!rows || rows.length === 0) {
    throw new Error('PREFERENCE_CENTRE_NOT_FOUND: The requested preference center slug does not exist.');
  }

  const pc = rows[0];
  return {
    pcId: pc.pc_id,
    tenantId: pc.tenant_id,
    name: pc.name,
    slug: pc.slug,
    config: pc.config_json ? JSON.parse(pc.config_json) : null,
    createdAt: pc.created_at,
  };
}

export function getStatutoryNotice(language: 'en' | 'hi' | 'kn' = 'en'): ConsentNotice {
  return STATUTORY_NOTICES[language] || STATUTORY_NOTICES.en;
}
