"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = void 0;
exports.getRowLevelScope = getRowLevelScope;
const errors_1 = require("../utils/errors");
/**
 * Authorize specified roles
 */
const authorize = (...allowedRoles) => {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new errors_1.UnauthorizedError('Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError(`Access forbidden: Role '${req.user.role}' is not authorized for this resource`));
        }
        next();
    };
};
exports.authorize = authorize;
/**
 * Helper to extract and enforce scoping filters based on user role
 */
function getRowLevelScope(req) {
    const user = req.user;
    if (!user)
        return {};
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
