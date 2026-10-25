import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as platformService from './platform.service';

const updateTenantSchema = z.object({
  name: z.string().min(2).max(100).optional(),
});

export async function getTenantHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const workspace = await platformService.getTenantWorkspace(tenantId);

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTenantHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const validated = updateTenantSchema.parse(req.body);

    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const updated = await platformService.updateTenantWorkspace(
      tenantId,
      userId,
      validated,
      ipAddress,
      userAgent
    );

    res.status(200).json({
      success: true,
      message: 'Workspace updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
