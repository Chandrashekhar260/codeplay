import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const rawAuthHeader = req.headers.authorization;

  if (!rawAuthHeader) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Auth] 401 UNAUTHORIZED: Missing Authorization header on ${req.method} ${req.originalUrl}`);
    }
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication token required. Please provide "Authorization: Bearer <token>"',
      },
    });
    return;
  }

  // Extract JWT using bulletproof pattern matching (handles duplicate headers, quotes, prefix issues)
  const jwtRegex = /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/;
  const match = String(rawAuthHeader).match(jwtRegex);
  const token = match ? match[0] : String(rawAuthHeader).replace(/^bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

  try {
    const payload = verifyToken(token);
    req.user = payload;
    req.tenantId = payload.tenantId;
    next();
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[Auth] 401 INVALID_TOKEN on ${req.method} ${req.originalUrl}: ${error.message} (token preview: ${token.substring(0, 20)}...)`);
    }
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        detail: error.message,
      },
    });
    return;
  }
}
