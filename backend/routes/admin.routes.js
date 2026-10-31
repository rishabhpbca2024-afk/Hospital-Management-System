const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Protect all admin routes
router.use(verifyToken, requireRole('admin'));

// -------------------------------------------------------------
// 1. Doctors Management
// -------------------------------------------------------------
router.get('/doctors', async (req, res) => {
  try {
    const [doctors] = await pool.query(
      'SELECT doctor_id, name, specialization, contact_no, email, fees, fees AS fee FROM doctor ORDER BY doctor_id ASC'
    );
    return res.json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
});

router.post('/doctors', async (req, res) => {
  try {
    const { doctor_id, name, specialization, contact_no, email, password, fees, fee } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Doctor name required' });
    if (!/^[a-zA-Z\s.]+$/.test(name.trim())) {
      return res.status(400).json({ success: false, message: 'Doctor name must contain letters only' });
    }
    if (!contact_no || !/^[6-9]\d{9}$/.test(contact_no.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone starting with 6-9 required' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Valid email required' });
    }

    const docFee = fees !== undefined ? Number(fees) : fee !== undefined ? Number(fee) : 500;

    let docId = doctor_id;
    if (!docId) {
      const [maxDoc] = await pool.query('SELECT MAX(doctor_id) as maxId FROM doctor');
      docId = (maxDoc[0]?.maxId || 200) + 1;
    }

    const [exists] = await pool.query('SELECT doctor_id FROM doctor WHERE doctor_id = ? OR email = ?', [
      docId,
      email.trim(),
    ]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Doctor ID or Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'doctor123', salt);

    // must_change_password is set to 1 by default so doctor must change it on first login!
    await pool.query(
      'INSERT INTO doctor (doctor_id, name, specialization, contact_no, email, password, fees, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
      [docId, name.trim(), (specialization || 'General').trim(), contact_no.trim(), email.trim(), hashedPassword, docFee]
    );

    return res.status(201).json({ success: true, message: 'Doctor onboarded successfully!', doctor_id: docId });
  } catch (err) {
    console.error('Add doctor error:', err);
    return res.status(500).json({ success: false, message: 'Failed to onboard doctor' });
  }
});

router.delete('/doctors/:id', async (req, res) => {
  const docId = Number(req.params.id);
  try {
    const [doc] = await pool.query('SELECT doctor_id FROM doctor WHERE doctor_id = ?', [docId]);
    if (doc.length === 0) return res.status(404).json({ success: false, message: 'Doctor not found' });

    // Clean up relations to maintain DB integrity without foreign key violations
    await pool.query('DELETE FROM bill WHERE doctor_id = ?', [docId]);
    await pool.query('DELETE FROM prescribed_medicine WHERE doctor_id = ?', [docId]);
    await pool.query('DELETE FROM prescription WHERE doctor_id = ?', [docId]);
    await pool.query('DELETE FROM refer_patient WHERE from_doctor_id = ? OR to_doctor_id = ?', [docId, docId]);
    await pool.query('DELETE FROM appointment WHERE doctor_id = ?', [docId]);
    await pool.query('DELETE FROM doctor WHERE doctor_id = ?', [docId]);

    return res.json({ success: true, message: 'Doctor deleted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete doctor' });
  }
});

// -------------------------------------------------------------
// 2. Pharmacists Management
// -------------------------------------------------------------
router.get('/pharmacists', async (req, res) => {
  try {
    const [pharmacists] = await pool.query(
      'SELECT Pharmacist_id AS pharmacist_id, Pharmacist_id, Name AS name, Contact_no AS contact_no FROM pharmacist ORDER BY Pharmacist_id ASC'
    );
    return res.json({ success: true, count: pharmacists.length, data: pharmacists });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pharmacists' });
  }
});

