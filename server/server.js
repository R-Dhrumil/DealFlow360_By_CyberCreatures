const app = require('./src/app');
const config = require('./src/config/environment');
const { pool } = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`DealFlow360 Server running on port ${PORT} [${config.env}]`);
});

// Graceful Shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server...`);
  server.close(async () => {
    logger.info('HTTP server closed. Closing database pool...');
    await pool.end();
    logger.info('Database pool closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
