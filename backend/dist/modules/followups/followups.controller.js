"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowupsController = void 0;
const followups_service_1 = require("./followups.service");
class FollowupsController {
    static async schedule(req, res, next) {
        try {
            const { traineeId, outcomeId, startDate } = req.body;
            const result = await followups_service_1.FollowupsService.scheduleFollowups(traineeId, outcomeId, startDate ? new Date(startDate) : new Date());
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(req, res, next) {
        try {
            const filters = {
                traineeId: req.query.traineeId,
                status: req.query.status,
                channel: req.query.channel,
            };
            const result = await followups_service_1.FollowupsService.listFollowups(filters);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async recordResponse(req, res, next) {
        try {
            const { responseData, notes } = req.body;
            const result = await followups_service_1.FollowupsService.recordResponse(req.params.id, responseData, notes);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async webhookResponse(req, res, next) {
        try {
            const result = await followups_service_1.FollowupsService.handleIncomingResponse(req.body);
            return res.json({ success: true, ...result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.FollowupsController = FollowupsController;
