const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('patient'));

// -------------------------------------------------------------
// 1. Discover Doctors
// -------------------------------------------------------------
router.get('/doctors', async (req, res) => {
  try {
    const { query, specialization } = req.query;
    let sql = 'SELECT doctor_id, name, specialization, contact_no, email, fees, fees AS fee FROM doctor WHERE 1=1';
    const params = [];

    if (specialization) {
      sql += ' AND specialization LIKE ?';
      params.push(`%${specialization}%`);
    }
    if (query) {
      sql += ' AND (name LIKE ? OR specialization LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    sql += ' ORDER BY name ASC';

    const [doctors] = await pool.query(sql, params);
    return res.json({ success: true, count: doctors.length, data: doctors });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to search doctors' });
  }
});

// -------------------------------------------------------------
// 2. Book Appointment
// -------------------------------------------------------------
router.post('/appointments', async (req, res) => {
  const patientId = req.user.id;
  const { doctor_id, appointment_date, diagnosis } = req.body;

  if (!doctor_id || !appointment_date || !diagnosis) {
    return res.status(400).json({ success: false, message: 'Doctor ID, Appointment Date, and Diagnosis are required' });
  }

  const apptDate = new Date(appointment_date);
  if (isNaN(apptDate.getTime())) {
    return res.status(400).json({ success: false, message: 'Invalid appointment date format' });
  }

  const now = new Date();
  // Ensure appointment date/time is not in the past (allow a 5-minute buffer for form fill time)
  if (apptDate.getTime() < now.getTime() - 5 * 60 * 1000) {
    return res.status(400).json({
      success: false,
      message: 'Invalid Appointment Date: You cannot book an appointment for a past date or time. Please select today or an upcoming date.',
    });
  }

  if (!diagnosis.trim() || diagnosis.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid symptoms or reason for visit (minimum 3 characters).',
    });
  }

  try {
    const [doc] = await pool.query('SELECT doctor_id FROM doctor WHERE doctor_id = ?', [doctor_id]);
    if (doc.length === 0) return res.status(404).json({ success: false, message: 'Selected doctor does not exist' });

    const [duplicate] = await pool.query(
      'SELECT appointment_id FROM appointment WHERE patient_id = ? AND doctor_id = ? AND appointment_date = ?',
      [patientId, doctor_id, appointment_date]
    );
    if (duplicate.length > 0) {
      return res.status(409).json({ success: false, message: 'You already have an appointment with this doctor on this date!' });
    }

    const [insertRes] = await pool.query(
      'INSERT INTO appointment (patient_id, doctor_id, appointment_date, diagnosis, status) VALUES (?, ?, ?, ?, ?)',
      [patientId, doctor_id, appointment_date, diagnosis, 'Pending..']
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment_id: insertRes.insertId,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to book appointment' });
  }
});

