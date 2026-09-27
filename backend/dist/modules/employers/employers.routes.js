"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employers_controller_1 = require("./employers.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const router = (0, express_1.Router)();
// Public routes for token verification
router.get('/public/verify/:token', employers_controller_1.EmployersController.getPublicContext);
router.post('/public/verify/:token', employers_controller_1.EmployersController.submitPublicVerification);
// Protected routes
router.use(auth_middleware_1.authenticate);
router.post('/', (0, role_middleware_1.authorize)('admin', 'provider_admin'), employers_controller_1.EmployersController.create);
router.get('/', employers_controller_1.EmployersController.list);
router.get('/:id', employers_controller_1.EmployersController.getById);
router.post('/:id/send-verification-link', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'provider_staff'), employers_controller_1.EmployersController.sendVerificationLink);
exports.default = router;
