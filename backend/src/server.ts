import app from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info(' Connected to SQLite / PostgreSQL database via Prisma');

    const server = app.listen(env.PORT, () => {
      logger.info(` Kaushal Sankalp Backend running at http://localhost:${env.PORT}`);
      logger.info(` Health check at http://localhost:${env.PORT}/health`);
      logger.info(` Ready check at http://localhost:${env.PORT}/ready`);
    });

    const shutdown = async () => {
      logger.info('Gracefully shutting down server...');
      server.close(async () => {
        await prisma.$disconnect();
        logger.info('Database connection closed. Process exited.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
