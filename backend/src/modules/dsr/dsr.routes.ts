import { Router } from 'express';
import {
  portalTraverseHandler,
  portalSubmitHandler,
  listRequestsHandler,
  getAlertsHandler,
  resolveRequestHandler,
  getBusinessesHandler,
  trackRequestHandler,
} from './dsr.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import { prisma } from '../../lib/prisma';

const router = Router();

// Middleware to resolve tenant for Data Principal portal self-service
async function resolvePortalTenant(req: any, res: any, next: any) {
  try {
    if (req.headers.authorization) {
      return authenticate(req, res, () => requireTenant(req, res, next));
    }
    const tenant = await prisma.tenant.findFirst();
    req.tenantId = tenant?.id || 'default-msme-tenant';
    next();
  } catch (err) {
    next(err);
  }
}

// ==========================================
// 1. Data Principal Self-Service Portal (Public / Citizen)
// ==========================================
router.get('/portal/businesses', getBusinessesHandler);
router.get('/portal/track/:requestId', trackRequestHandler);
router.post('/portal/track', trackRequestHandler);
router.post('/portal/traverse', resolvePortalTenant, portalTraverseHandler);
router.post('/portal/submit', resolvePortalTenant, portalSubmitHandler);

// ==========================================
// 2. Enterprise DPO / Admin Management (Protected)
// ==========================================
router.get('/requests', authenticate, requireTenant, listRequestsHandler);
router.get('/alerts', authenticate, requireTenant, getAlertsHandler);
router.post('/requests/:requestId/resolve', authenticate, requireTenant, resolveRequestHandler);

export default router;
