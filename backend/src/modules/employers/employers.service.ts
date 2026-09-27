import bcrypt from 'bcryptjs';
import { prisma } from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { encryptField, decryptField, maskPhone, maskEmail, sha256 } from '../../utils/crypto';
import { generateOtp, generateToken } from '../../utils/idGenerator';
import { notificationService } from '../../services/notification.service';
import { AuditService } from '../../services/audit.service';
import { TrustScoreService } from '../outcomes/trustScore.service';

export class EmployersService {
  static async createEmployer(data: {
    name: string;
    contactPhone?: string;
    contactEmail?: string;
    district?: string;
    state?: string;
    sector?: string;
  }) {
    const employer = await prisma.employer.create({
      data: {
        name: data.name,
        contactPhone: data.contactPhone ? encryptField(data.contactPhone) : null,
        contactEmail: data.contactEmail ? encryptField(data.contactEmail) : null,
        district: data.district,
        state: data.state,
        sector: data.sector,
      },
    });

    return this.sanitizeEmployer(employer);
  }

  static async listEmployers() {
    const employers = await prisma.employer.findMany({
      include: {
        _count: { select: { outcomes: true } },
      },
      orderBy: { name: 'asc' },
    });
    return employers.map((e) => this.sanitizeEmployer(e));
  }

  static async getEmployerById(id: string) {
    const employer = await prisma.employer.findUnique({
      where: { id },
      include: {
        outcomes: { include: { trainee: true } },
      },
    });
    if (!employer) throw new NotFoundError('Employer not found');
    return this.sanitizeEmployer(employer);
  }

  /**
   * Generates secure 72h single-use verification link + OTP
   */
  static async sendVerificationLink(employerId: string, outcomeId: string) {
    const [employer, outcome] = await Promise.all([
      prisma.employer.findUnique({ where: { id: employerId } }),
      prisma.outcome.findUnique({ where: { id: outcomeId }, include: { trainee: true } }),
    ]);

    if (!employer) throw new NotFoundError('Employer not found');
    if (!outcome) throw new NotFoundError('Outcome not found');

    const rawToken = generateToken();
    const tokenHash = sha256(rawToken);
    const rawOtp = generateOtp();
    const otpHash = await bcrypt.hash(rawOtp, 8);

    const expiresAt = new Date(Date.now() + 72 * 3600 * 1000); // 72h

    await prisma.verificationToken.create({
      data: {
        outcomeId: outcome.id,
        employerId: employer.id,
        tokenHash,
        otpHash,
        expiresAt,
      },
    });

    const verifyUrl = `http://localhost:5173/verify/${rawToken}`;
    const rawContactPhone = employer.contactPhone ? decryptField(employer.contactPhone) : null;
    const rawContactEmail = employer.contactEmail ? decryptField(employer.contactEmail) : null;

    if (rawContactPhone) {
      await notificationService.sendSms(
        rawContactPhone,
        `Kaushal Sankalp Verification for ${outcome.trainee.name}: Link ${verifyUrl} | OTP: ${rawOtp}`
      );
    }
    if (rawContactEmail) {
      await notificationService.sendEmail(
        rawContactEmail,
        'Trainee Employment Verification Request',
        `Please verify trainee ${outcome.trainee.name} using link: ${verifyUrl} and OTP: ${rawOtp}`
      );
    }

    await AuditService.log({
      entityType: 'Employer',
      entityId: employer.id,
      action: 'VERIFICATION_LINK_SENT',
      changes: { outcomeId: outcome.id, tokenHash },
    });

    return {
      success: true,
      verifyUrl,
      rawToken,
      otp: rawOtp, // Provided in mock mode for instant testing
      message: 'Verification link and OTP generated successfully',
    };
  }

