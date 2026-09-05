import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Universal Database Connection Configuration
 * Adapts to ANY PostgreSQL URL: Supabase, Neon, Railway, Render, Aiven, Docker, Localhost
 */
const getPoolConfig = () => {
  const connectionString = env.DATABASE_URL;

  let isCloud = false;
  try {
    const url = new URL(connectionString);
    const hostname = url.hostname.toLowerCase();
    isCloud = !['localhost', '127.0.0.1', 'host.docker.internal'].includes(hostname);
  } catch (e) {
    // If URL parsing fails, check substring indicators
    isCloud = !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');
  }

  // Determine SSL configuration
  let ssl = false;
  if (env.DB_SSL === 'true') {
    ssl = { rejectUnauthorized: false };
  } else if (env.DB_SSL === 'false') {
    ssl = false;
  } else if (isCloud || connectionString.includes('sslmode=require') || connectionString.includes('supabase') || connectionString.includes('neon.tech') || connectionString.includes('railway')) {
    ssl = { rejectUnauthorized: false };
  }

  return {
    connectionString,
    ssl,
    max: 20, // Max concurrent clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
};

export const pool = new Pool(getPoolConfig());

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client pool', err);
});

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL Query text
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (env.NODE_ENV === 'development' && duration > 500) {
      logger.warn(`Slow query executed in ${duration}ms: ${text.slice(0, 100)}...`);
    }
    return res;
  } catch (error) {
    logger.error(`Database Query Error: ${error.message}`, { query: text, params });
    throw error;
  }
};

/**
 * Execute a transaction block safely with automatic rollback on error
 * @param {Function} callback - async (client) => { ... }
 */
export const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Automatically initialize database tables and extensions from schema.sql
 */
export const initDB = async () => {
  try {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schemaSql);
      logger.success('PostgreSQL Schema & Tables verified/initialized successfully');
    }
  } catch (error) {
    logger.error('Failed to initialize database schema:', error.message);
    throw error;
  }
};

/**
 * Test DB Connection and Initialize Schema on Startup
 */
export const connectDB = async () => {
  try {
    const res = await pool.query('SELECT NOW() as connected_at, current_database() as db_name, version() as version');
    const { connected_at, db_name } = res.rows[0];
    logger.success(`PostgreSQL Database Connected: '${db_name}' at ${connected_at.toISOString()}`);
    
    // Auto-run schema initialization
    await initDB();
  } catch (error) {
    logger.error('❌ PostgreSQL Connection Failed:', error.message);
    console.log('\n💡 Database Connection Troubleshooting:');
    console.log('  1. Check if your DATABASE_URL in .env is correct.');
    console.log('  2. If using Supabase / Neon / Cloud DB, ensure SSL is permitted or set DB_SSL=true in .env');
    console.log('  3. If hosting locally, make sure PostgreSQL is running on port 5432.\n');
    process.exit(1);
  }
};
