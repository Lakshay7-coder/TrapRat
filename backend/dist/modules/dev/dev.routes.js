"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../../config/database");
const followups_service_1 = require("../followups/followups.service");
const router = (0, express_1.Router)();
// Dev only: inspect all mock notifications dispatched
router.get('/notification-inbox', async (_req, res, next) => {
    try {
        const logs = await database_1.prisma.notificationLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: { followup: { include: { trainee: true } } },
        });
        const parsed = logs.map((l) => {
            let payload = {};
            try {
                if (l.payload)
                    payload = JSON.parse(l.payload);
            }
            catch {
                payload = {};
            }
            return { ...l, payload };
        });
        return res.json({ success: true, data: parsed });
    }
    catch (err) {
        next(err);
    }
});
// Dev only: simulate incoming reply to a follow-up
router.post('/simulate-reply', async (req, res, next) => {
    try {
        const { followupId, traineeId, messageText } = req.body;
        const result = await followups_service_1.FollowupsService.handleIncomingResponse({
            followupId,
            traineeId,
            messageText,
        });
        return res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
