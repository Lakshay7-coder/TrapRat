"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const followups_controller_1 = require("./followups.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public webhook endpoint for simulated bot / messaging replies
router.post('/webhook/response', followups_controller_1.FollowupsController.webhookResponse);
router.use(auth_middleware_1.authenticate);
router.post('/schedule', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'provider_staff'), followups_controller_1.FollowupsController.schedule);
router.get('/', followups_controller_1.FollowupsController.list);
router.post('/:id/record-response', followups_controller_1.FollowupsController.recordResponse);
exports.default = router;
