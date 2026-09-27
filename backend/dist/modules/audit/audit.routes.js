"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', (0, role_middleware_1.authorize)('admin'), async (req, res, next) => {
    try {
        const { entityType, entityId } = req.query;
        const logs = await database_1.prisma.auditLog.findMany({
            where: {
                ...(entityType ? { entityType: entityType } : {}),
                ...(entityId ? { entityId: entityId } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
        const parsed = logs.map((l) => {
            let changes = {};
            try {
                if (l.changes)
                    changes = JSON.parse(l.changes);
            }
            catch {
                changes = {};
            }
            return { ...l, changes };
        });
        return res.json({ success: true, data: parsed });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
