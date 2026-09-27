"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const database_1 = require("../config/database");
const crypto_1 = require("../utils/crypto");
const logger_1 = require("../utils/logger");
class AuditService {
    /**
     * Records a tamper-evident, hash-chained audit log entry
     */
    static async log(params) {
        try {
            // Find latest audit entry for hash-chaining
            const lastLog = await database_1.prisma.auditLog.findFirst({
                orderBy: { createdAt: 'desc' },
            });
            const prevHash = lastLog ? lastLog.entryHash || '0' : 'GENESIS_BLOCK_HASH';
            const payloadString = JSON.stringify({
                entityType: params.entityType,
                entityId: params.entityId,
                action: params.action,
                performedBy: params.performedBy,
                changes: params.changes,
                prevHash,
                timestamp: new Date().toISOString(),
            });
            const entryHash = (0, crypto_1.sha256)(`${prevHash}:${payloadString}`);
            return await database_1.prisma.auditLog.create({
                data: {
                    entityType: params.entityType,
                    entityId: params.entityId,
                    action: params.action,
                    performedBy: params.performedBy,
                    changes: JSON.stringify(params.changes),
                    ipAddress: params.ipAddress,
                    prevHash,
                    entryHash,
                },
            });
        }
        catch (err) {
            logger_1.logger.error('Failed to write audit log', err);
            // Non-blocking in dev
            return null;
        }
    }
}
exports.AuditService = AuditService;
