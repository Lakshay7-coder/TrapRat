"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errors_1 = require("../utils/errors");
const authenticate = (req, _res, next) => {
    try {
        let token;
        // Check authorization header
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies['ks_access_token']) {
            token = req.cookies['ks_access_token'];
        }
        if (!token) {
            throw new errors_1.UnauthorizedError('Authentication token missing');
        }
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            next(new errors_1.UnauthorizedError('Token has expired'));
        }
        else if (err instanceof errors_1.UnauthorizedError) {
            next(err);
        }
        else {
            next(new errors_1.UnauthorizedError('Invalid authentication token'));
        }
    }
};
exports.authenticate = authenticate;
/**
 * Optional authentication: attaches user if token exists, otherwise continues
 */
const optionalAuthenticate = (req, _res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        else if (req.cookies && req.cookies['ks_access_token']) {
            token = req.cookies['ks_access_token'];
        }
        if (token) {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            req.user = decoded;
        }
    }
    catch {
        // Ignore invalid token in optional mode
    }
    next();
};
exports.optionalAuthenticate = optionalAuthenticate;
