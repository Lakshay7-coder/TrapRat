import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { JwtPayload } from '../types';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies['ks_access_token']) {
      token = req.cookies['ks_access_token'];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Token has expired'));
    } else if (err instanceof UnauthorizedError) {
      next(err);
    } else {
      next(new UnauthorizedError('Invalid authentication token'));
    }
  }
};

/**
 * Optional authentication: attaches user if token exists, otherwise continues
 */
export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies['ks_access_token']) {
      token = req.cookies['ks_access_token'];
    }

    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
    }
  } catch {
    // Ignore invalid token in optional mode
  }
  next();
};
