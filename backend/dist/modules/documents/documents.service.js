"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const database_1 = require("../../config/database");
const env_1 = require("../../config/env");
const errors_1 = require("../../utils/errors");
const crypto_1 = require("../../utils/crypto");
const audit_service_1 = require("../../services/audit.service");
const trustScore_service_1 = require("../outcomes/trustScore.service");
class DocumentsService {
    static async saveDocument(data) {
        // Ensure upload dir exists
        const uploadPath = path_1.default.resolve(env_1.env.UPLOAD_DIR);
        if (!fs_1.default.existsSync(uploadPath)) {
            fs_1.default.mkdirSync(uploadPath, { recursive: true });
        }
        const contentHash = (0, crypto_1.sha256)(data.file.buffer || fs_1.default.readFileSync(data.file.path));
        const fileName = `${Date.now()}-${data.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const destination = path_1.default.join(uploadPath, fileName);
        if (data.file.buffer) {
            fs_1.default.writeFileSync(destination, data.file.buffer);
        }
        const fileUrl = `/uploads/${fileName}`;
        // Duplicate check
        const existingSameHash = await database_1.prisma.document.findFirst({
            where: {
                contentHash,
                traineeId: { not: data.traineeId },
            },
            include: { trainee: true },
        });
        const doc = await database_1.prisma.document.create({
            data: {
                traineeId: data.traineeId,
                outcomeId: data.outcomeId || null,
                docType: data.docType,
                fileUrl,
                contentHash,
                uploadedBy: data.uploadedBy || 'trainee',
                verificationStatus: 'pending',
            },
        });
        if (existingSameHash) {
            await database_1.prisma.anomalyFlag.create({
                data: {
                    ruleCode: 'duplicate_document',
                    severity: 'medium',
                    status: 'open',
                    reason: `Document content hash matches an existing document uploaded by another trainee (${existingSameHash.trainee.skillOutcomeId})`,
                    entityType: 'document',
                    entityId: doc.id,
                    outcomeId: data.outcomeId || null,
                    evidence: JSON.stringify({
                        contentHash,
                        matchedDocId: existingSameHash.id,
                        matchedTraineeId: existingSameHash.traineeId,
                    }),
                },
            });
        }
        await audit_service_1.AuditService.log({
            entityType: 'Document',
            entityId: doc.id,
            action: 'DOCUMENT_UPLOADED',
            changes: { docType: data.docType, contentHash },
        });
        return doc;
    }
    static async listDocuments(filters) {
        return await database_1.prisma.document.findMany({
            where: {
                ...(filters.traineeId ? { traineeId: filters.traineeId } : {}),
                ...(filters.outcomeId ? { outcomeId: filters.outcomeId } : {}),
            },
            include: { trainee: true },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    static async verifyDocument(id, status, verifierName, notes) {
        const doc = await database_1.prisma.document.findUnique({
            where: { id },
            include: { outcome: { include: { anomalyFlags: true } }, trainee: { include: { documents: true } } },
        });
        if (!doc)
            throw new errors_1.NotFoundError('Document not found');
        const updatedDoc = await database_1.prisma.document.update({
            where: { id },
            data: {
                verificationStatus: status,
                verifiedBy: verifierName,
                verifiedAt: new Date(),
                notes,
            },
        });
        // Recalculate Outcome Trust Score if linked
        if (doc.outcomeId && doc.outcome) {
            const allDocs = await database_1.prisma.document.findMany({ where: { outcomeId: doc.outcomeId } });
            const { score, breakdown } = trustScore_service_1.TrustScoreService.calculateTrustScore(doc.outcome, allDocs, doc.outcome.anomalyFlags, []);
            await database_1.prisma.outcome.update({
                where: { id: doc.outcomeId },
                data: {
                    trustScore: score,
                    trustBreakdown: JSON.stringify(breakdown),
                },
            });
        }
        await audit_service_1.AuditService.log({
            entityType: 'Document',
            entityId: id,
            action: `DOCUMENT_${status.toUpperCase()}`,
            performedBy: verifierName,
            changes: { status, notes },
        });
        return updatedDoc;
    }
}
exports.DocumentsService = DocumentsService;
