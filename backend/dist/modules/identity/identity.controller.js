"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityController = void 0;
const identity_service_1 = require("./identity.service");
const database_1 = require("../../config/database");
const errors_1 = require("../../utils/errors");
const audit_service_1 = require("../../services/audit.service");
class IdentityController {
    static async linkCandidates(req, res, next) {
        try {
            const { traineeId } = req.body;
            const candidates = await identity_service_1.IdentityService.findLinkCandidates(traineeId);
            return res.json({ success: true, data: candidates });
        }
        catch (err) {
            next(err);
        }
    }
    static async reviewQueue(_req, res, next) {
        try {
            const items = await database_1.prisma.identityLink.findMany({
                where: { status: 'under_review' },
                include: { trainee: true },
                orderBy: { confidence: 'desc' },
            });
            return res.json({ success: true, data: items });
        }
        catch (err) {
            next(err);
        }
    }
    static async resolve(req, res, next) {
        try {
            const { status } = req.body; // 'merged' | 'rejected'
            const link = await database_1.prisma.identityLink.findUnique({ where: { id: req.params.id } });
            if (!link)
                throw new errors_1.NotFoundError('Identity link record not found');
            const updated = await database_1.prisma.identityLink.update({
                where: { id: req.params.id },
                data: {
                    status: status || 'merged',
                    reviewedBy: req.user?.email || 'Admin',
                },
            });
            await audit_service_1.AuditService.log({
                entityType: 'IdentityLink',
                entityId: link.id,
                action: `IDENTITY_LINK_${status?.toUpperCase() || 'RESOLVED'}`,
                changes: { status },
            });
            return res.json({ success: true, data: updated });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.IdentityController = IdentityController;
