const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken, requireRole('doctor'));

// -------------------------------------------------------------
// 1. Doctor Clinical Appointments
// -------------------------------------------------------------
router.get('/appointments', async (req, res) => {
  try {
    const doctorId = req.user.id;
    const query = `
      SELECT a.appointment_id, a.patient_id, a.doctor_id, a.appointment_date, a.status, a.diagnosis,
             p.name AS patient_name, p.gender, p.dob, p.contact_no, p.email
      FROM appointment a
      JOIN patient p ON p.patient_id = a.patient_id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_id DESC
    `;
    const [rows] = await pool.query(query, [doctorId]);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch appointments' });
  }
});

// -------------------------------------------------------------
// 2. Update Appointment Status
// -------------------------------------------------------------
router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const doctorId = req.user.id;
    const apptId = Number(req.params.id);
    const { status } = req.body;

    const [updateRes] = await pool.query(
      'UPDATE appointment SET status = ? WHERE appointment_id = ? AND doctor_id = ?',
      [status || 'Accepted', apptId, doctorId]
    );

    if (updateRes.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Appointment not found or not assigned to you' });
    }

    return res.json({ success: true, message: `Appointment updated to ${status}!` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update appointment status' });
  }
});

// -------------------------------------------------------------
// 3. Issue Digital Prescription & Queue for Dispensary
// -------------------------------------------------------------
router.post('/prescriptions', async (req, res) => {
  const doctorId = req.user.id;
  const { appointment_id, medicine_id, dosage_pattern, duration_days, notes, patient_id, diagnosis, medicines } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Fetch appointment and patient info if not provided
    const [apptRows] = await conn.query(
      'SELECT patient_id, diagnosis FROM appointment WHERE appointment_id = ? AND doctor_id = ?',
      [appointment_id, doctorId]
    );

    if (apptRows.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'Appointment not found or unauthorized' });
    }

    const resolvedPatientId = patient_id || apptRows[0].patient_id;
    const resolvedDiagnosis = diagnosis || apptRows[0].diagnosis || 'Clinical Consultation';

    // Insert into prescription header
    const [presRes] = await conn.query(
      'INSERT INTO prescription (appointment_id, patient_id, doctor_id, diagnosis, notes, status) VALUES (?, ?, ?, ?, ?, ?)',
      [appointment_id, resolvedPatientId, doctorId, resolvedDiagnosis, notes || '', 'Given']
    );

    // Handle medicine items
    if (medicine_id) {
      const [medDetails] = await conn.query('SELECT name FROM medicine WHERE medicine_id = ?', [medicine_id]);
      const medName = medDetails[0]?.name || 'Prescribed Drug';
      const duration = Number(duration_days) || 5;
      const qty = duration * 2;

      await conn.query(
        `INSERT INTO prescribed_medicine 
          (patient_id, doctor_id, medicine_id, medicine_name, dosage, duration, quantity, instructions, Status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        [resolvedPatientId, doctorId, medicine_id, medName, dosage_pattern || '1-0-1', `${duration} days`, qty, notes || 'After meals']
      );
    } else if (Array.isArray(medicines)) {
      for (const m of medicines) {
        const qty = Number(m.quantity) || 10;
        await conn.query(
          `INSERT INTO prescribed_medicine 
            (patient_id, doctor_id, medicine_id, medicine_name, dosage, duration, quantity, instructions, Status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
          [resolvedPatientId, doctorId, m.medicine_id, m.medicine_name || 'Drug', m.dosage || '1-0-1', m.duration || '5 days', qty, m.instructions || 'After meals']
        );
      }
    }

    // Mark appointment as Completed
    await conn.query('UPDATE appointment SET status = ? WHERE appointment_id = ?', ['Completed', appointment_id]);

    await conn.commit();
    conn.release();

    return res.status(201).json({
      success: true,
      message: 'Digital prescription issued and sent to dispensary!',
      prescription_id: presRes.insertId,
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Prescription error:', err);
    return res.status(500).json({ success: false, message: 'Failed to issue prescription' });
  }
});

