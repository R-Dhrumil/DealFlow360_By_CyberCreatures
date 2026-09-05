import { initDB, pool } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';

const run = async () => {
  try {
    logger.info('Initializing PostgreSQL tables and schema from schema.sql...');
    await initDB();
    logger.success('✅ Database initialized successfully!');
    await pool.end();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Failed to initialize database:', error);
    await pool.end();
    process.exit(1);
  }
};

run();
