import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { prisma } from './config/database';

// Import Routes
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import traineesRoutes from './modules/trainees/trainees.routes';
import providersRoutes from './modules/providers/providers.routes';
import coursesRoutes from './modules/courses/courses.routes';
import batchesRoutes from './modules/batches/batches.routes';
import enrolmentsRoutes from './modules/enrolments/enrolments.routes';
import outcomesRoutes from './modules/outcomes/outcomes.routes';
import employersRoutes from './modules/employers/employers.routes';
import followupsRoutes from './modules/followups/followups.routes';
import documentsRoutes from './modules/documents/documents.routes';
import consentRoutes from './modules/consent/consent.routes';
import anomaliesRoutes from './modules/anomalies/anomalies.routes';
import identityRoutes from './modules/identity/identity.routes';
import reasonsRoutes from './modules/reasons/reasons.routes';
import incentivesRoutes from './modules/incentives/incentives.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import auditRoutes from './modules/audit/audit.routes';
import devRoutes from './modules/dev/dev.routes';
import { AnalyticsController } from './modules/analytics/analytics.controller';

const app = express();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads serving
app.use('/uploads', express.static(path.resolve(env.UPLOAD_DIR)));

// Health Checks
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Kaushal Sankalp Backend API',
  });
});

app.get('/ready', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready', database: 'connected' });
  } catch (err: any) {
    res.status(503).json({ status: 'not_ready', error: err.message });
  }
});

// API Routes Mounting
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trainees', traineesRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/batches', batchesRoutes);
app.use('/api/enrolments', enrolmentsRoutes);
app.use('/api/outcomes', outcomesRoutes);
app.use('/api/employers', employersRoutes);
app.use('/api/public', employersRoutes); // For /api/public/verify/:token
app.use('/api/followups', followupsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/anomalies', anomaliesRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/reasons', reasonsRoutes);
app.use('/api/incentives', incentivesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dev', devRoutes);

// Frontend Route Compatibility Aliases
app.use('/api/admin/anomalies', anomaliesRoutes);
app.get('/api/admin/dashboard', AnalyticsController.getSummary);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found' },
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
