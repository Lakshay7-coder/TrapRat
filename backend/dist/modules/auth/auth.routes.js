"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const users_controller_1 = require("../users/users.controller");
const router = (0, express_1.Router)();
router.post('/register', auth_controller_1.AuthController.register);
router.post('/login', auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refresh);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
// Route alias for frontend compatibility (/api/auth/me)
router.get('/me', auth_middleware_1.authenticate, users_controller_1.UsersController.getMe);
exports.default = router;
