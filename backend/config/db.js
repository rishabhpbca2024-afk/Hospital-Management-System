const mysql = require('mysql2/promise');
require('dotenv').config();

// Create MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Rishabh@2218',
  database: process.env.DB_NAME || 'hospital_management_system',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
});

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ [MySQL Database] Connected successfully to ${process.env.DB_NAME || 'hospital_management_system'}`);
    conn.release();
  } catch (err) {
    console.error('❌ [MySQL Database] Connection Error:', err.message);
  }
})();

module.exports = pool;
