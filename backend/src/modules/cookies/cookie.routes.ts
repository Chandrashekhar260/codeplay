import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import {
  scanWebsiteHandler,
  getCookieInventoryHandler,
  updateCookieHandler,
  logVisitorConsentHandler,
  getCookieStatsHandler,
} from './cookie.controller';

const router = Router();

// ==========================================
// 1. Public Visitor Cookie Consent Telemetry (CMP Banner API)
// ==========================================
router.post('/consent', logVisitorConsentHandler);

// ==========================================
// 2. Protected DPO Cookie Governance & Scanner
// ==========================================
router.use(authenticate, requireTenant);

router.post('/scan', scanWebsiteHandler);
router.get('/inventory', getCookieInventoryHandler);
router.patch('/:cookieId', updateCookieHandler);
router.get('/stats', getCookieStatsHandler);

export default router;
