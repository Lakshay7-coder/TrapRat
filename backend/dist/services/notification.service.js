"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.MockNotificationService = void 0;
const database_1 = require("../config/database");
const logger_1 = require("../utils/logger");
const crypto_1 = require("../utils/crypto");
class MockNotificationService {
    async sendSms(to, message, followupId) {
        logger_1.logger.info(`[SMS to ${(0, crypto_1.maskPhone)(to)}]: ${message}`);
        await this.persistLog('sms', to, { message }, followupId);
    }
    async sendWhatsApp(to, message, templateId, followupId) {
        logger_1.logger.info(`[WhatsApp to ${(0, crypto_1.maskPhone)(to)} | Template: ${templateId || 'generic'}]: ${message}`);
        await this.persistLog('whatsapp', to, { message, templateId }, followupId);
    }
    async sendIvr(to, script, followupId) {
        logger_1.logger.info(`[IVR to ${(0, crypto_1.maskPhone)(to)}]: ${script}`);
        await this.persistLog('ivr', to, { script }, followupId);
    }
    async sendEmail(to, subject, body) {
        logger_1.logger.info(`[Email to ${to} | Subject: ${subject}]: ${body}`);
        await this.persistLog('email', to, { subject, body });
    }
    async persistLog(channel, recipient, payload, followupId) {
        try {
            await database_1.prisma.notificationLog.create({
                data: {
                    channel,
                    recipient: (0, crypto_1.maskPhone)(recipient),
                    payload: JSON.stringify(payload),
                    status: 'sent',
                    followupId: followupId || null,
                },
            });
        }
        catch (err) {
            logger_1.logger.error('Failed to persist notification log', err);
        }
    }
    /**
     * WhatsApp Bot State Machine simulator for follow-ups
     */
    async processWhatsAppResponse(traineeId, followupId, replyText) {
        const text = replyText.trim().toLowerCase();
        // Multi-step conversational logic
        if (text === 'yes' || text === 'हाँ' || text === 'employed') {
            return {
                nextPrompt: 'Great! What is your current employment type? [1. Full-time | 2. Part-time | 3. Gig / Contract]',
                status: 'in_progress',
                data: { isEmployed: true },
            };
        }
        else if (text === '1' || text === 'full-time' || text === 'full_time') {
            return {
                nextPrompt: 'What is your monthly wage band? [<10k, 10-15k, 15-20k, 20-25k, 25k+]',
                status: 'in_progress',
                data: { employmentType: 'full_time' },
            };
        }
        else if (text.includes('k') || text.includes('15') || text.includes('20')) {
            return {
                nextPrompt: 'Are you using the skills taught during your training? [Yes | Partly | No]',
                status: 'in_progress',
                data: { wageBand: text },
            };
        }
        else if (text === 'no' || text === 'नहीं' || text === 'unemployed') {
            return {
                nextPrompt: 'We are sorry to hear that. What is the primary reason? [1. Better opportunity | 2. Low salary | 3. Skill mismatch | 4. Relocation | 5. Other]',
                status: 'in_progress',
                data: { isEmployed: false },
            };
        }
        else {
            return {
                nextPrompt: 'Thank you! Your response has been securely recorded and verified.',
                status: 'completed',
                data: { completed: true, rawResponse: replyText },
            };
        }
    }
}
exports.MockNotificationService = MockNotificationService;
exports.notificationService = new MockNotificationService();
