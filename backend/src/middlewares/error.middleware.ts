import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        details: err.details,
      },
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: err.flatten().fieldErrors,
      },
    });
  }

  logger.error('Unhandled Server Error', err);

  return res.status(500).json({
    success: false,
    error: {
      message: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
  });
};
