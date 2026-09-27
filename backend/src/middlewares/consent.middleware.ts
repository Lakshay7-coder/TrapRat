import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { ForbiddenError } from '../utils/errors';
import { ConsentType } from '../types';

/**
 * Enforces that a trainee has granted active consent for a specific action/purpose
 */
export const requireConsent = (consentType: ConsentType) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const traineeId = req.params.traineeId || req.body.traineeId || req.user?.traineeId;

      if (!traineeId) {
        return next();
      }

      // Check the latest consent record
      const record = await prisma.consentRecord.findFirst({
        where: {
          traineeId,
          consentType,
        },
        orderBy: {
          grantedAt: 'desc',
        },
      });

      if (!record || record.status !== 'granted') {
        return next(
          new ForbiddenError(
            `Operation blocked: Trainee has not granted consent for purpose '${consentType}'`
          )
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
