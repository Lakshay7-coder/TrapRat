"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const incentives_service_1 = require("./incentives.service");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', async (req, res, next) => {
    try {
        const traineeId = req.query.traineeId || req.user?.traineeId;
        if (!traineeId)
            return res.json({ success: true, data: [] });
        const items = await incentives_service_1.IncentivesService.listTraineeIncentives(traineeId);
        return res.json({ success: true, data: items });
    }
    catch (err) {
        next(err);
    }
});
router.post('/:id/redeem', async (req, res, next) => {
    try {
        const updated = await incentives_service_1.IncentivesService.redeemIncentive(req.params.id);
        return res.json({ success: true, data: updated });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
