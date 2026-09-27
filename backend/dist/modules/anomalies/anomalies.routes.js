"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const anomalies_controller_1 = require("./anomalies.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get('/', (0, role_middleware_1.authorize)('admin', 'provider_admin'), anomalies_controller_1.AnomaliesController.list);
router.post('/scan', (0, role_middleware_1.authorize)('admin'), anomalies_controller_1.AnomaliesController.triggerScan);
router.get('/:id', (0, role_middleware_1.authorize)('admin', 'provider_admin'), anomalies_controller_1.AnomaliesController.getById);
router.put('/:id/review', (0, role_middleware_1.authorize)('admin'), anomalies_controller_1.AnomaliesController.review);
router.patch('/:id', (0, role_middleware_1.authorize)('admin'), anomalies_controller_1.AnomaliesController.review); // frontend patch compatibility
exports.default = router;
