// Path: src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../logger';
import { CONFIG } from '../environment';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (logger: Logger) => {
  return (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
        ...(CONFIG.NODE_ENV === 'development' && { stack: err.stack }),
      });
    }

    logger.error('Unhandled error', {
      error: err,
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
    });

    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      ...(CONFIG.NODE_ENV === 'development' && { stack: err.stack }),
    });
  };
};
