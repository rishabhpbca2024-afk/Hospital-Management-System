const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

// Helper to generate JWT token
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Legacy plain-text to bcrypt password upgrade helper
async function verifyAndUpgradePassword(rawPass, dbPass, tableName, idCol, idVal) {
  let match = false;
  if (dbPass.startsWith('$2a$') || dbPass.startsWith('$2b$')) {
    match = await bcrypt.compare(rawPass, dbPass);
  } else {
    match = rawPass === dbPass;
    if (match) {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(rawPass, salt);
        await pool.query(`UPDATE \`${tableName}\` SET \`Password\` = ? WHERE \`${idCol}\` = ?`, [
          hashed,
          idVal,
        ]);
        console.log(`🛡️ [Express Security] Upgraded legacy password to bcrypt for ${tableName} ID: ${idVal}`);
      } catch (err) {
        console.error('Password hash upgrade warning:', err.message);
      }
    }
  }
  return match;
}

// -------------------------------------------------------------
// 1. User Login (Admin, Doctor, Patient, Pharmacist)
// -------------------------------------------------------------
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password, role } = req.body;

    // Input Validation
    if (!usernameOrEmail || !password || !role) {
      return res.status(400).json({ success: false, message: 'All login fields are required' });
    }

    const cleanRole = role.toLowerCase().trim();
    let user = null;
    let userId = null;
    let userName = '';
    let userEmail = '';
    let dbPassword = '';
    let tableName = '';
    let idCol = '';

    if (cleanRole === 'admin') {
      tableName = 'admin';
      idCol = 'Admin_id';
      const [rows] = await pool.query('SELECT * FROM admin WHERE Username = ?', [usernameOrEmail]);
      if (rows.length > 0) {
        user = rows[0];
        userId = user.Admin_id;
        userName = user.Name;
        userEmail = user.Username;
        dbPassword = user.Password;
      }
    } else if (cleanRole === 'doctor') {
      tableName = 'doctor';
      idCol = 'doctor_id';
      const [rows] = await pool.query('SELECT * FROM doctor WHERE email = ?', [usernameOrEmail]);
      if (rows.length > 0) {
        user = rows[0];
        userId = user.doctor_id;
        userName = user.name;
        userEmail = user.email;
        dbPassword = user.password;
      }
    } else if (cleanRole === 'patient') {
      tableName = 'patient';
      idCol = 'patient_id';
      const [rows] = await pool.query('SELECT * FROM patient WHERE email = ?', [usernameOrEmail]);
      if (rows.length > 0) {
        user = rows[0];
        userId = user.patient_id;
        userName = user.name;
        userEmail = user.email;
        dbPassword = user.password;
      }
    } else if (cleanRole === 'pharmacist') {
      tableName = 'pharmacist';
      idCol = 'Pharmacist_id';
      const [rows] = await pool.query(
        'SELECT * FROM pharmacist WHERE Name = ? OR Contact_no = ?',
        [usernameOrEmail, usernameOrEmail]
      );
      if (rows.length > 0) {
        user = rows[0];
        userId = user.Pharmacist_id;
        userName = user.Name;
        userEmail = user.Contact_no;
        dbPassword = user.Password;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: User not found' });
    }

    const isMatch = await verifyAndUpgradePassword(password, dbPassword, tableName, idCol, userId);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials: Password incorrect' });
    }

    const mustChange = Boolean(user.must_change_password);

    const token = generateToken({
      id: userId,
      role: cleanRole,
      name: userName,
      email: userEmail,
      must_change_password: mustChange,
    });

    return res.json({
      success: true,
      message: `Login successful! Welcome ${userName}`,
      token,
      user: {
        id: userId,
        role: cleanRole,
        name: userName,
        email: userEmail,
        must_change_password: mustChange,
        ...(cleanRole === 'doctor' && { specialization: user.specialization, fees: user.fees }),
        ...(cleanRole === 'patient' && { gender: user.gender, contact: user.contact_no, address: user.address }),
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// -------------------------------------------------------------
// 2. Patient Registration
// -------------------------------------------------------------
router.post('/register', async (req, res) => {
  try {
    const { name, gender, dob, contact_no, email, address, password } = req.body;

    // Field Validations to prevent bad/malicious input
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: 'Full name is required' });
    if (!/^[a-zA-Z\s.]+$/.test(name.trim())) {
      return res.status(400).json({ success: false, message: 'Name must contain letters only' });
    }

    if (!contact_no || !/^[6-9]\d{9}$/.test(contact_no.trim())) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone starting with 6-9 required' });
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check existing patient
    const [existing] = await pool.query('SELECT patient_id FROM patient WHERE email = ?', [email.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'A patient with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [insertResult] = await pool.query(
      'INSERT INTO patient (name, gender, dob, contact_no, email, address, password, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [name.trim(), gender || 'Male', dob || '2000-01-01', contact_no.trim(), email.trim(), address || '', hashedPassword]
    );

    const newId = insertResult.insertId;
    const token = generateToken({
      id: newId,
      role: 'patient',
      name: name.trim(),
      email: email.trim(),
      must_change_password: false,
    });

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully!',
      token,
      user: {
        id: newId,
        role: 'patient',
        name: name.trim(),
        email: email.trim(),
        gender,
        contact_no,
        address,
        must_change_password: false,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
});

// -------------------------------------------------------------
// 3. Change Password (For All Users + Mandatory First Login)
// -------------------------------------------------------------
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const { id, role } = req.user;

    if (!old_password) return res.status(400).json({ success: false, message: 'Current password is required' });
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }
    if (new_password === old_password) {
      return res.status(400).json({ success: false, message: 'New password must differ from the old password' });
    }

    const cleanRole = (role || '').toLowerCase();
    let tableName = '';
    let idCol = '';
    let passCol = '';

    if (cleanRole === 'admin') {
      tableName = 'admin';
      idCol = 'Admin_id';
      passCol = 'Password';
    } else if (cleanRole === 'doctor') {
      tableName = 'doctor';
      idCol = 'doctor_id';
      passCol = 'password';
    } else if (cleanRole === 'patient') {
      tableName = 'patient';
      idCol = 'patient_id';
      passCol = 'password';
    } else if (cleanRole === 'pharmacist') {
      tableName = 'pharmacist';
      idCol = 'Pharmacist_id';
      passCol = 'Password';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` WHERE \`${idCol}\` = ?`, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    const currentRecord = rows[0];
    const dbPass = currentRecord[passCol] || currentRecord['Password'] || currentRecord['password'] || '';

    let isMatch = false;
    if (dbPass.startsWith('$2a$') || dbPass.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(old_password, dbPass);
    } else {
      isMatch = old_password === dbPass;
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match' });
    }

    const salt = await bcrypt.genSalt(10);
    const newHashed = await bcrypt.hash(new_password, salt);

    await pool.query(
      `UPDATE \`${tableName}\` SET \`${passCol}\` = ?, must_change_password = 0 WHERE \`${idCol}\` = ?`,
      [newHashed, id]
    );

    return res.json({
      success: true,
      message: 'Password changed successfully! Please continue.',
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update password' });
  }
});

// -------------------------------------------------------------
// 4. Submit Feedback (Patients, Doctors, Pharmacists, Guests)
// -------------------------------------------------------------
router.post('/feedback', async (req, res) => {
  try {
    const { rating, category, message, user_name, user_role } = req.body;

    if (!message || message.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Feedback comment is required (min 3 characters)' });
    }

    // Extract user from token if passed
    let userId = null;
    let userName = (user_name || 'Anonymous User').trim();
    let userRole = (user_role || 'patient').toLowerCase();

    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        userId = decoded.id;
        userName = decoded.name || userName;
        userRole = decoded.role || userRole;
      } catch {}
    }

    const starRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const cleanCategory = (category || 'General').trim();
    const cleanMessage = message.trim();

    await pool.query(
      'INSERT INTO feedback (user_id, user_name, user_role, rating, category, message) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, userName, userRole, starRating, cleanCategory, cleanMessage]
    );

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your feedback has been submitted successfully to administration.',
    });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit feedback' });
  }
});

