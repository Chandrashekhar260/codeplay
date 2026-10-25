import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';
import {
  CLASSIFICATION_RULES,
  RETENTION_RULES,
  CONSENT_RULES,
  DATA_RIGHTS_RULES,
  SECURITY_RULES,
  PENALTY_REFERENCES,
  resolveClassification,
  resolveRetentionSchedule,
  Classification,
} from './governance.rules';

export interface RegisterAssetInput {
  name: string;
  type: string; // "SPREADSHEET", "DATABASE", "CHAT_EXPORT", "INVOICE_ARCHIVE"
  sourceId?: string; // Link to uploaded data source
  owner: string; // e.g. "Ramesh Kumar (Managing Partner)"
  steward?: string; // e.g. "Dr. Ananya (Clinical Head)"
  businessFunction?: string;
  explicitClassification?: Classification;
  explicitRetentionDays?: number;
}

export async function registerDataAsset(
  tenantId: string,
  userId: string,
  input: RegisterAssetInput,
  ipAddress?: string,
  userAgent?: string
) {
  let resolvedClassification: Classification = input.explicitClassification || 'INTERNAL';
  let resolvedRetentionDays: number | null = input.explicitRetentionDays ?? null;
  const discoveredCategories: string[] = [];

  // 1. Auto-resolve classification & retention from real discovered data if sourceId is provided
  if (input.sourceId) {
    const latestJob = await prisma.scanJob.findFirst({
      where: { sourceId: input.sourceId, tenantId },
      orderBy: { startedAt: 'desc' },
      include: { scanFindings: true },
    });

    if (latestJob && latestJob.scanFindings.length > 0) {
      for (const finding of latestJob.scanFindings) {
        discoveredCategories.push(finding.piiCategories);
      }

      // Hierarchy: RESTRICTED > CONFIDENTIAL > INTERNAL > PUBLIC
      let highestRank = 0;
      const rankMap: Record<Classification, number> = {
        PUBLIC: 1,
        INTERNAL: 2,
        CONFIDENTIAL: 3,
        RESTRICTED: 4,
      };

      for (const category of discoveredCategories) {
        const rule = resolveClassification(category);
        const rank = rankMap[rule.classification] || 1;
        if (rank > highestRank) {
          highestRank = rank;
          resolvedClassification = rule.classification;
        }
      }

      // Resolve retention from business function or categories
      const retentionRule = resolveRetentionSchedule(
        input.businessFunction || input.name,
        discoveredCategories
      );
      if (retentionRule.retentionMonths) {
        resolvedRetentionDays = retentionRule.retentionMonths * 30; // e.g., 72 months -> 2,160 days
      } else if (retentionRule.retentionDays !== undefined) {
        resolvedRetentionDays = retentionRule.retentionDays;
      }
    }
  }

  // 2. Create DataAsset in database matching Photo 2
  const asset = await (prisma as any).dataAsset.create({
    data: {
      tenantId,
      name: input.name.trim(),
      type: input.type.toUpperCase(),
      classification: resolvedClassification,
      owner: input.owner.trim(),
      steward: input.steward ? input.steward.trim() : null,
      retentionDays: resolvedRetentionDays,
    },
  });

  // 3. Record Audit Event
  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'DATA_ASSET_GOVERNED',
    resourceType: 'DATA_ASSET',
    resourceId: asset.assetId,
    diffJson: {
      name: asset.name,
      classification: asset.classification,
      retentionDays: asset.retentionDays,
      owner: asset.owner,
    },
    ipAddress,
    userAgent,
  });

  return {
    asset,
    governanceMetadata: {
      discoveredCategories,
      classificationRule: resolveClassification(discoveredCategories[0] || 'GENERAL'),
      retentionRule: resolveRetentionSchedule(input.businessFunction || input.name, discoveredCategories),
    },
  };
}

export async function listDataAssets(tenantId: string) {
  return (prisma as any).dataAsset.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDataAsset(tenantId: string, assetId: string) {
  const asset = await (prisma as any).dataAsset.findFirst({
    where: { assetId, tenantId },
  });

  if (!asset) {
    const error: any = new Error('Data asset not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return asset;
}

export function getAllGovernanceRules() {
  return {
    classificationRules: CLASSIFICATION_RULES,
    retentionRules: RETENTION_RULES,
    consentRules: CONSENT_RULES,
    dataRightsRules: DATA_RIGHTS_RULES,
    securityRules: SECURITY_RULES,
    penaltyReferences: PENALTY_REFERENCES,
  };
}
