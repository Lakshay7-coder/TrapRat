import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { Role } from '../types';

/**
 * Authorize specified roles
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Role '${req.user.role}' is not authorized for this resource`
        )
      );
    }

    next();
  };
};

/**
 * Helper to extract and enforce scoping filters based on user role
 */
export function getRowLevelScope(req: Request) {
  const user = req.user;
  if (!user) return {};

  if (user.role === 'admin') {
    return {}; // Full access
  }

  if (user.role === 'provider_admin' || user.role === 'provider_staff') {
    return {
      providerId: user.providerId || undefined,
    };
  }

  if (user.role === 'trainee') {
    return {
      traineeId: user.traineeId || undefined,
    };
  }

  return {};
}
