const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('pharmacist'));

// -------------------------------------------------------------
// 1. Pending Prescriptions Queue (With Clinical Verification Details)
// -------------------------------------------------------------
router.get('/pending-prescriptions', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT pm.*, 
              p.name AS patient_name, p.gender AS patient_gender, p.dob AS patient_dob, p.contact_no AS patient_contact,
              d.name AS doctor_name, d.specialization,
              m.stock_quantity AS current_stock, m.price_per_unit, m.expiry_date,
              COALESCE(pr.diagnosis, 'Clinical Consultation') AS diagnosis,
              COALESCE(pr.prescription_date, NOW()) AS prescription_date,
              COALESCE(pr.notes, pm.instructions, 'Take as instructed by physician') AS clinical_notes
       FROM prescribed_medicine pm
       JOIN patient p ON p.patient_id = pm.patient_id
       JOIN doctor d ON d.doctor_id = pm.doctor_id
       LEFT JOIN medicine m ON m.medicine_id = pm.medicine_id
       LEFT JOIN (
         SELECT patient_id, doctor_id, diagnosis, prescription_date, notes,
                ROW_NUMBER() OVER(PARTITION BY patient_id, doctor_id ORDER BY prescription_id DESC) as rn
         FROM prescription
       ) pr ON pr.patient_id = pm.patient_id AND pr.doctor_id = pm.doctor_id AND pr.rn = 1
       WHERE pm.Status = 'Pending'
       ORDER BY pm.prescribed_id DESC`
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Pending prescriptions error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch pending prescriptions' });
  }
});

// -------------------------------------------------------------
// 2. Dispense Medicine & Auto-Deduct Stock + Generate Invoice
// -------------------------------------------------------------
router.post('/dispense/:prescribedId', async (req, res) => {
  const prescribedId = Number(req.params.prescribedId);
  const { custom_quantity } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [presRows] = await conn.query(
      'SELECT * FROM prescribed_medicine WHERE prescribed_id = ? FOR UPDATE',
      [prescribedId]
    );

    if (presRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Prescription record not found' });
    }

    const pres = presRows[0];
    if (pres.Status === 'Dispensed') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Medicine has already been dispensed' });
    }

    const medIdToDispense = custom_medicine_id ? Number(custom_medicine_id) : pres.medicine_id;
    const [medRows] = await conn.query('SELECT * FROM medicine WHERE medicine_id = ? FOR UPDATE', [
      medIdToDispense,
    ]);

    if (medRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Medicine not found in inventory' });
    }

    const med = medRows[0];
    const nowTime = Date.now();
    const expTime = med.expiry_date ? new Date(med.expiry_date).getTime() : null;

    // Strict Clinical Check: Expired medicines CANNOT be dispensed
    if (expTime && expTime < nowTime) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Clinical Safety Violation: Cannot dispense expired drug! ${med.name} expired on ${new Date(med.expiry_date).toLocaleDateString()}. Disposal and fresh restock required.`,
      });
    }

    const qtyToDispense = custom_quantity ? Number(custom_quantity) : Number(pres.quantity);

    if (med.stock_quantity < qtyToDispense) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${med.name}! Required: ${qtyToDispense} units, but dispensary has only ${med.stock_quantity} available. Please submit a restock request.`,
      });
    }

    // Deduct stock
    await conn.query('UPDATE medicine SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?', [
      qtyToDispense,
      med.medicine_id,
    ]);

    // Record dispensed medicine
    await conn.query(
      `INSERT INTO dispensed_medicine 
        (prescribed_id, patient_id, medicine_id, medicine_name, dosage, duration, quantity, instructions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        pres.prescribed_id,
        pres.patient_id,
        med.medicine_id,
        med.name,
        pres.dosage,
        pres.duration,
        qtyToDispense,
        pres.instructions,
      ]
    );

    // Update prescription status
    await conn.query("UPDATE prescribed_medicine SET Status = 'Dispensed' WHERE prescribed_id = ?", [
      prescribedId,
    ]);

    // Create Invoice (Valid enum values: 'Pending', 'Paid', 'Cancelled')
    const [doctorRows] = await conn.query('SELECT fees FROM doctor WHERE doctor_id = ?', [pres.doctor_id]);
    const doctorFee = doctorRows.length > 0 ? Number(doctorRows[0].fees) : 0;
    const medicineCost = qtyToDispense * Number(med.price_per_unit || 0);

    await conn.query(
      `INSERT INTO bill 
        (patient_id, doctor_id, prescribed_id, total_medicine_cost, doctor_fee, payment_status, payment_mode)
       VALUES (?, ?, ?, ?, ?, 'Pending', 'Not Selected')`,
      [pres.patient_id, pres.doctor_id, pres.prescribed_id, medicineCost, doctorFee]
    );

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: `Medicine [${pres.medicine_name}] dispensed successfully! Invoice created.`,
      remaining_stock: med.stock_quantity - qtyToDispense,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Dispense error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to dispense medicine' });
  }
});

// -------------------------------------------------------------
// 3. Drug Inventory
// -------------------------------------------------------------
router.get('/inventory', async (req, res) => {
  try {
    const [medicines] = await pool.query(
      'SELECT medicine_id, name, type, price_per_unit, stock_quantity, reorder_level, expiry_date, description FROM medicine ORDER BY name ASC'
    );
    const nowTime = Date.now();
    const inventory = medicines.map((m) => {
      let status = 'OK';
      const expTime = m.expiry_date ? new Date(m.expiry_date).getTime() : null;
      if (expTime && expTime < nowTime) status = 'EXPIRED';
      else if (m.stock_quantity <= 20 || m.stock_quantity <= m.reorder_level) status = 'LOW_STOCK';
      return { ...m, status };
    });
    return res.json({ success: true, count: inventory.length, data: inventory });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
});

// -------------------------------------------------------------
// 4. Request Restock Reorder
// -------------------------------------------------------------
router.post('/reorder', async (req, res) => {
  const { medicine_id, requested_quantity } = req.body;
  try {
    const [medRows] = await pool.query('SELECT * FROM medicine WHERE medicine_id = ?', [medicine_id]);
    if (medRows.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found' });

    const med = medRows[0];
    const [insertRes] = await pool.query(
      `INSERT INTO reorder_request 
        (medicine_id, medicine_name, current_stock, reorder_level, requested_quantity, status)
       VALUES (?, ?, ?, ?, ?, 'Pending')`,
      [med.medicine_id, med.name, med.stock_quantity, med.reorder_level, requested_quantity]
    );

    return res.status(201).json({
      success: true,
      message: `Reorder request sent to Admin for ${med.name} (${requested_quantity} units)!`,
      request_id: insertRes.insertId,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create reorder request' });
  }
});

module.exports = router;
