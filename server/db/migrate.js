const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate(shouldClosePool = true) {
  try {
    console.log('Starting migration...');
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();
    
    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const sqlPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
      }
    }
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate(true);
}

module.exports = migrate;

