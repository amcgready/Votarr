// src/middleware/monitoring.ts
import { Request, Response, NextFunction } from 'express';
import { monitoring } from '../config/monitoring';
import { logger } from '../config/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Attach request ID to response headers
  res.setHeader('x-request-id', requestId);

  // Log request start
  logger.info('Request started', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  // Track response
  monitoring.trackAPIResponse(res, `${req.method} ${req.route?.path || req.path}`);

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    });

    // Track response time metric
    monitoring.captureMetric('http.request_duration', duration, {
      method: req.method,
      path: req.route?.path || req.path,
      status: res.statusCode.toString()
    });
  });

  next();
};

export const errorMonitoring = (err: Error, req: Request, res: Response, next: NextFunction) => {
  monitoring.captureError(err, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    requestId: res.getHeader('x-request-id')
  });
  next(err);
};

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
