const mysql = require('mysql2/promise');
require('dotenv').config({ path: __dirname + '/../.env' });

async function initProcurementTable() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const query = `
    CREATE TABLE IF NOT EXISTS stock_procurement_history (
      procurement_id INT AUTO_INCREMENT PRIMARY KEY,
      medicine_id INT NOT NULL,
      medicine_name VARCHAR(100) NOT NULL,
      supplier_name VARCHAR(150) NOT NULL,
      batch_number VARCHAR(50),
      quantity INT NOT NULL,
      expiry_date DATE NOT NULL,
      previous_stock INT DEFAULT 0,
      disposed_expired_units INT DEFAULT 0,
      new_stock INT NOT NULL,
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      total_cost DECIMAL(10,2) DEFAULT 0.00,
      invoice_no VARCHAR(50),
      procured_by VARCHAR(100) DEFAULT 'Hospital Admin',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  await conn.execute(query);
  console.log('✅ stock_procurement_history table initialized successfully!');

  const [cols] = await conn.execute('DESCRIBE stock_procurement_history');
  console.log('Columns:', cols.map(c => c.Field));
  await conn.end();
}

initProcurementTable().catch((err) => {
  console.error('Failed to init table:', err);
  process.exit(1);
});
