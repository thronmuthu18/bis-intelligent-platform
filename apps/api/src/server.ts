import 'dotenv/config';
import { app } from './app.js';
import { env } from './config/env.js';
import { log } from './config/logger.js';
import { disconnectDatabase } from './db/client.js';

// ─────────────────────────────────────────────────────────────────────────────
//  Server Entry Point
// ─────────────────────────────────────────────────────────────────────────────

const server = app.listen(env.PORT, () => {
  log.info(`🚀 BIS Intelligent Platform API started`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    url: `http://localhost:${env.PORT}`,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Graceful Shutdown
// ─────────────────────────────────────────────────────────────────────────────

async function gracefulShutdown(signal: string): Promise<void> {
  log.info(`Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    await disconnectDatabase();
    log.info('Server closed. Exiting.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled promise rejection', { reason });
});

process.on('uncaughtException', (err) => {
  log.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

export { server };
