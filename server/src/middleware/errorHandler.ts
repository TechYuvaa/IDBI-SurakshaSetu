import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = req.correlationId || 'N/A';
  const traceId = req.traceId || 'N/A';

  // Log full error details securely on the server
  logger.error(`${err.message} | Correlation: ${correlationId} | Trace: ${traceId}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  const statusCode = err.status || err.statusCode || 500;
  
  // Format standard response. Hide stack details in production.
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    error: isProduction ? 'Internal Server Error' : err.message,
    code: err.code || 'INTERNAL_ERROR',
    correlationId,
    traceId,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
