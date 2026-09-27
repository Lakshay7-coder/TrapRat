"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncentivesService = void 0;
const database_1 = require("../../config/database");
class IncentivesService {
    static async awardIncentive(traineeId, kind, reason) {
        return await database_1.prisma.incentiveLedger.create({
            data: {
                traineeId,
                kind,
                reason,
                status: 'earned',
            },
        });
    }
    static async listTraineeIncentives(traineeId) {
        return await database_1.prisma.incentiveLedger.findMany({
            where: { traineeId },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async redeemIncentive(id) {
        return await database_1.prisma.incentiveLedger.update({
            where: { id },
            data: { status: 'redeemed' },
        });
    }
}
exports.IncentivesService = IncentivesService;
