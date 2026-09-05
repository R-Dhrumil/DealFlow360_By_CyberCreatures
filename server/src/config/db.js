const { Pool } = require('pg');
const config = require('./environment');

const poolConfig = {
  connectionString: config.databaseUrl,
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

// Handle SSL mode for cloud PostgreSQL databases (like Supabase, Neon, AWS RDS)
if (config.dbSsl || config.databaseUrl.includes('supabase.co')) {
  poolConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Unexpected database client error:', err.message);
});

/**
 * Health check ping function to test DB connection
 */
async function pingDatabase() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW() as current_time, current_database() as database_name');
    return {
      connected: true,
      timestamp: res.rows[0].current_time,
      database: res.rows[0].database_name
    };
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  pingDatabase
};
