"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const documents_controller_1 = require("./documents.controller");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const role_middleware_1 = require("../../middlewares/role.middleware");
const upload = (0, multer_1.default)({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post('/upload', upload.single('file'), documents_controller_1.DocumentsController.upload);
router.get('/', documents_controller_1.DocumentsController.list);
router.put('/:id/verify', (0, role_middleware_1.authorize)('admin', 'provider_admin', 'field_officer'), documents_controller_1.DocumentsController.verify);
exports.default = router;
