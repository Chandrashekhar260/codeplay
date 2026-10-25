import { Router } from 'express';
import { getTenantHandler, updateTenantHandler } from './platform.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// All platform workspace endpoints require authentication and tenant isolation
router.use(authenticate, requireTenant);

router.get('/tenant', getTenantHandler);
router.patch('/tenant', updateTenantHandler);

export default router;
