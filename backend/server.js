const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const pharmacyRoutes = require('./routes/pharmacy.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost or standard origins
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ONLINE',
    service: 'Node.js Express Hospital Management System',
    timestamp: new Date().toISOString(),
  });
});

// Helper Stats Endpoint for Doctor Prescription Medicines Dropdown
app.get('/api/stats/medicines', async (req, res) => {
  try {
    const [medicines] = await pool.query(
      'SELECT medicine_id, name, type, price_per_unit, stock_quantity FROM medicine ORDER BY name ASC'
    );
    res.json({ success: true, data: medicines });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicines' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🏥 Lifeline Hospital Management System [Node.js + Express]`);
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`📡 MySQL Database: ${process.env.DB_NAME || 'hospital_management_system'}`);
  console.log(`======================================================\n`);
});
