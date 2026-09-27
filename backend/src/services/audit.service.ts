import { prisma } from '../config/database';
import { sha256 } from '../utils/crypto';
import { logger } from '../utils/logger';

export class AuditService {
  /**
   * Records a tamper-evident, hash-chained audit log entry
   */
  static async log(params: {
    entityType: string;
    entityId: string;
    action: string;
    performedBy?: string;
    changes: Record<string, any>;
    ipAddress?: string;
  }) {
    try {
      // Find latest audit entry for hash-chaining
      const lastLog = await prisma.auditLog.findFirst({
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

      const entryHash = sha256(`${prevHash}:${payloadString}`);

      return await prisma.auditLog.create({
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
    } catch (err) {
      logger.error('Failed to write audit log', err);
      // Non-blocking in dev
      return null;
    }
  }
}
