require('dotenv').config({ path: require('path').join(__dirname, '../../..', '.env') });
const fs   = require('fs');
const path = require('path');
const { pool } = require('../config/db');

const run = async () => {
  const seedFile = path.join(__dirname, 'seeds', 'demo.sql');
  const sql = fs.readFileSync(seedFile, 'utf8');
  console.log('▶ Running demo seed...');
  await pool.query(sql);
  console.log('✅ Demo seed complete.');
  console.log('\nDemo credentials:');
  console.log('  Admin:   admin@demo.com   / demo1234');
  console.log('  Manager: manager@demo.com / demo1234');
  await pool.end();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
