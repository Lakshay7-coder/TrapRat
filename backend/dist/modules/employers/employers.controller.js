"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployersController = void 0;
const employers_service_1 = require("./employers.service");
class EmployersController {
    static async create(req, res, next) {
        try {
            const result = await employers_service_1.EmployersService.createEmployer(req.body);
            return res.status(201).json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async list(_req, res, next) {
        try {
            const result = await employers_service_1.EmployersService.listEmployers();
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async getById(req, res, next) {
        try {
            const result = await employers_service_1.EmployersService.getEmployerById(req.params.id);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async sendVerificationLink(req, res, next) {
        try {
            const { outcomeId } = req.body;
            const result = await employers_service_1.EmployersService.sendVerificationLink(req.params.id, outcomeId);
            return res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
    // Public verification handlers
    static async getPublicContext(req, res, next) {
        try {
            const result = await employers_service_1.EmployersService.getVerificationContext(req.params.token);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async submitPublicVerification(req, res, next) {
        try {
            const result = await employers_service_1.EmployersService.submitVerification(req.params.token, req.body);
            return res.json(result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.EmployersController = EmployersController;
