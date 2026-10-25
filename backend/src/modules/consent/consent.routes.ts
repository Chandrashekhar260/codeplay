import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';
import {
  createPurposeHandler,
  getPurposesHandler,
  recordConsentHandler,
  withdrawConsentHandler,
  getUserLedgerHandler,
  createCollectionPointHandler,
  getCollectionPointsHandler,
  createPreferenceCentreHandler,
  getPreferenceCentreHandler,
  getStatutoryNoticeHandler,
} from './consent.controller';

const router = Router();

// Protect all consent routes with JWT auth and multi-tenant isolation
router.use(authenticate, requireTenant);

// 1. Purposes
router.post('/purposes', createPurposeHandler);
router.get('/purposes', getPurposesHandler);

// 2. Consent Records & Ledger
router.post('/records', recordConsentHandler);
router.post('/records/withdraw', withdrawConsentHandler);
router.get('/records/user/:userRef', getUserLedgerHandler);

// 3. Collection Points (Photo 2)
router.post('/collection-points', createCollectionPointHandler);
router.get('/collection-points', getCollectionPointsHandler);

// 4. Preference Centres (Photo 2)
router.post('/preference-centres', createPreferenceCentreHandler);
router.get('/preference-centres/:slug', getPreferenceCentreHandler);

// 5. Statutory Multilingual Notice (English, Hindi, Kannada)
router.get('/notices', getStatutoryNoticeHandler);

export default router;
