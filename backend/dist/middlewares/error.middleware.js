"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
                details: err.details,
            },
        });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(422).json({
            success: false,
            error: {
                message: 'Validation failed',
                details: err.flatten().fieldErrors,
            },
        });
    }
    logger_1.logger.error('Unhandled Server Error', err);
    return res.status(500).json({
        success: false,
        error: {
            message: 'Internal server error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        },
    });
};
exports.errorHandler = errorHandler;
