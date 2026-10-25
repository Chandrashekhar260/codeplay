import { Request, Response, NextFunction } from 'express';
import {
  createDsrRequestSchema,
  resolveDsrRequestSchema,
  portalAccessQuerySchema,
  trackRequestSchema,
} from './dsr.schema';
import * as dsrService from './dsr.service';

import { prisma } from '../../lib/prisma';

/**
 * Public Data Principal Portal: Get directory of registered businesses & websites
 */
export async function getBusinessesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const businesses = await dsrService.getPublicBusinesses();
    res.status(200).json({
      success: true,
      data: businesses,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Data Principal Portal: Track live status & DPO resolution of a statutory request
 */
export async function trackRequestHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const requestId = req.params.requestId || req.body?.requestId || (req.query?.requestId as string);
    if (!requestId) {
      res.status(400).json({
        success: false,
        error: { message: 'Request ID or SHA-256 proof is required' },
      });
      return;
    }

    const tracked = await dsrService.trackDsrRequest(requestId);
    res.status(200).json({
      success: true,
      data: tracked,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Public Data Principal Portal: Traverse graph to discover user's data & lineage
 */
export async function portalTraverseHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = portalAccessQuerySchema.parse(req.body);

    // Resolve tenant by explicit businessWebsite, tenantId, header, or fallback
    let tenantId = parsed.tenantId;
    if (!tenantId && parsed.businessWebsite) {
      const matched = await dsrService.findTenantByWebsiteOrName(parsed.businessWebsite);
      if (matched) tenantId = matched.id;
    }
    if (!tenantId) {
      tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string);
    }
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      tenantId = tenant?.id || 'sample-tenant-aarogya-clinic';
    }

    const report = await dsrService.traverseUserGraph(tenantId, parsed.userRef);

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
    const validated = createDsrRequestSchema.parse(req.body);

    // Resolve tenant by explicit businessWebsite, tenantId, header, or fallback
    let tenantId = validated.tenantId;
    if (!tenantId && validated.businessWebsite) {
      const matched = await dsrService.findTenantByWebsiteOrName(validated.businessWebsite);
      if (matched) tenantId = matched.id;
    }
    if (!tenantId) {
      tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string);
    }
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      tenantId = tenant?.id || 'sample-tenant-aarogya-clinic';
    }

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
