"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireConsent = void 0;
const database_1 = require("../config/database");
const errors_1 = require("../utils/errors");
/**
 * Enforces that a trainee has granted active consent for a specific action/purpose
 */
const requireConsent = (consentType) => {
    return async (req, _res, next) => {
        try {
            const traineeId = req.params.traineeId || req.body.traineeId || req.user?.traineeId;
            if (!traineeId) {
                return next();
            }
            // Check the latest consent record
            const record = await database_1.prisma.consentRecord.findFirst({
                where: {
                    traineeId,
                    consentType,
                },
                orderBy: {
                    grantedAt: 'desc',
                },
            });
            if (!record || record.status !== 'granted') {
                return next(new errors_1.ForbiddenError(`Operation blocked: Trainee has not granted consent for purpose '${consentType}'`));
            }
            next();
        }
        catch (err) {
            next(err);
        }
    };
};
exports.requireConsent = requireConsent;