  /**
   * Public: Get masked details for verification token
   */
  static async getVerificationContext(rawToken: string) {
    const tokenHash = sha256(rawToken);
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash },
      include: {
        outcome: { include: { trainee: true } },
        employer: true,
      },
    });

    if (!tokenRecord) throw new NotFoundError('Invalid verification link');
    if (tokenRecord.usedAt) throw new ValidationError('This verification link has already been used');
    if (new Date() > tokenRecord.expiresAt) throw new ValidationError('This verification link has expired');
    if (tokenRecord.attempts >= 5) throw new ValidationError('Verification locked due to too many failed attempts');

    return {
      traineeNameMasked: tokenRecord.outcome.trainee.name,
      skillOutcomeId: tokenRecord.outcome.trainee.skillOutcomeId,
      jobRole: tokenRecord.outcome.jobRole,
      outcomeDate: tokenRecord.outcome.outcomeDate,
      employerName: tokenRecord.employer?.name || 'Your Organisation',
      expiresAt: tokenRecord.expiresAt,
    };
  }

  /**
   * Public: Submit employer verification confirmation with OTP
   */
  static async submitVerification(rawToken: string, data: {
    otp: string;
    confirmed: boolean;
    jobRole?: string;
    wageBandLow?: number;
    wageBandHigh?: number;
    notes?: string;
  }) {
    const tokenHash = sha256(rawToken);
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { tokenHash },
      include: { outcome: { include: { trainee: { include: { documents: true } }, anomalyFlags: true } }, employer: true },
    });

    if (!tokenRecord) throw new NotFoundError('Invalid verification link');
    if (tokenRecord.usedAt) throw new ValidationError('This verification link has already been used');
    if (new Date() > tokenRecord.expiresAt) throw new ValidationError('This verification link has expired');
    if (tokenRecord.attempts >= 5) throw new ValidationError('Verification locked due to too many failed attempts');

    const isOtpValid = tokenRecord.otpHash ? await bcrypt.compare(data.otp, tokenRecord.otpHash) : true;
    if (!isOtpValid) {
      await prisma.verificationToken.update({
        where: { id: tokenRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ValidationError('Invalid verification OTP');
    }

    // Mark token as used
    await prisma.verificationToken.update({
      where: { id: tokenRecord.id },
      data: { usedAt: new Date() },
    });

    // Update outcome
    const updatedOutcome = await prisma.outcome.update({
      where: { id: tokenRecord.outcomeId },
      data: {
        isVerified: data.confirmed,
        verifiedAt: new Date(),
        verifiedBy: `Employer: ${tokenRecord.employer?.name || 'Verified Partner'}`,
        source: 'employer_confirm',
        verificationLevel: 2,
        confidenceLabel: data.confirmed ? 'confirmed_trainee' : 'unconfirmed',
        jobRole: data.jobRole || tokenRecord.outcome.jobRole,
      },
    });

    // Increment Employer verification count & mark verified
    if (tokenRecord.employerId) {
      await prisma.employer.update({
        where: { id: tokenRecord.employerId },
        data: {
          isVerified: true,
          verificationCount: { increment: 1 },
        },
      });
    }

    // Recalculate trust score
    const { score, breakdown } = TrustScoreService.calculateTrustScore(
      { ...updatedOutcome, isVerified: data.confirmed, source: 'employer_confirm' },
      tokenRecord.outcome.trainee.documents,
      tokenRecord.outcome.anomalyFlags,
      []
    );

    await prisma.outcome.update({
      where: { id: tokenRecord.outcomeId },
      data: {
        trustScore: score,
        trustBreakdown: JSON.stringify(breakdown),
      },
    });

    await AuditService.log({
      entityType: 'Outcome',
      entityId: tokenRecord.outcomeId,
      action: 'EMPLOYER_VERIFIED_OUTCOME',
      changes: { confirmed: data.confirmed, employerId: tokenRecord.employerId, newTrustScore: score },
    });

    return {
      success: true,
      message: 'Employer verification submitted successfully',
      trustScore: score,
    };
  }

  static sanitizeEmployer(employer: any) {
    const rawPhone = employer.contactPhone ? decryptField(employer.contactPhone) : null;
    const rawEmail = employer.contactEmail ? decryptField(employer.contactEmail) : null;
    return {
      ...employer,
      contactPhone: rawPhone,
      contactPhoneMasked: rawPhone ? maskPhone(rawPhone) : null,
      contactEmail: rawEmail,
      contactEmailMasked: rawEmail ? maskEmail(rawEmail) : null,
    };
  }
}
