import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { NotFoundError } from '../../utils/errors';
import { sha256 } from '../../utils/crypto';
import { AuditService } from '../../services/audit.service';
import { TrustScoreService } from '../outcomes/trustScore.service';

export class DocumentsService {
  static async saveDocument(data: {
    traineeId: string;
    outcomeId?: string;
    docType: string;
    file: Express.Multer.File;
    uploadedBy?: string;
  }) {
    // Ensure upload dir exists
    const uploadPath = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const contentHash = sha256(data.file.buffer || fs.readFileSync(data.file.path));
    const fileName = `${Date.now()}-${data.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const destination = path.join(uploadPath, fileName);

    if (data.file.buffer) {
      fs.writeFileSync(destination, data.file.buffer);
    }

    const fileUrl = `/uploads/${fileName}`;

    // Duplicate check
    const existingSameHash = await prisma.document.findFirst({
      where: {
        contentHash,
        traineeId: { not: data.traineeId },
      },
      include: { trainee: true },
    });

    const doc = await prisma.document.create({
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
      await prisma.anomalyFlag.create({
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

    await AuditService.log({
      entityType: 'Document',
      entityId: doc.id,
      action: 'DOCUMENT_UPLOADED',
      changes: { docType: data.docType, contentHash },
    });

    return doc;
  }

  static async listDocuments(filters: { traineeId?: string; outcomeId?: string }) {
    return await prisma.document.findMany({
      where: {
        ...(filters.traineeId ? { traineeId: filters.traineeId } : {}),
        ...(filters.outcomeId ? { outcomeId: filters.outcomeId } : {}),
      },
      include: { trainee: true },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  static async verifyDocument(id: string, status: 'verified' | 'rejected', verifierName: string, notes?: string) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { outcome: { include: { anomalyFlags: true } }, trainee: { include: { documents: true } } },
    });
    if (!doc) throw new NotFoundError('Document not found');

    const updatedDoc = await prisma.document.update({
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
      const allDocs = await prisma.document.findMany({ where: { outcomeId: doc.outcomeId } });
      const { score, breakdown } = TrustScoreService.calculateTrustScore(
        doc.outcome,
        allDocs,
        doc.outcome.anomalyFlags,
        []
      );

      await prisma.outcome.update({
        where: { id: doc.outcomeId },
        data: {
          trustScore: score,
          trustBreakdown: JSON.stringify(breakdown),
        },
      });
    }

    await AuditService.log({
      entityType: 'Document',
      entityId: id,
      action: `DOCUMENT_${status.toUpperCase()}`,
      performedBy: verifierName,
      changes: { status, notes },
    });

    return updatedDoc;
  }
}
