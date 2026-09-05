const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function seed(shouldClosePool = true) {
  try {
    console.log('Starting seed...');
    const sqlPath = path.join(__dirname, 'seeds', '001_seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Seed completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
  } finally {
    if (shouldClosePool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed(true);
}

module.exports = seed;

