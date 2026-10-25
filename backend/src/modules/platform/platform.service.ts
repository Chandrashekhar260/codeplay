import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';

export async function getTenantWorkspace(tenantId: string) {
  const [tenant, auditEvents] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        _count: {
          select: {
            users: true,
            dataSources: true,
            purposes: true,
            consentRecords: true,
            dsrRequests: true,
            incidents: true,
          },
        },
      },
    }),
    prisma.auditEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  if (!tenant) {
    const error: any = new Error('Tenant workspace not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    id: tenant.id,
    name: tenant.name,
    plan: tenant.plan,
    status: tenant.status,
    createdAt: tenant.createdAt,
    counts: tenant._count,
    recentAuditEvents: auditEvents,
  };
}

export async function updateTenantWorkspace(
  tenantId: string,
  userId: string,
  data: { name?: string },
  ipAddress?: string,
  userAgent?: string
) {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      ...(data.name ? { name: data.name.trim() } : {}),
    },
  });

  await recordAuditEvent({
    tenantId,
    actorId: userId,
    action: 'TENANT_UPDATE',
    resourceType: 'TENANT',
    resourceId: tenantId,
    diffJson: data,
    ipAddress,
    userAgent,
  });

  return updated;
}