// -------------------------------------------------------------
// 3. My Appointments
// -------------------------------------------------------------
router.get('/my-appointments', async (req, res) => {
  const patientId = req.user.id;
  try {
    const [appointments] = await pool.query(
      `SELECT a.appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.status, a.diagnosis,
              d.name AS doctor_name, d.specialization, d.contact_no AS doctor_contact, d.fees, d.fees AS fee
       FROM appointment a
       LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
       WHERE a.patient_id = ?
       ORDER BY a.appointment_date DESC, a.appointment_id DESC`,
      [patientId]
    );
    return res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
});

// -------------------------------------------------------------
// 4. My Prescriptions
// -------------------------------------------------------------
router.get('/my-prescriptions', async (req, res) => {
  const patientId = req.user.id;
  try {
    const [prescriptions] = await pool.query(
      `SELECT p.*, d.name AS doctor_name, d.specialization
       FROM prescription p
       LEFT JOIN doctor d ON d.doctor_id = p.doctor_id
       WHERE p.patient_id = ? ORDER BY p.prescription_date DESC`,
      [patientId]
    );

    const [dispensed] = await pool.query(
      `SELECT dm.*, d.name AS doctor_name
       FROM dispensed_medicine dm
       LEFT JOIN prescribed_medicine pm ON pm.prescribed_id = dm.prescribed_id
       LEFT JOIN doctor d ON d.doctor_id = pm.doctor_id
       WHERE dm.patient_id = ? ORDER BY dm.dispense_date DESC`,
      [patientId]
    );

    return res.json({ success: true, data: { prescriptions, dispensed_medicines: dispensed } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
});

// -------------------------------------------------------------
// 5. My Referrals
// -------------------------------------------------------------
router.get('/my-referrals', async (req, res) => {
  const patientId = req.user.id;
  try {
    const [referrals] = await pool.query(
      `SELECT rp.refer_id, rp.reason, rp.refer_date,
              fd.name AS from_doctor, fd.specialization AS from_specialization,
              td.name AS to_doctor, td.specialization AS to_specialization
       FROM refer_patient rp
       LEFT JOIN doctor fd ON fd.doctor_id = rp.from_doctor_id
       LEFT JOIN doctor td ON td.doctor_id = rp.to_doctor_id
       WHERE rp.patient_id = ? ORDER BY rp.refer_date DESC`,
      [patientId]
    );
    return res.json({ success: true, count: referrals.length, data: referrals });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch referrals' });
  }
});

// -------------------------------------------------------------
// 6. My Invoices & Bills (Enriched with Line-Item & Patient Details for Receipts)
// -------------------------------------------------------------
router.get('/my-bills', async (req, res) => {
  const patientId = req.user.id;
  try {
    const [bills] = await pool.query(
      `SELECT b.bill_id, b.patient_id, b.doctor_id, b.prescribed_id,
              b.total_medicine_cost, b.doctor_fee, b.total_amount,
              b.bill_date, b.payment_status, b.payment_mode,
              p.name AS patient_name, p.gender AS patient_gender, p.dob AS patient_dob, 
              p.contact_no AS patient_contact, p.email AS patient_email, p.address AS patient_address,
              d.name AS doctor_name, d.specialization AS doctor_specialization,
              COALESCE(pm.medicine_name, 'Prescribed Pharmacy Medications') AS medicine_name,
              COALESCE(pm.quantity, 1) AS medicine_quantity,
              pm.dosage, pm.duration
       FROM bill b
       JOIN patient p ON p.patient_id = b.patient_id
       LEFT JOIN doctor d ON d.doctor_id = b.doctor_id
       LEFT JOIN prescribed_medicine pm ON pm.prescribed_id = b.prescribed_id
       WHERE b.patient_id = ? ORDER BY b.bill_date DESC, b.bill_id DESC`,
      [patientId]
    );
    return res.json({ success: true, count: bills.length, data: bills });
  } catch (err) {
    console.error('Fetch bills error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch bills' });
  }
});

// -------------------------------------------------------------
// 7. Settle / Pay Bill
// -------------------------------------------------------------
router.post('/pay-bill/:billId', async (req, res) => {
  const patientId = req.user.id;
  const billId = Number(req.params.billId);
  const { payment_mode } = req.body;

  const resolvedMode = payment_mode || 'UPI';

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query('SELECT * FROM bill WHERE bill_id = ? AND patient_id = ?', [billId, patientId]);
    if (rows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Bill not found or does not belong to you' });
    }

    const bill = rows[0];
    if (bill.payment_status === 'Paid') {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'Bill is already paid' });
    }

    await conn.query("UPDATE bill SET payment_status = 'Paid', payment_mode = ? WHERE bill_id = ?", [
      resolvedMode,
      billId,
    ]);

    await conn.commit();
    conn.release();

    return res.json({
      success: true,
      message: `Payment of $${bill.total_amount} recorded via ${resolvedMode}!`,
      bill_id: billId,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    return res.status(500).json({ success: false, message: 'Failed to process bill payment' });
  }
});

module.exports = router;
