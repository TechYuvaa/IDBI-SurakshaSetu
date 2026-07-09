import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

// Extend Request interface to hold custom trace headers
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      traceId?: string;
      user?: any;
    }
  }
}

// Interceptor middleware for generating Correlation/Trace IDs and writing structured audit logs
export const auditLogger = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();

    req.correlationId = correlationId;
    req.traceId = traceId;

    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Trace-ID', traceId);

    // Intercept response finish for async audit writing
    res.on('finish', () => {
      // Fire-and-forget async DB write — never block or crash the response
      setImmediate(async () => {
        try {
          // Dynamically import prisma to avoid circular dependency crashes on cold start
          const { prisma } = await import('../config/db.js');
          
          const actorId = req.user?.id || null;
          const device = (req.headers['user-agent'] || 'Unknown').slice(0, 255);
          const ip = (req.ip || req.socket?.remoteAddress || '127.0.0.1').replace('::ffff:', '');
          const target = req.originalUrl;
          const location = req.headers['x-forwarded-for'] ? 'External' : 'Internal';

          await prisma.auditLog.create({
            data: {
              actorId,
              action,
              target,
              ip,
              location,
              device,
              oldValues: null,
              newValues: req.method !== 'GET' ? JSON.stringify({}) : null,
              correlationId,
              traceId,
              riskScore: res.locals.riskScore || 0
            }
          });
        } catch (err: any) {
          // Silent fail - audit log failure must NEVER crash the main request
          logger.error(`[AuditLog] Failed to write: ${err.message}`);
        }
      });
    });

    next();
  };
};
