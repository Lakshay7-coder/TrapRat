"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundQueue = exports.BackgroundQueue = void 0;
const logger_1 = require("../utils/logger");
class BackgroundQueue {
    handlers = new Map();
    jobs = [];
    isProcessing = false;
    constructor() {
        // Check queue every 10 seconds in dev mode
        setInterval(() => this.processQueue(), 10000);
    }
    registerHandler(jobName, handler) {
        this.handlers.set(jobName, handler);
    }
    async add(name, data, delayMs = 0) {
        const job = {
            id: `${name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name,
            data,
            runAt: new Date(Date.now() + delayMs),
        };
        this.jobs.push(job);
        logger_1.logger.debug(`[Queue] Added job ${job.name} (ID: ${job.id})`);
        return job.id;
    }
    async processQueue() {
        if (this.isProcessing || this.jobs.length === 0)
            return;
        this.isProcessing = true;
        const now = new Date();
        const readyJobs = this.jobs.filter((j) => j.runAt <= now);
        this.jobs = this.jobs.filter((j) => j.runAt > now);
        for (const job of readyJobs) {
            const handler = this.handlers.get(job.name);
            if (handler) {
                try {
                    logger_1.logger.info(`[Queue] Executing job ${job.name} (${job.id})`);
                    await handler(job.data);
                    logger_1.logger.info(`[Queue] Completed job ${job.name} (${job.id})`);
                }
                catch (err) {
                    logger_1.logger.error(`[Queue] Error running job ${job.name} (${job.id})`, err);
                }
            }
            else {
                logger_1.logger.warn(`[Queue] No handler registered for job ${job.name}`);
            }
        }
        this.isProcessing = false;
    }
}
exports.BackgroundQueue = BackgroundQueue;
exports.backgroundQueue = new BackgroundQueue();