// -------------------------------------------------------------
// 5. Current Profile
// -------------------------------------------------------------
router.get('/me', verifyToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    let profile = null;

    if (role === 'admin') {
      const [rows] = await pool.query('SELECT Admin_id as id, Name as name, Username as email, must_change_password FROM admin WHERE Admin_id = ?', [id]);
      profile = rows[0];
    } else if (role === 'doctor') {
      const [rows] = await pool.query('SELECT doctor_id as id, name, specialization, contact_no, email, fees, must_change_password FROM doctor WHERE doctor_id = ?', [id]);
      profile = rows[0];
    } else if (role === 'patient') {
      const [rows] = await pool.query('SELECT patient_id as id, name, gender, dob, contact_no, email, address, must_change_password FROM patient WHERE patient_id = ?', [id]);
      profile = rows[0];
    } else if (role === 'pharmacist') {
      const [rows] = await pool.query('SELECT Pharmacist_id as id, Name as name, Contact_no as contact_no, must_change_password FROM pharmacist WHERE Pharmacist_id = ?', [id]);
      profile = rows[0];
    }

    if (profile) {
      profile.must_change_password = Boolean(profile.must_change_password);
    }

    return res.json({ success: true, role, user: profile });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch user profile' });
  }
});

module.exports = router;
