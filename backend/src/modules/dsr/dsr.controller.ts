import { Request, Response, NextFunction } from 'express';
import {
  createDsrRequestSchema,
  resolveDsrRequestSchema,
  portalAccessQuerySchema,
} from './dsr.schema';
import * as dsrService from './dsr.service';

import { prisma } from '../../lib/prisma';

/**
 * Public Data Principal Portal: Traverse graph to discover user's data & lineage
 */
export async function portalTraverseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      tenantId = tenant?.id || 'sample-tenant-aarogya-clinic';
    }
    const { userRef } = portalAccessQuerySchema.parse(req.body);

    const report = await dsrService.traverseUserGraph(tenantId, userRef);

    res.status(200).json({
      success: true,
      message: 'Data Principal graph traversal completed',
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Data Principal Portal: Submit Access / Correction / Erasure request
 */
export async function portalSubmitHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string);
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      tenantId = tenant?.id || 'sample-tenant-aarogya-clinic';
    }
    const validated = createDsrRequestSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const request = await dsrService.submitDsrRequest(tenantId, validated, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      message: `DPDP ${validated.requestType} request submitted successfully with statutory receipt`,
      data: request,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: List all DSR requests
 */
export async function listRequestsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const requests = await dsrService.listDsrRequests(tenantId);

    res.status(200).json({
      success: true,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Get active DSR alerts for RoPA graph nodes (yellow star flags)
 */
export async function getAlertsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const alerts = await dsrService.getActiveDsrAlerts(tenantId);

    res.status(200).json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Admin: Resolve DSR Request (Approve Correction / Process Erasure)
 */
export async function resolveRequestHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const { requestId } = req.params;
    const validated = resolveDsrRequestSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const updated = await dsrService.resolveDsrRequest(
      tenantId,
      userId,
      requestId,
      validated,
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      message: 'DSR Request resolved and database updated',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
