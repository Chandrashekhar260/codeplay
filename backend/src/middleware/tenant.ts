import { Request, Response, NextFunction } from 'express';

export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  const tokenTenantId = req.tenantId;

  if (!tokenTenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_REQUIRED',
        message: 'No tenant context found for this request',
      },
    });
    return;
  }

  // If client provided a tenantId in params or query, enforce that it matches the authenticated tenant
  const paramTenantId = req.params.tenantId || req.query.tenantId;
  if (paramTenantId && paramTenantId !== tokenTenantId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'TENANT_ISOLATION_VIOLATION',
        message: 'Cross-tenant access forbidden. Access to requested workspace is denied.',
      },
    });
    return;
  }

  next();
}
