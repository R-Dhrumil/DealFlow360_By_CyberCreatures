const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '../../');
const appEnv = process.env.APP_ENV || process.env.NODE_ENV;

let envPath = path.join(rootDir, '.env');
if (appEnv === 'live' || appEnv === 'production') {
  const livePath = path.join(rootDir, '.env.live');
  if (fs.existsSync(livePath)) envPath = livePath;
} else if (appEnv === 'local' || appEnv === 'development') {
  const localPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(localPath)) envPath = localPath;
} else {
  // Default check
  const localPath = path.join(rootDir, '.env.local');
  if (fs.existsSync(localPath)) envPath = localPath;
}

dotenv.config({ path: envPath });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5001,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://apple@localhost:5432/postgres',
  dbSsl: process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_jwt_key_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

module.exports = Object.freeze(config);
