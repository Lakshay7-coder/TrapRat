import { prisma } from '../../config/database';
import { generateSkillOutcomeId, generateOtp } from '../../utils/idGenerator';
import { encryptField, decryptField, maskPhone } from '../../utils/crypto';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { notificationService } from '../../services/notification.service';
import { AuditService } from '../../services/audit.service';

export class TraineesService {
  static async createTrainee(data: {
    name: string;
    gender: string;
    dob?: string | Date;
    category?: string;
    disability?: boolean;
    ruralUrban?: string;
    phonePrimary: string;
    phoneSecondary?: string;
    email?: string;
    district: string;
    state: string;
    pincode?: string;
  }) {
    const skillOutcomeId = generateSkillOutcomeId();
    const encryptedPhone = encryptField(data.phonePrimary);
    const encryptedPhoneSec = data.phoneSecondary ? encryptField(data.phoneSecondary) : null;
    const encryptedEmail = data.email ? encryptField(data.email) : null;

    const trainee = await prisma.trainee.create({
      data: {
        skillOutcomeId,
        name: data.name,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : null,
        category: data.category,
        disability: data.disability ?? false,
        ruralUrban: data.ruralUrban || 'rural',
        phonePrimary: encryptedPhone,
        phoneSecondary: encryptedPhoneSec,
        email: encryptedEmail,
        district: data.district,
        state: data.state,
        pincode: data.pincode,
        consentStatus: 'granted',
        consentTimestamp: new Date(),
      },
    });

    // Default basic DPDP consents
    await prisma.consentRecord.createMany({
      data: [
        { traineeId: trainee.id, consentType: 'follow_up_contact', status: 'granted' },
        { traineeId: trainee.id, consentType: 'placement_tracking', status: 'granted' },
        { traineeId: trainee.id, consentType: 'analytics', status: 'granted' },
      ],
    });

    await AuditService.log({
      entityType: 'Trainee',
      entityId: trainee.id,
      action: 'TRAINEE_REGISTERED',
      changes: { skillOutcomeId, name: trainee.name, district: trainee.district },
    });

    return this.sanitizeTrainee(trainee);
  }

  static async listTrainees(filters: {
    providerId?: string;
    batchId?: string;
    district?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.district) where.district = filters.district;
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { skillOutcomeId: { contains: filters.search } },
      ];
    }
    if (filters.batchId || filters.providerId) {
      where.enrolments = {
        some: {
          ...(filters.batchId ? { batchId: filters.batchId } : {}),
          ...(filters.providerId ? { batch: { providerId: filters.providerId } } : {}),
        },
      };
    }

    const [total, trainees] = await Promise.all([
      prisma.trainee.count({ where }),
      prisma.trainee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          enrolments: {
            include: {
              batch: { include: { course: true, provider: true } },
              outcomes: true,
            },
          },
          outcomes: {
            include: {
              anomalyFlags: { where: { status: { in: ['open', 'under_review'] } } },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: trainees.map((t) => this.sanitizeTrainee(t)),
    };
  }

  static async getTraineeById(id: string) {
    const trainee = await prisma.trainee.findFirst({
      where: { OR: [{ id }, { skillOutcomeId: id }] },
      include: {
        enrolments: {
          include: {
            batch: { include: { course: true, provider: true } },
            outcomes: true,
          },
        },
        outcomes: {
          include: {
            employer: true,
            documents: true,
            followups: true,
            verificationAttempts: true,
            anomalyFlags: true,
          },
        },
        documents: true,
        followups: { orderBy: { scheduledDate: 'asc' } },
        consentRecords: { orderBy: { grantedAt: 'desc' } },
        identityLinks: true,
        incentives: true,
      },
    });

    if (!trainee) throw new NotFoundError('Trainee not found');
    return this.sanitizeTrainee(trainee);
  }

  static async updateTrainee(id: string, data: any) {
    const trainee = await prisma.trainee.findUnique({ where: { id } });
    if (!trainee) throw new NotFoundError('Trainee not found');

    const updateData: any = { ...data };
    if (data.phonePrimary) updateData.phonePrimary = encryptField(data.phonePrimary);
    if (data.phoneSecondary) updateData.phoneSecondary = encryptField(data.phoneSecondary);
    if (data.email) updateData.email = encryptField(data.email);

    const updated = await prisma.trainee.update({
      where: { id },
      data: updateData,
    });

    return this.sanitizeTrainee(updated);
  }

  /**
   * Public Record Claim flow with OTP verification
   */
  static async initiateClaimRecord(traineeId: string, phone: string) {
    const trainee = await prisma.trainee.findUnique({ where: { id: traineeId } });
    if (!trainee) throw new NotFoundError('Trainee record not found');

    const rawPhone = decryptField(trainee.phonePrimary);
    if (rawPhone && rawPhone.slice(-4) !== phone.slice(-4)) {
      throw new ValidationError('Phone number does not match registered records');
    }

    const otp = generateOtp();
    await notificationService.sendSms(
      phone,
      `Your Kaushal Sankalp record claim OTP is ${otp}. Valid for 10 minutes.`
    );

    return {
      success: true,
      message: `OTP sent to ${maskPhone(phone)}`,
      sessionRef: otp, // Mock for prototype verification
    };
  }

  static sanitizeTrainee(trainee: any) {
    const rawPhone = decryptField(trainee.phonePrimary);
    const rawEmail = trainee.email ? decryptField(trainee.email) : null;
    return {
      ...trainee,
      phonePrimary: rawPhone,
      phonePrimaryMasked: maskPhone(rawPhone),
      email: rawEmail,
    };
  }
}
