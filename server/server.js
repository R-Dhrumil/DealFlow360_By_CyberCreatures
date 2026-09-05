const app = require('./src/app');
const config = require('./src/config/environment');
const { pool } = require('./src/config/db');
const logger = require('./src/utils/logger');
const os = require('os');

const PORT = config.port;
const HOST = '0.0.0.0';

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4 and not internal (127.0.0.1)
      if ((net.family === 'IPv4' || net.family === 4) && !net.internal) {
        addresses.push(net.address);
      }
    }
  }
  return addresses;
}

const server = app.listen(PORT, HOST, () => {
  logger.info(`DealFlow360 Server running locally at http://localhost:${PORT}`);
  
  const localIps = getLocalIpAddresses();
  if (localIps.length > 0) {
    logger.info(`Network/Wi-Fi access enabled for teammates:`);
    localIps.forEach(ip => {
      logger.info(`  ➜ API URL: http://${ip}:${PORT}/api`);
    });
  }
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
