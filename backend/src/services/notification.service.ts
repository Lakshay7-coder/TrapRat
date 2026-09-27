import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { maskPhone } from '../utils/crypto';

export interface NotificationProvider {
  sendSms(to: string, message: string): Promise<void>;
  sendWhatsApp(to: string, message: string, templateId?: string): Promise<void>;
  sendIvr(to: string, script: string): Promise<void>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export class MockNotificationService implements NotificationProvider {
  async sendSms(to: string, message: string, followupId?: string): Promise<void> {
    logger.info(`[SMS to ${maskPhone(to)}]: ${message}`);
    await this.persistLog('sms', to, { message }, followupId);
  }

  async sendWhatsApp(to: string, message: string, templateId?: string, followupId?: string): Promise<void> {
    logger.info(`[WhatsApp to ${maskPhone(to)} | Template: ${templateId || 'generic'}]: ${message}`);
    await this.persistLog('whatsapp', to, { message, templateId }, followupId);
  }

  async sendIvr(to: string, script: string, followupId?: string): Promise<void> {
    logger.info(`[IVR to ${maskPhone(to)}]: ${script}`);
    await this.persistLog('ivr', to, { script }, followupId);
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    logger.info(`[Email to ${to} | Subject: ${subject}]: ${body}`);
    await this.persistLog('email', to, { subject, body });
  }

  private async persistLog(channel: string, recipient: string, payload: any, followupId?: string) {
    try {
      await prisma.notificationLog.create({
        data: {
          channel,
          recipient: maskPhone(recipient),
          payload: JSON.stringify(payload),
          status: 'sent',
          followupId: followupId || null,
        },
      });
    } catch (err) {
      logger.error('Failed to persist notification log', err);
    }
  }

  /**
   * WhatsApp Bot State Machine simulator for follow-ups
   */
  async processWhatsAppResponse(traineeId: string, followupId: string, replyText: string) {
    const text = replyText.trim().toLowerCase();
    
    // Multi-step conversational logic
    if (text === 'yes' || text === 'हाँ' || text === 'employed') {
      return {
        nextPrompt: 'Great! What is your current employment type? [1. Full-time | 2. Part-time | 3. Gig / Contract]',
        status: 'in_progress',
        data: { isEmployed: true },
      };
    } else if (text === '1' || text === 'full-time' || text === 'full_time') {
      return {
        nextPrompt: 'What is your monthly wage band? [<10k, 10-15k, 15-20k, 20-25k, 25k+]',
        status: 'in_progress',
        data: { employmentType: 'full_time' },
      };
    } else if (text.includes('k') || text.includes('15') || text.includes('20')) {
      return {
        nextPrompt: 'Are you using the skills taught during your training? [Yes | Partly | No]',
        status: 'in_progress',
        data: { wageBand: text },
      };
    } else if (text === 'no' || text === 'नहीं' || text === 'unemployed') {
      return {
        nextPrompt: 'We are sorry to hear that. What is the primary reason? [1. Better opportunity | 2. Low salary | 3. Skill mismatch | 4. Relocation | 5. Other]',
        status: 'in_progress',
        data: { isEmployed: false },
      };
    } else {
      return {
        nextPrompt: 'Thank you! Your response has been securely recorded and verified.',
        status: 'completed',
        data: { completed: true, rawResponse: replyText },
      };
    }
  }
}

export const notificationService = new MockNotificationService();
