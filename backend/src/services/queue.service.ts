import { logger } from '../utils/logger';

type JobHandler = (data: any) => Promise<any>;

interface QueueJob {
  id: string;
  name: string;
  data: any;
  runAt: Date;
}

export class BackgroundQueue {
  private handlers = new Map<string, JobHandler>();
  private jobs: QueueJob[] = [];
  private isProcessing = false;

  constructor() {
    // Check queue every 10 seconds in dev mode
    setInterval(() => this.processQueue(), 10000);
  }

  registerHandler(jobName: string, handler: JobHandler) {
    this.handlers.set(jobName, handler);
  }

  async add(name: string, data: any, delayMs: number = 0) {
    const job: QueueJob = {
      id: `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      data,
      runAt: new Date(Date.now() + delayMs),
    };
    this.jobs.push(job);
    logger.debug(`[Queue] Added job ${job.name} (ID: ${job.id})`);
    return job.id;
  }

  private async processQueue() {
    if (this.isProcessing || this.jobs.length === 0) return;
    this.isProcessing = true;

    const now = new Date();
    const readyJobs = this.jobs.filter((j) => j.runAt <= now);
    this.jobs = this.jobs.filter((j) => j.runAt > now);

    for (const job of readyJobs) {
      const handler = this.handlers.get(job.name);
      if (handler) {
        try {
          logger.info(`[Queue] Executing job ${job.name} (${job.id})`);
          await handler(job.data);
          logger.info(`[Queue] Completed job ${job.name} (${job.id})`);
        } catch (err) {
          logger.error(`[Queue] Error running job ${job.name} (${job.id})`, err);
        }
      } else {
        logger.warn(`[Queue] No handler registered for job ${job.name}`);
      }
    }

    this.isProcessing = false;
  }
}

export const backgroundQueue = new BackgroundQueue();
