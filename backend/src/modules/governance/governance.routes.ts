import { Router } from 'express';
import {
  registerAssetHandler,
  listAssetsHandler,
  getAssetHandler,
  getRulesCatalogHandler,
} from './governance.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Protect all governance routes with auth and tenant isolation
router.use(authenticate, requireTenant);

// Data Assets & Classification
router.post('/assets', registerAssetHandler);
router.get('/assets', listAssetsHandler);
router.get('/assets/:assetId', getAssetHandler);

// Legal & Statutory Rules Catalog
router.get('/rules', getRulesCatalogHandler);

export default router;
