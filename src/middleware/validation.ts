// Path: src/middleware/validation.ts

import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[property]);
      req[property] = data;
      next();
    } catch (error) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors,
      });
    }
  };
};
