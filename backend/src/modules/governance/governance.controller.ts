import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as governanceService from './governance.service';

const registerAssetSchema = z.object({
  name: z.string().min(2, 'Asset name is required'),
  type: z.string().default('SPREADSHEET'),
  sourceId: z.string().uuid().optional(),
  owner: z.string().min(2, 'Data owner is required'),
  steward: z.string().optional(),
  businessFunction: z.string().optional(),
  explicitClassification: z.enum(['RESTRICTED', 'CONFIDENTIAL', 'INTERNAL', 'PUBLIC']).optional(),
  explicitRetentionDays: z.number().int().positive().optional(),
});

export async function registerAssetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const validated = registerAssetSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await governanceService.registerDataAsset(
      tenantId,
      userId,
      validated as any,
      ipAddress,
      userAgent
    );

    res.status(201).json({
      success: true,
      message: 'Data asset registered with statutory classification and retention schedule',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssetsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const assets = await governanceService.listDataAssets(tenantId);

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
}

export async function getAssetHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { assetId } = req.params;
    const asset = await governanceService.getDataAsset(tenantId, assetId);

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export function getRulesCatalogHandler(req: Request, res: Response): void {
  const rules = governanceService.getAllGovernanceRules();
  res.status(200).json({
    success: true,
    data: rules,
  });
}
