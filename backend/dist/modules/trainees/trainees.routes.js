"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trainees_controller_1 = require("./trainees.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public OTP-gated record claim
router.post('/:id/claim-record', trainees_controller_1.TraineesController.claimRecord);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post('/', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'provider_staff'), trainees_controller_1.TraineesController.create);
router.get('/', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'provider_staff', 'field_officer'), trainees_controller_1.TraineesController.list);
router.get('/:id', trainees_controller_1.TraineesController.getById);
router.put('/:id', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'provider_staff'), trainees_controller_1.TraineesController.update);
exports.default = router;
