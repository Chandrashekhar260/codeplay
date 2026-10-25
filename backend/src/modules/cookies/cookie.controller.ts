import { Request, Response } from 'express';
import * as cookieService from './cookie.service';
import { prisma } from '../../lib/prisma';

export async function scanWebsiteHandler(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = (req.user as any)?.userId || (req.user as any)?.id || 'system-dpo';
    const { websiteUrl } = req.body;

    if (!websiteUrl || typeof websiteUrl !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'A valid website URL is required to execute cookie scan.' },
      });
      return;
    }

    const scanResult = await cookieService.scanWebsite(
      tenantId,
      userId,
      websiteUrl,
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      message: `Website cookie scan completed. Discovered ${scanResult.totalCookies} active cookies & trackers.`,
      data: scanResult,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message || 'Failed to scan website for cookies.' },
    });
  }
}

export async function getCookieInventoryHandler(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const inventory = await cookieService.getCookieInventory(tenantId);

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
}

export async function updateCookieHandler(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = (req.user as any)?.userId || (req.user as any)?.id || 'system-dpo';
    const { cookieId } = req.params;
    const { category, purpose } = req.body;

    const updated = await cookieService.updateCookie(tenantId, userId, cookieId, {
      category,
      purpose,
    });

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Cookie categorization updated in DPO governance ledger.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
}

export async function logVisitorConsentHandler(req: Request, res: Response): Promise<void> {
  try {
    let tenantId = (req as any).tenantId || (req.headers['x-tenant-id'] as string) || req.body.tenantId;
    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst();
      tenantId = tenant?.id || 'sample-tenant-aarogya-clinic';
    }

    const { visitorId, accepted, rejected } = req.body;

    const log = await cookieService.logVisitorConsent(tenantId, {
      visitorId,
      accepted: Array.isArray(accepted) ? accepted : ['NECESSARY'],
      rejected: Array.isArray(rejected) ? rejected : [],
      userAgent: req.headers['user-agent'],
    });

    res.status(201).json({
      success: true,
      message: 'Visitor cookie consent preferences logged with cryptographic proof.',
      data: log,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
}

export async function getCookieStatsHandler(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const stats = await cookieService.getCookieStats(tenantId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { message: err.message },
    });
  }
}
