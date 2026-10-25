import { Request, Response, NextFunction } from 'express';
import * as discoveryService from './discovery.service';

export async function uploadSourceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_UPLOADED', message: 'Please select a CSV or XLSX file to upload' },
      });
      return;
    }

    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // 1. Register data source
    const dataSource = await discoveryService.registerDataSource(
      tenantId,
      userId,
      {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
      ipAddress,
      userAgent
    );

    // 2. Automatically trigger discovery scan
    const scanResult = await discoveryService.runScan(dataSource.sourceId, tenantId, userId);

    res.status(201).json({
      success: true,
      message: 'File uploaded and scanned successfully for personal data (PII)',
      data: {
        source: dataSource,
        job: scanResult.job,
        findings: scanResult.findings,
        flags: scanResult.flags,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function triggerScanHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user!.userId;
    const { sourceId } = req.params;

    const scanResult = await discoveryService.runScan(sourceId, tenantId, userId);

    res.status(200).json({
      success: true,
      message: 'Scan completed successfully',
      data: scanResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function listSourcesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const sources = await discoveryService.listDataSources(tenantId);

    res.status(200).json({
      success: true,
      data: sources,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSourceHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { sourceId } = req.params;
    const source = await discoveryService.getDataSource(sourceId, tenantId);

    res.status(200).json({
      success: true,
      data: source,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFindingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { sourceId } = req.params;
    const result = await discoveryService.getFindings(sourceId, tenantId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFlagsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = req.tenantId!;
    const { sourceId } = req.params;
    const flags = await discoveryService.getFlags(sourceId, tenantId);

    res.status(200).json({
      success: true,
      data: flags,
    });
  } catch (error) {
    next(error);
  }
}
