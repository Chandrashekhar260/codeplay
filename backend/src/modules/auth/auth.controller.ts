import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from './auth.schema';
import * as authService from './auth.service';

export async function registerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.register(validated, ipAddress, userAgent);

    res.status(201).json({
      success: true,
      message: 'Workspace and administrator account created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await authService.login(validated, ipAddress, userAgent);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function meHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || !req.tenantId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      });
      return;
    }

    const result = await authService.getCurrentUser(req.user.userId, req.tenantId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
