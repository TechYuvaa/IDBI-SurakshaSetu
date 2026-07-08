import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/db.js';
import { logger } from '../config/logger.js';

// Extend Request interface to hold custom trace headers and audit logs metadata
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
      traceId?: string;
      user?: any;
    }
  }
}

// Interceptor middleware for generating IDs and writing structured audit logs to Postgres
export const auditLogger = (action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Resolve Correlation ID and Trace ID
    const correlationId = (req.headers['x-correlation-id'] as string) || uuidv4();
    const traceId = (req.headers['x-trace-id'] as string) || uuidv4();
    
    req.correlationId = correlationId;
    req.traceId = traceId;
    
    // Attach headers to response for clients to track
    res.setHeader('X-Correlation-ID', correlationId);
    res.setHeader('X-Trace-ID', traceId);

    // Save initial state for update audits
    const oldValues = req.method === 'POST' ? null : req.body;

    // Intercept response finish
    res.on('finish', async () => {
      const statusCode = res.statusCode;
      
      // We only log successful mutations or failed sensitive actions
      if (statusCode >= 400 && req.method === 'GET') return; 

      try {
        const actorId = req.user?.id || null;
        const device = req.headers['user-agent'] || 'Unknown';
        const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
        const target = req.originalUrl;
        
        // Simple geo lookup mock (in production this uses a GeoIP service)
        const location = req.headers['x-forwarded-for'] ? 'External IP' : 'Localhost';

        // Write log entry to database asynchronously to avoid blocking the main event thread
        await prisma.auditLog.create({
          data: {
            actorId,
            action,
            target,
            ip,
            location,
            device,
            oldValues: oldValues ? JSON.stringify(oldValues) : null,
            newValues: req.method === 'GET' ? null : JSON.stringify(req.body),
            correlationId,
            traceId,
            riskScore: res.locals.riskScore || 0
          }
        });
      } catch (err: any) {
        logger.error(`Failed to write audit log: ${err.message}`, { correlationId, traceId });
      }
    });

    next();
  };
};
