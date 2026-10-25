import { Router } from 'express';
import {
  createActivityHandler,
  addFlowHandler,
  addRecipientHandler,
  addRetentionHandler,
  listActivitiesHandler,
  getActivityHandler,
  getGraphHandler,
} from './mapping.controller';
import { authenticate } from '../../middleware/auth';
import { requireTenant } from '../../middleware/tenant';

const router = Router();

// Protect all mapping & RoPA routes with auth and tenant isolation
router.use(authenticate, requireTenant);

// RoPA Activities
router.post('/activities', createActivityHandler);
router.get('/activities', listActivitiesHandler);
router.get('/activities/:activityId', getActivityHandler);

// Sub-resources under activity
router.post('/activities/:activityId/flows', addFlowHandler);
router.post('/activities/:activityId/recipients', addRecipientHandler);
router.post('/activities/:activityId/retention', addRetentionHandler);

// React Flow Relationship Graph
router.get('/graph', getGraphHandler);

export default router;
