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
      ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', rejectUnauthorized: false },
    };
  }

  // Individual environment variables (supporting multiple standard naming styles)
  const host = process.env.DB_HOST || process.env.HOST || 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : (process.env.PORT_DB ? Number(process.env.PORT_DB) : 3306);
  const user = process.env.DB_USER || process.env.USER_NAME || process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : (process.env.PASSWORD || '');
  const database = process.env.DB_NAME || process.env.DATABASE || 'hospital_management_system';

  const sslEnv = (process.env.DB_SSL || '').trim().toLowerCase();
  const requiresSsl = sslEnv === 'true' || sslEnv === '1' || sslEnv === 'required' || sslEnv === 'yes' || host.includes('tidbcloud.com');

  return {
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: requiresSsl ? { minVersion: 'TLSv1.2', rejectUnauthorized: false } : undefined,
  };
}

// Create MySQL Connection Pool
const pool = mysql.createPool(getDbConfig());

// Test connection on startup
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log(`✅ [MySQL Database] Connected successfully to ${process.env.DB_NAME || process.env.DATABASE || 'database'}`);
    conn.release();
  } catch (err) {
    console.error('❌ [MySQL Database] Connection Error:', err.message);
  }
})();

module.exports = pool;
