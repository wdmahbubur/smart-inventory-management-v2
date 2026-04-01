require('dotenv').config();
const app        = require('./app');
const { pool }   = require('./config/db');

const PORT = parseInt(process.env.PORT) || 5000;

const start = async () => {
  try {
    // Verify database connection before accepting traffic
    await pool.query('SELECT 1');
    console.log('✅ PostgreSQL connected');

    app.listen(PORT, () => {
      console.log(`\n🚀 Server running on http://localhost:${PORT}`);
      console.log(`   ENV: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('   Check your DATABASE_URL in .env');
    process.exit(1);
  }
};

start();
