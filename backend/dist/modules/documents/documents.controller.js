"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsController = void 0;
const documents_service_1 = require("./documents.service");
const errors_1 = require("../../utils/errors");
class DocumentsController {
    static async upload(req, res, next) {
        try {
            if (!req.file) {
                throw new errors_1.ValidationError('No document file uploaded');
            }
            const { traineeId, outcomeId, docType } = req.body;
            const uploadedBy = req.user?.email || 'trainee';
            const result = await documents_service_1.DocumentsService.saveDocument({
                traineeId: traineeId || req.user?.traineeId,
                outcomeId,
                docType: docType || 'other',
                file: req.file,
                uploadedBy,
            });
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
                outcomeId: req.query.outcomeId,
            };
            const result = await documents_service_1.DocumentsService.listDocuments(filters);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
    static async verify(req, res, next) {
        try {
            const { status, notes } = req.body;
            const verifier = req.user?.email || 'Admin';
            const result = await documents_service_1.DocumentsService.verifyDocument(req.params.id, status, verifier, notes);
            return res.json({ success: true, data: result });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.DocumentsController = DocumentsController;