// -------------------------------------------------------------
// 4. Refer Patient to Specialist
// -------------------------------------------------------------
router.post('/refer', async (req, res) => {
  const doctorId = req.user.id;
  const { appointment_id, patient_id, referred_to_doctor_id, to_doctor_id, reason } = req.body;
  const targetDocId = Number(referred_to_doctor_id || to_doctor_id);

  if (!targetDocId) {
    return res.status(400).json({ success: false, message: 'Please select a specialist doctor.' });
  }

  if (targetDocId === doctorId) {
    return res.status(400).json({ success: false, message: 'Cannot refer patient to yourself.' });
  }

  try {
    // Check if an identical or active referral for this patient to this specialist already exists
    const [existing] = await pool.query(
      `SELECT refer_id FROM refer_patient 
       WHERE patient_id = ? AND to_doctor_id = ?`,
      [patient_id, targetDocId]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'This patient has already been referred to this specialist doctor!',
      });
    }

    await pool.query(
      'INSERT INTO refer_patient (patient_id, from_doctor_id, to_doctor_id, reason) VALUES (?, ?, ?, ?)',
      [patient_id, doctorId, targetDocId, (reason || 'Specialist Evaluation').trim()]
    );

    if (appointment_id) {
      await pool.query('UPDATE appointment SET status = ? WHERE appointment_id = ?', ['Referred', appointment_id]);
    }

    return res.status(201).json({ success: true, message: 'Specialist referral created successfully!' });
  } catch (err) {
    console.error('Referral error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to refer patient' });
  }
});

// -------------------------------------------------------------
// 5. Patient Clinical History
// -------------------------------------------------------------
router.get('/patients/:patientId/history', async (req, res) => {
  const patientId = Number(req.params.patientId);
  try {
    const [appointments] = await pool.query(
      `SELECT a.*, d.name AS doctor_name, d.specialization 
       FROM appointment a
       LEFT JOIN doctor d ON d.doctor_id = a.doctor_id
       WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`,
      [patientId]
    );

    const [prescriptions] = await pool.query(
      `SELECT p.*, d.name AS doctor_name 
       FROM prescription p
       LEFT JOIN doctor d ON d.doctor_id = p.doctor_id
       WHERE p.patient_id = ? ORDER BY p.prescription_date DESC`,
      [patientId]
    );

    return res.json({
      success: true,
      data: {
        appointments,
        prescriptions,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch patient history' });
  }
});

// -------------------------------------------------------------
// 6. Doctor's Issued Prescriptions History
// -------------------------------------------------------------
router.get('/prescriptions', async (req, res) => {
  const doctorId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT pm.prescribed_id, pm.patient_id, pm.medicine_id, pm.medicine_name, 
              pm.dosage, pm.duration, pm.quantity, pm.instructions, pm.Status AS dispense_status,
              p.name AS patient_name, p.gender AS patient_gender, p.dob AS patient_dob, p.contact_no AS patient_contact,
              COALESCE(pr.diagnosis, 'Clinical Consultation') AS diagnosis,
              COALESCE(pr.prescription_date, NOW()) AS prescription_date,
              COALESCE(pr.notes, pm.instructions, 'Follow prescribed instructions') AS doctor_notes
       FROM prescribed_medicine pm
       JOIN patient p ON p.patient_id = pm.patient_id
       LEFT JOIN (
         SELECT patient_id, doctor_id, diagnosis, prescription_date, notes,
                ROW_NUMBER() OVER(PARTITION BY patient_id, doctor_id ORDER BY prescription_id DESC) as rn
         FROM prescription
       ) pr ON pr.patient_id = pm.patient_id AND pr.doctor_id = pm.doctor_id AND pr.rn = 1
       WHERE pm.doctor_id = ?
       ORDER BY pm.prescribed_id DESC`,
      [doctorId]
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Doctor prescriptions history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor prescriptions' });
  }
});

// -------------------------------------------------------------
// 7. Doctor's Outgoing Referrals History
// -------------------------------------------------------------
router.get('/referrals', async (req, res) => {
  const doctorId = req.user.id;
  try {
    const [rows] = await pool.query(
      `SELECT rp.refer_id, rp.patient_id, rp.to_doctor_id, rp.reason, rp.refer_date,
              p.name AS patient_name, p.gender AS patient_gender, p.dob AS patient_dob, p.contact_no AS patient_contact,
              td.name AS to_doctor_name, td.specialization AS to_doctor_specialization, td.contact_no AS to_doctor_contact, td.fees AS to_doctor_fee
       FROM refer_patient rp
       JOIN patient p ON p.patient_id = rp.patient_id
       JOIN doctor td ON td.doctor_id = rp.to_doctor_id
       WHERE rp.from_doctor_id = ?
       ORDER BY rp.refer_date DESC`,
      [doctorId]
    );
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Doctor referrals history error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch doctor referrals' });
  }
});

module.exports = router;