router.post('/pharmacists', async (req, res) => {
  try {
    const { name, contact_no, password } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Pharmacist name required' });
    if (!/^[a-zA-Z\s.]+$/.test(name.trim())) {
      return res.status(400).json({ success: false, message: 'Pharmacist name must contain letters only' });
    }
    if (!contact_no || !/^[6-9]\d{9}$/.test(contact_no.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone starting with 6-9 required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'pharm123', salt);

    // must_change_password set to 1 so pharmacist must change password on first login
    const [insertRes] = await pool.query(
      'INSERT INTO pharmacist (Name, Contact_no, Password, must_change_password) VALUES (?, ?, ?, 1)',
      [name.trim(), contact_no.trim(), hashedPassword]
    );

    return res.status(201).json({ success: true, message: 'Pharmacist registered successfully!', id: insertRes.insertId });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to register pharmacist' });
  }
});

router.delete('/pharmacists/:id', async (req, res) => {
  const pharmId = Number(req.params.id);
  try {
    const [resDelete] = await pool.query('DELETE FROM pharmacist WHERE Pharmacist_id = ?', [pharmId]);
    if (resDelete.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pharmacist not found' });
    return res.json({ success: true, message: 'Pharmacist deleted successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete pharmacist' });
  }
});

// -------------------------------------------------------------
// 3. Patients Management
// -------------------------------------------------------------
router.get('/patients', async (req, res) => {
  try {
    const [patients] = await pool.query(
      'SELECT patient_id, name, gender, dob, contact_no, email, address FROM patient ORDER BY patient_id ASC'
    );
    return res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch patients' });
  }
});

router.delete('/patients/:id', async (req, res) => {
  return res.status(403).json({
    success: false,
    message: 'Patient records cannot be deleted as they are required for permanent medical history, billing audits, and regulatory compliance.',
  });
});

// -------------------------------------------------------------
// 4. Confidential Revenue & Financial Report (Admin Only)
// -------------------------------------------------------------
router.get('/revenue', async (req, res) => {
  try {
    const [rev] = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) AS total_revenue, 
        COUNT(*) AS total_paid_bills,
        COALESCE(SUM(doctor_fee), 0) AS total_consultation_fees,
        COALESCE(SUM(total_medicine_cost), 0) AS total_medicine_revenue
      FROM bill WHERE payment_status = 'Paid'`
    );

    const [recentBills] = await pool.query(
      `SELECT b.bill_id, p.name AS patient_name, d.name AS doctor_name, 
              b.total_medicine_cost, b.doctor_fee, b.total_amount, b.bill_date, b.payment_status, b.payment_mode
       FROM bill b
       LEFT JOIN patient p ON p.patient_id = b.patient_id
       LEFT JOIN doctor d ON d.doctor_id = b.doctor_id
       ORDER BY b.bill_date DESC LIMIT 15`
    );

    const totalRev = Number(rev[0]?.total_revenue || 0);
    const totalBills = Number(rev[0]?.total_paid_bills || 0);
    const totalConsult = Number(rev[0]?.total_consultation_fees || 0);
    const totalMed = Number(rev[0]?.total_medicine_revenue || 0);

    return res.json({
      success: true,
      data: {
        total: totalRev,
        total_revenue: totalRev,
        paid_bills: totalBills,
        total_paid_bills: totalBills,
        total_consultation_fees: totalConsult,
        total_medicine_revenue: totalMed,
        recent_transactions: recentBills,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch revenue report' });
  }
});

// -------------------------------------------------------------
// 5. System Stats Overview (Confidential Admin Only)
// -------------------------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [docCount] = await pool.query('SELECT COUNT(*) as count FROM doctor');
    const [patCount] = await pool.query('SELECT COUNT(*) as count FROM patient');
    const [pharmCount] = await pool.query('SELECT COUNT(*) as count FROM pharmacist');
    const [apptCount] = await pool.query(
      `SELECT 
        COUNT(*) as total, 
        SUM(CASE WHEN status LIKE '%Pending%' THEN 1 ELSE 0 END) as pending, 
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status LIKE '%Accept%' OR status LIKE '%Active%' THEN 1 ELSE 0 END) as accepted
      FROM appointment`
    );
    const [revenueData] = await pool.query(
      `SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue, 
        COUNT(*) as total_paid_bills,
        COALESCE(SUM(doctor_fee), 0) as total_consultation_fees,
        COALESCE(SUM(total_medicine_cost), 0) as total_medicine_revenue
      FROM bill 
      WHERE payment_status = 'Paid'`
    );
    const [medicines] = await pool.query('SELECT stock_quantity, reorder_level, expiry_date FROM medicine');
    const [pendingReorders] = await pool.query("SELECT COUNT(*) as count FROM reorder_request WHERE status = 'Pending'");

    const nowTime = Date.now();
    let lowStockCount = 0;
    let expiredCount = 0;
    medicines.forEach((m) => {
      const expTime = m.expiry_date ? new Date(m.expiry_date).getTime() : null;
      if (expTime && expTime < nowTime) expiredCount++;
      else if (m.stock_quantity <= 20 || m.stock_quantity <= m.reorder_level) lowStockCount++;
    });

    const totalRevenue = Number(revenueData[0]?.total_revenue || 0);
    const totalPaidBills = Number(revenueData[0]?.total_paid_bills || 0);
    const totalConsultFees = Number(revenueData[0]?.total_consultation_fees || 0);
    const totalMedRevenue = Number(revenueData[0]?.total_medicine_revenue || 0);

    return res.json({
      success: true,
      data: {
        total_doctors: Number(docCount[0]?.count || 0),
        total_patients: Number(patCount[0]?.count || 0),
        total_pharmacists: Number(pharmCount[0]?.count || 0),
        appointments: {
          total: Number(apptCount[0]?.total || 0),
          pending: Number(apptCount[0]?.pending || 0),
          completed: Number(apptCount[0]?.completed || 0),
          accepted: Number(apptCount[0]?.accepted || 0),
        },
        revenue: {
          total: totalRevenue,
          total_revenue: totalRevenue,
          paid_bills: totalPaidBills,
          total_paid_bills: totalPaidBills,
          total_consultation_fees: totalConsultFees,
          total_medicine_revenue: totalMedRevenue,
        },
        inventory: {
          total_medicines: medicines.length,
          low_stock: lowStockCount,
          expired: expiredCount,
          pending_reorders: Number(pendingReorders[0]?.count || 0),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch system stats' });
  }
});

// -------------------------------------------------------------
// 6. Stock Compliance & Reorder Management
// -------------------------------------------------------------
router.get('/stock-compliance', async (req, res) => {
  try {
    const nowTime = Date.now();
    const [medicines] = await pool.query(
      'SELECT medicine_id, name, type, price_per_unit, stock_quantity, reorder_level, expiry_date, description FROM medicine ORDER BY stock_quantity ASC'
    );
    const processed = medicines.map((m) => {
      let status = 'OK';
      const expTime = m.expiry_date ? new Date(m.expiry_date).getTime() : null;
      if (expTime && expTime < nowTime) status = 'EXPIRED';
      else if (m.stock_quantity <= 20 || m.stock_quantity <= m.reorder_level) status = 'LOW_STOCK';
      return { ...m, status };
    });

    const [pendingRequests] = await pool.query(
      "SELECT * FROM reorder_request WHERE status = 'Pending' ORDER BY request_date DESC"
    );

    return res.json({
      success: true,
      data: {
        medicines: processed,
        pending_requests: pendingRequests,
      },
      medicines: processed,
      pending_requests: pendingRequests,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stock compliance' });
  }
});

router.post('/reorder/:id/action', async (req, res) => {
  const reorderId = Number(req.params.id);
  const action = (req.body.action || '').toLowerCase();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [reqs] = await conn.query('SELECT * FROM reorder_request WHERE request_id = ?', [reorderId]);
    if (reqs.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Reorder request not found' });
    }

    const reorder = reqs[0];
    if (action === 'approve') {
      await conn.query(
        'UPDATE medicine SET stock_quantity = stock_quantity + ? WHERE medicine_id = ?',
        [reorder.requested_quantity, reorder.medicine_id]
      );
      await conn.query("UPDATE reorder_request SET status = 'Approved' WHERE request_id = ?", [reorderId]);
    } else {
      await conn.query("UPDATE reorder_request SET status = 'Rejected' WHERE request_id = ?", [reorderId]);
    }

    await conn.commit();
    conn.release();
    return res.json({ success: true, message: `Reorder #${reorderId} ${action}d successfully!` });
  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: 'Failed to handle reorder request' });
  }
});

