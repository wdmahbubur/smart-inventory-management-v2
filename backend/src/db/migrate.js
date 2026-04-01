require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const run = async () => {
  const migrationDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`Found ${files.length} migration file(s)...\n`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
    console.log(`▶ Running: ${file}`);
    await pool.query(sql);
    console.log(`✅ Done:    ${file}\n`);
  }

  console.log('All migrations complete.');
  await pool.end();
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
