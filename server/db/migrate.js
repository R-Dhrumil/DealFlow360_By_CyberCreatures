const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function migrate() {
  try {
    console.log('Starting migration...');
    const sqlPath = path.join(__dirname, 'migrations', '001_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
