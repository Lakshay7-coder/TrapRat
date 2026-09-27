import { prisma } from '../../config/database';

export class IncentivesService {
  static async awardIncentive(traineeId: string, kind: string, reason: string) {
    return await prisma.incentiveLedger.create({
      data: {
        traineeId,
        kind,
        reason,
        status: 'earned',
      },
    });
  }

  static async listTraineeIncentives(traineeId: string) {
    return await prisma.incentiveLedger.findMany({
      where: { traineeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async redeemIncentive(id: string) {
    return await prisma.incentiveLedger.update({
      where: { id },
      data: { status: 'redeemed' },
    });
  }
}
