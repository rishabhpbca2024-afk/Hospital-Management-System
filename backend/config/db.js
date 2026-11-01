const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Helper to determine DB connection configuration
function getDbConfig() {
  // If a full connection URI is provided (e.g., mysql://user:pass@host:port/dbname)
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
    };
  }

  // Otherwise use individual environment variables
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hospital_management_system',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  };
}

// Create MySQL Connection Pool
const pool = mysql.createPool(getDbConfig());

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ [MySQL Database] Connected successfully to ${process.env.DB_NAME || 'database'}`);
    conn.release();
  } catch (err) {
    console.error('❌ [MySQL Database] Connection Error:', err.message);
  }
})();

module.exports = pool;
