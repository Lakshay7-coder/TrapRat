"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (msg, meta) => {
        console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
    },
    warn: (msg, meta) => {
        console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
    },
    error: (msg, meta) => {
        console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? meta : '');
    },
    debug: (msg, meta) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] [${new Date().toISOString()}] ${msg}`, meta !== undefined ? JSON.stringify(meta) : '');
        }
    },
};
