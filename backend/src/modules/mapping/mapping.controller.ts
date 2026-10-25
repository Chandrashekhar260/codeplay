import { Request, Response, NextFunction } from 'express';
import {
  createActivitySchema,
  createDataFlowSchema,
  createRecipientSchema,
  createRetentionSchema,
  recommendRetentionSchema,
} from './mapping.schema';
import * as mappingService from './mapping.service';

export async function recommendRetentionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const validated = recommendRetentionSchema.parse(req.body);

    const recommendation = await mappingService.getRetentionRecommendation(tenantId, validated);

    res.status(200).json({
      success: true,
      data: recommendation,
    });
  } catch (error) {
    next(error);
  }
}

export async function createActivityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const validated = createActivitySchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await mappingService.createProcessingActivity(
      tenantId,
      userId,
      validated,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      message: 'Processing activity and data elements registered in RoPA inventory',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function addFlowHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { activityId } = req.params;
    const validated = createDataFlowSchema.parse(req.body);

    const flow = await mappingService.addDataFlow(tenantId, activityId, validated);

    res.status(201).json({
      success: true,
      message: 'Data flow stage added',
      data: flow,
    });
  } catch (error) {
    next(error);
  }
}

export async function addRecipientHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { activityId } = req.params;
    const validated = createRecipientSchema.parse(req.body);

    const recipient = await mappingService.addRecipient(tenantId, activityId, validated);

    res.status(201).json({
      success: true,
      message: 'Third-party recipient recorded',
      data: recipient,
    });
  } catch (error) {
    next(error);
  }
}

export async function addRetentionHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { activityId } = req.params;
    const validated = createRetentionSchema.parse(req.body);

    const policy = await mappingService.addRetentionPolicy(tenantId, activityId, validated);

    res.status(201).json({
      success: true,
      message: 'Retention schedule registered',
      data: policy,
    });
  } catch (error) {
    next(error);
  }
}

export async function listActivitiesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const activities = await mappingService.listActivities(tenantId);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    next(error);
  }
}

export async function getActivityHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { activityId } = req.params;
    const activity = await mappingService.getActivity(tenantId, activityId);

    res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    next(error);
  }
}

export async function getGraphHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const graphData = await mappingService.getRelationshipGraph(tenantId);

    res.status(200).json({
      success: true,
      data: graphData,
    });
  } catch (error) {
    next(error);
  }
}
