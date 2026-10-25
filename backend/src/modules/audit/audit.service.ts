import { prisma } from '../../lib/prisma';

export interface RecordAuditParams {
  tenantId: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  diffJson?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function recordAuditEvent(params: RecordAuditParams) {
  try {
    return await prisma.auditEvent.create({
      data: {
        tenantId: params.tenantId,
        actorId: params.actorId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        diffJson: params.diffJson ? JSON.stringify(params.diffJson) : null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Audit logging should not crash the main transaction, but log the error
    console.error('[AuditLog] Failed to record audit event:', error);
    return null;
  }
}