// -------------------------------------------------------------
// 6b. Hospital Medicine Procurement from Vendor / Distributor
// -------------------------------------------------------------
router.post('/medicines/:id/procure', async (req, res) => {
  const medicineId = Number(req.params.id);
  const {
    quantity,
    supplier_name,
    batch_number,
    expiry_date,
    unit_price,
    invoice_no,
    dispose_expired = true,
  } = req.body;

  const qty = Number(quantity);
  if (!qty || qty <= 0 || isNaN(qty)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid positive quantity of units to procure' });
  }

  // Verify expiry date is valid and in the future
  let freshExpiry = expiry_date;
  if (!freshExpiry) {
    // Default to 2 years from today if not provided
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    freshExpiry = d.toISOString().split('T')[0];
  } else {
    const expTime = new Date(freshExpiry).getTime();
    if (isNaN(expTime)) {
      return res.status(400).json({ success: false, message: 'Invalid expiry date format' });
    }
    const todayTime = new Date().setHours(0, 0, 0, 0);
    if (expTime <= todayTime) {
      return res.status(400).json({ success: false, message: 'New consignment expiry date must be a valid future date!' });
    }
  }

  const supplier = (supplier_name && supplier_name.trim()) || 'Apex Healthcare Supplies';
  const batchNo = (batch_number && batch_number.trim()) || `BATCH-${Date.now().toString().slice(-6)}`;
  const price = Number(unit_price) >= 0 ? Number(unit_price) : 0;
  const invNo = (invoice_no && invoice_no.trim()) || `INV-${Date.now().toString().slice(-5)}`;
  const adminName = req.user?.name || req.user?.username || 'Hospital Administrator';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [meds] = await conn.query('SELECT * FROM medicine WHERE medicine_id = ? FOR UPDATE', [medicineId]);
    if (meds.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const med = meds[0];
    const nowTime = Date.now();
    const isPreviouslyExpired = med.expiry_date && new Date(med.expiry_date).getTime() < nowTime;

    let disposedUnits = 0;
    let newStock = 0;

    if (isPreviouslyExpired && dispose_expired) {
      // The previous stock was expired: write off/dispose expired units and replace with fresh batch
      disposedUnits = Number(med.stock_quantity);
      newStock = qty;
    } else {
      // Add incoming units to active stock
      newStock = Number(med.stock_quantity) + qty;
    }

    // Update medicine with fresh stock, new valid expiry date, and unit price if provided
    await conn.query(
      'UPDATE medicine SET stock_quantity = ?, expiry_date = ? WHERE medicine_id = ?',
      [newStock, freshExpiry, medicineId]
    );

    // Save procurement record into stock_procurement_history
    await conn.query(
      `INSERT INTO stock_procurement_history 
        (medicine_id, medicine_name, supplier_name, batch_number, quantity, expiry_date, previous_stock, disposed_expired_units, new_stock, unit_price, total_cost, invoice_no, procured_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineId,
        med.name,
        supplier,
        batchNo,
        qty,
        freshExpiry,
        med.stock_quantity,
        disposedUnits,
        newStock,
        price || Number(med.price_per_unit || 0),
        (price || Number(med.price_per_unit || 0)) * qty,
        invNo,
        adminName,
      ]
    );

    // If there were any pending reorder requests for this medicine, mark them Approved
    await conn.query(
      "UPDATE reorder_request SET status = 'Approved' WHERE medicine_id = ? AND status = 'Pending'",
      [medicineId]
    );

    await conn.commit();
    conn.release();

    const message = disposedUnits > 0
      ? `Fresh consignment received from ${supplier}! ${disposedUnits} expired units safely replaced with ${qty} fresh units (Expiry: ${new Date(freshExpiry).toLocaleDateString()}). New active stock: ${newStock} units.`
      : `Successfully procured ${qty} units of ${med.name} from ${supplier}! Fresh expiry: ${new Date(freshExpiry).toLocaleDateString()}. Total stock: ${newStock} units.`;

    return res.json({
      success: true,
      message,
      new_stock: newStock,
      expiry_date: freshExpiry,
      disposed_expired_units: disposedUnits,
      supplier_name: supplier,
      batch_number: batchNo,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Procurement error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record medicine procurement' });
  }
});

// Backward-compatible route for add-stock
router.post('/medicines/:id/add-stock', async (req, res) => {
  const medicineId = Number(req.params.id);
  const qty = Number(req.body.quantity);

  if (!qty || qty <= 0 || isNaN(qty)) {
    return res.status(400).json({ success: false, message: 'Please enter a valid positive quantity to add' });
  }

  // Generate 2 years future expiry if not given
  let freshExpiry = req.body.expiry_date;
  if (!freshExpiry) {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 2);
    freshExpiry = d.toISOString().split('T')[0];
  }

  const supplier = req.body.supplier_name || 'Sun Pharma Distributors';
  const batchNo = req.body.batch_number || `BATCH-${Date.now().toString().slice(-6)}`;
  const adminName = req.user?.name || req.user?.username || 'Hospital Administrator';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [meds] = await conn.query('SELECT * FROM medicine WHERE medicine_id = ? FOR UPDATE', [medicineId]);
    if (meds.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Medicine not found' });
    }

    const med = meds[0];
    const nowTime = Date.now();
    const isPreviouslyExpired = med.expiry_date && new Date(med.expiry_date).getTime() < nowTime;

    let disposedUnits = 0;
    let newStock = 0;

    if (isPreviouslyExpired) {
      disposedUnits = Number(med.stock_quantity);
      newStock = qty;
    } else {
      newStock = Number(med.stock_quantity) + qty;
    }

    await conn.query(
      'UPDATE medicine SET stock_quantity = ?, expiry_date = ? WHERE medicine_id = ?',
      [newStock, freshExpiry, medicineId]
    );

    await conn.query(
      `INSERT INTO stock_procurement_history 
        (medicine_id, medicine_name, supplier_name, batch_number, quantity, expiry_date, previous_stock, disposed_expired_units, new_stock, unit_price, total_cost, invoice_no, procured_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        medicineId,
        med.name,
        supplier,
        batchNo,
        qty,
        freshExpiry,
        med.stock_quantity,
        disposedUnits,
        newStock,
        Number(med.price_per_unit || 0),
        Number(med.price_per_unit || 0) * qty,
        `INV-${Date.now().toString().slice(-5)}`,
        adminName,
      ]
    );

    await conn.query(
      "UPDATE reorder_request SET status = 'Approved' WHERE medicine_id = ? AND status = 'Pending'",
      [medicineId]
    );

    await conn.commit();
    conn.release();

    const message = disposedUnits > 0
      ? `Fresh consignment received! ${disposedUnits} expired units safely replaced with ${qty} fresh units (New Expiry: ${new Date(freshExpiry).toLocaleDateString()}). Current stock: ${newStock} units.`
      : `Successfully added ${qty} units to ${med.name}! Current stock is now ${newStock} units (Expiry: ${new Date(freshExpiry).toLocaleDateString()}).`;

    return res.json({
      success: true,
      message,
      new_stock: newStock,
      expiry_date: freshExpiry,
      disposed_expired_units: disposedUnits,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Failed to add medicine stock:', err);
    return res.status(500).json({ success: false, message: 'Failed to add medicine stock' });
  }
});

// -------------------------------------------------------------
// 6c. Stock Procurement History Log
// -------------------------------------------------------------
router.get('/procurement-history', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM stock_procurement_history ORDER BY created_at DESC, procurement_id DESC LIMIT 100'
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Failed to fetch procurement history:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch procurement history' });
  }
});

// -------------------------------------------------------------
// 7. Feedback Administration
// -------------------------------------------------------------
router.get('/feedbacks', async (req, res) => {
  try {
    const [feedbacks] = await pool.query(
      'SELECT feedback_id, user_id, user_name, user_role, rating, category, message, created_at FROM feedback ORDER BY created_at DESC'
    );
    return res.json({ success: true, count: feedbacks.length, data: feedbacks });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user feedbacks' });
  }
});

router.delete('/feedbacks/:id', async (req, res) => {
  const fbId = Number(req.params.id);
  try {
    const [resDelete] = await pool.query('DELETE FROM feedback WHERE feedback_id = ?', [fbId]);
    if (resDelete.affectedRows === 0) return res.status(404).json({ success: false, message: 'Feedback not found' });
    return res.json({ success: true, message: 'Feedback removed successfully!' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete feedback' });
  }
});

module.exports = router;
