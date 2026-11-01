import React, { useState, useEffect } from 'react';
import {
  Truck, Package, Filter,
  Shield, Stethoscope, Users, Pill, Calendar, DollarSign,
  Activity, CheckCircle2, Clock, Search, Plus,
  Trash2, ArrowRight, LogOut, Check, X,
  CreditCard, User, Phone, Mail,
  Lock, AlertCircle, ShoppingCart, Star, KeyRound, MessageSquarePlus,
  Printer, FileText, Eye, AlertTriangle
} from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5001/api').replace(/\/+$/, '');

// Reusable API Fetcher for Node.js Express Backend
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  const activeToken = token || (typeof window !== 'undefined' ? localStorage.getItem('hospital_token') : null);
  if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

function formatDoctorName(name) {
  if (!name) return 'Doctor';
  const clean = name.replace(/^Dr\.?\s*/i, '').trim();
  return `Dr. ${clean}`;
}

// Accurately calculate age from date of birth (DOB)
function calculateAge(dob) {
  if (!dob) return '—';
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return '—';
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let m = today.getMonth() - birthDate.getMonth();
  let d = today.getDate() - birthDate.getDate();

  if (d < 0) {
    m--;
  }
  if (m < 0) {
    years--;
    m += 12;
  }

  if (years >= 1) {
    return years === 1 ? '1 yr' : `${years} yrs`;
  } else {
    // Under 1 year old: display in months or days
    if (m === 0) {
      const diffTime = Math.max(0, today.getTime() - birthDate.getTime());
      const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return days <= 1 ? (days === 0 ? 'Newborn' : '1 day') : `${days} days`;
    }
    return m === 1 ? '1 month' : `${m} months`;
  }
}

// Format local datetime for datetime-local input min attribute (prevents booking past slots)
function getMinBookingDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  // Admin Data
  const [stats, setStats] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [pharmacistsList, setPharmacistsList] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [stockCompliance, setStockCompliance] = useState(null);
  const [adminFeedbacks, setAdminFeedbacks] = useState([]);

  // Doctor Data
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [doctorPrescriptions, setDoctorPrescriptions] = useState([]);
  const [doctorReferrals, setDoctorReferrals] = useState([]);

  // Patient Data
  const [patientDoctors, setPatientDoctors] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [patientPrescriptions, setPatientPrescriptions] = useState([]);
  const [patientReferrals, setPatientReferrals] = useState([]);
  const [patientBills, setPatientBills] = useState([]);

  // Pharmacist Data
  const [pendingPrescriptions, setPendingPrescriptions] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);

  // Verification & Receipt Modals
  const [receiptModal, setReceiptModal] = useState({ open: false, bill: null });
  const [verifyRxModal, setVerifyRxModal] = useState({ open: false, rx: null });
  const [verifyDispenseQty, setVerifyDispenseQty] = useState('');
  const [verifyDispenseMedId, setVerifyDispenseMedId] = useState('');

  // Admin Stock & Pharmacist Subtab/Filter State
  const [adminStockSubTab, setAdminStockSubTab] = useState('approvals');
  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineFilter, setMedicineFilter] = useState('all');
  const [queueFilter, setQueueFilter] = useState('all');

  // Admin Stock Quick Inward & Vendor Procurement
  const [adminStockInputs, setAdminStockInputs] = useState({});
  const [adminStockLoading, setAdminStockLoading] = useState(null);
  const [procurementHistory, setProcurementHistory] = useState([]);
  const [procureModal, setProcureModal] = useState({ open: false, medicine: null });
  const [procureForm, setProcureForm] = useState({
    medicine_id: '',
    supplier_name: 'Sun Pharma Distributors',
    batch_number: '',
    quantity: 50,
    expiry_date: '',
    unit_price: '',
    invoice_no: '',
  });
  const [procureLoading, setProcureLoading] = useState(false);

  // Authentication State
  const [loginRole, setLoginRole] = useState('admin');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: 'Rishabh@123', password: 'Rishabh123' });
  const [regForm, setRegForm] = useState({
    name: '', gender: 'Male', dob: '2000-01-01', contact_no: '', email: '', address: '', password: ''
  });

  // Action Modals State
  const [bookModal, setBookModal] = useState({ open: false, doctor: null });
  const [bookForm, setBookForm] = useState({ appointment_date: '', diagnosis: '' });

  const [prescriptionModal, setPrescriptionModal] = useState({ open: false, appointment: null });
  const [prescriptionForm, setPrescriptionForm] = useState({ medicine_id: '', dosage_pattern: '1-0-1 (Twice daily)', duration_days: 5, notes: '' });

  const [referralModal, setReferralModal] = useState({ open: false, appointment: null });
  const [referralForm, setReferralForm] = useState({ referred_to_doctor_id: '', reason: '' });

  const [payModal, setPayModal] = useState({ open: false, bill: null });
  const [payMethod, setPayMethod] = useState('UPI');

  const [addDoctorModal, setAddDoctorModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', specialization: 'Cardiologist', contact_no: '', email: '', fee: 500, password: '' });

  const [addPharmacistModal, setAddPharmacistModal] = useState(false);
  const [newPharmacist, setNewPharmacist] = useState({ name: '', contact_no: '', password: '' });

  const [reorderModal, setReorderModal] = useState(false);
  const [reorderForm, setReorderForm] = useState({ medicine_id: '', requested_quantity: 50 });

  // Feedback State
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, category: 'Doctor Consultation', message: '' });
  const [feedbackErrors, setFeedbackErrors] = useState({});

  // Change Password State
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [mandatoryPasswordChange, setMandatoryPasswordChange] = useState(false);
  const [changePassForm, setChangePassForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [changePassErrors, setChangePassErrors] = useState({});
  const [changePassNotice, setChangePassNotice] = useState('');

  // Inline Validation Errors (Displayed below each field, no scrolling up!)
  const [loginErrors, setLoginErrors] = useState({});
  const [regErrors, setRegErrors] = useState({});
  const [docErrors, setDocErrors] = useState({});
  const [pharmErrors, setPharmErrors] = useState({});
  const [formAlert, setFormAlert] = useState('');

  // Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('hospital_user');
    const savedToken = localStorage.getItem('hospital_token');
    if (savedUser && savedToken) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setToken(savedToken);
        setDefaultTabForRole(parsed.role);
        if (parsed.must_change_password) {
          setMandatoryPasswordChange(true);
          setChangePasswordModal(true);
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, []);

  const setDefaultTabForRole = (role) => {
    if (role === 'admin') setActiveTab('overview');
    else if (role === 'doctor') setActiveTab('appointments');
    else if (role === 'patient') setActiveTab('doctors');
    else if (role === 'pharmacist') setActiveTab('queue');
  };

  // Fetch data dynamically on tab or user change
  useEffect(() => {
    if (!user) return;
    loadDataForCurrentTab();
  }, [user, activeTab]);

  const loadDataForCurrentTab = async () => {
    setLoading(true);
    try {
      if (user.role === 'admin') {
        const statsRes = await apiCall('/admin/stats');
        setStats(statsRes.data);

        const complianceRes = await apiCall('/admin/stock-compliance');
        setStockCompliance(complianceRes.data || complianceRes);

        if (activeTab === 'inventory' || activeTab === 'overview') {
          const procRes = await apiCall('/admin/procurement-history').catch(() => ({ data: [] }));
          setProcurementHistory(procRes.data || []);
        }

        if (activeTab === 'overview' || activeTab === 'feedbacks') {
          const fbRes = await apiCall('/admin/feedbacks');
          setAdminFeedbacks(fbRes.data || []);
        }
        if (activeTab === 'doctors') {
          const res = await apiCall('/admin/doctors');
          setDoctorsList(res.data || []);
        } else if (activeTab === 'pharmacists') {
          const res = await apiCall('/admin/pharmacists');
          setPharmacistsList(res.data || []);
        } else if (activeTab === 'patients') {
          const res = await apiCall('/admin/patients');
          setPatientsList(res.data || []);
        }
      } else if (user.role === 'doctor') {
        const [apptRes, presRes, refRes, medRes] = await Promise.all([
          apiCall('/doctor/appointments').catch(() => ({ data: [] })),
          apiCall('/doctor/prescriptions').catch(() => ({ data: [] })),
          apiCall('/doctor/referrals').catch(() => ({ data: [] })),
          apiCall('/stats/medicines').catch(() => ({ data: [] })),
        ]);
        if (apptRes?.data) setDoctorAppointments(apptRes.data);
        if (presRes?.data) setDoctorPrescriptions(presRes.data);
        if (refRes?.data) setDoctorReferrals(refRes.data);
        if (medRes?.data) setAvailableMedicines(medRes.data);
      } else if (user.role === 'patient') {
        // Fetch all patient lists concurrently so tab counters (Appointments, Prescriptions, Referrals, Bills) are accurate right away
        const [docRes, apptRes, presRes, refRes, billsRes] = await Promise.all([
          apiCall('/patient/doctors').catch(() => ({ data: [] })),
          apiCall('/patient/my-appointments').catch(() => ({ data: [] })),
          apiCall('/patient/my-prescriptions').catch(() => ({ data: { prescriptions: [] } })),
          apiCall('/patient/my-referrals').catch(() => ({ data: [] })),
          apiCall('/patient/my-bills').catch(() => ({ data: [] })),
        ]);
        if (docRes?.data) setPatientDoctors(docRes.data);
        if (apptRes?.data) setPatientAppointments(apptRes.data);
        if (presRes?.data?.prescriptions) setPatientPrescriptions(presRes.data.prescriptions);
        else if (Array.isArray(presRes?.data)) setPatientPrescriptions(presRes.data);
        if (refRes?.data) setPatientReferrals(refRes.data);
        if (billsRes?.data) setPatientBills(billsRes.data);
      } else if (user.role === 'pharmacist') {
        const [invRes, queueRes] = await Promise.all([
          apiCall('/pharmacy/inventory').catch(() => ({ data: [] })),
          apiCall('/pharmacy/pending-prescriptions').catch(() => ({ data: [] })),
        ]);
        if (invRes?.data) setInventoryList(invRes.data);
        if (queueRes?.data) setPendingPrescriptions(queueRes.data);
      }
    } catch (err) {
      flashError(err.message || 'Error connecting to API');
    } finally {
      setLoading(false);
    }
  };

  // Switch Quick Login Presets
  const setQuickLogin = (role) => {
    setLoginRole(role);
    setIsRegisterMode(false);
    setFormAlert('');
    setLoginErrors({});
    if (role === 'admin') setLoginForm({ usernameOrEmail: 'Rishabh@123', password: 'Rishabh123' });
    else if (role === 'doctor') setLoginForm({ usernameOrEmail: 'mohan@gmail.com', password: 'mohan123' });
    else if (role === 'patient') setLoginForm({ usernameOrEmail: 'Mohan@gmail.com', password: 'Mohan123' });
    else if (role === 'pharmacist') setLoginForm({ usernameOrEmail: 'Suresh Verma', password: 'Suresh123' });
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setFormAlert('');
    const errors = {};
    if (!loginForm.usernameOrEmail.trim()) errors.usernameOrEmail = 'Required';
    if (!loginForm.password) errors.password = 'Required';
    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setLoginErrors({});
    setLoading(true);
    try {
      const res = await apiCall('/auth/login', 'POST', {
        usernameOrEmail: loginForm.usernameOrEmail.trim(),
        password: loginForm.password,
        role: loginRole,
      });

      localStorage.setItem('hospital_token', res.token);
      localStorage.setItem('hospital_user', JSON.stringify(res.user));
      setUser(res.user);
      setToken(res.token);
      setDefaultTabForRole(res.user.role);

      // Check if user has temporary password assigned by admin
      if (res.user.must_change_password) {
        setMandatoryPasswordChange(true);
        setChangePasswordModal(true);
        setChangePassForm({ old_password: loginForm.password, new_password: '', confirm_password: '' });
      }
    } catch (err) {
      setFormAlert(err.message || 'Incorrect credentials');
    } finally {
      setLoading(false);
    }
  };

  // Handle Patient Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormAlert('');
    const errors = {};
    if (!regForm.name.trim()) errors.name = 'Name required';
    else if (!/^[a-zA-Z\s.]+$/.test(regForm.name.trim())) errors.name = 'Letters only';

    if (!regForm.dob) errors.dob = 'Date required';

    if (!regForm.contact_no) errors.contact_no = 'Phone required';
    else if (!/^[6-9]\d{9}$/.test(regForm.contact_no.trim())) errors.contact_no = 'Invalid 10-digit number';

    if (!regForm.email) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) errors.email = 'Invalid email';

    if (!regForm.password) errors.password = 'Password required';
    else if (regForm.password.length < 6) errors.password = 'Min 6 characters';

    if (Object.keys(errors).length > 0) {
      setRegErrors(errors);
      return;
    }
    setRegErrors({});
    setLoading(true);
    try {
      const res = await apiCall('/auth/register', 'POST', {
        ...regForm,
        name: regForm.name.trim(),
        email: regForm.email.trim(),
        contact_no: regForm.contact_no.trim(),
      });
      localStorage.setItem('hospital_token', res.token);
      localStorage.setItem('hospital_user', JSON.stringify(res.user));
      setUser(res.user);
      setToken(res.token);
      setDefaultTabForRole(res.user.role);
    } catch (err) {
      setFormAlert(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Change Password Handler
  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!changePassForm.old_password) errors.old_password = 'Old password required';
    if (!changePassForm.new_password) errors.new_password = 'New password required';
    else if (changePassForm.new_password.length < 6) errors.new_password = 'Min 6 characters';

    if (changePassForm.new_password !== changePassForm.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    if (changePassForm.new_password && changePassForm.new_password === changePassForm.old_password) {
      errors.new_password = 'Must differ from old password';
    }

    if (Object.keys(errors).length > 0) {
      setChangePassErrors(errors);
      return;
    }
    setChangePassErrors({});
    setChangePassNotice('');
    setLoading(true);
    try {
      await apiCall('/auth/change-password', 'POST', {
        old_password: changePassForm.old_password,
        new_password: changePassForm.new_password,
      });

      const updatedUser = { ...user, must_change_password: false };
      setUser(updatedUser);
      localStorage.setItem('hospital_user', JSON.stringify(updatedUser));
      setMandatoryPasswordChange(false);
      setChangePasswordModal(false);
      setChangePassForm({ old_password: '', new_password: '', confirm_password: '' });
      flashSuccess('Password updated successfully! Account secured.');
    } catch (err) {
      setChangePassNotice(err.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  // Feedback Submit Handler
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message || feedbackForm.message.trim().length < 3) {
      setFeedbackErrors({ message: 'Enter at least 3 characters' });
      return;
    }
    setFeedbackErrors({});
    setLoading(true);
    try {
      await apiCall('/auth/feedback', 'POST', {
        rating: feedbackForm.rating,
        category: feedbackForm.category,
        message: feedbackForm.message.trim(),
        user_name: user?.name || 'Anonymous User',
        user_role: user?.role || 'patient',
      });
      flashSuccess('Thank you! Your feedback has been recorded.');
      setFeedbackModal(false);
      setFeedbackForm({ rating: 5, category: 'Doctor Consultation', message: '' });
      if (user?.role === 'admin' && activeTab === 'feedbacks') {
        const res = await apiCall('/admin/feedbacks');
        setAdminFeedbacks(res.data || []);
      }
    } catch (err) {
      flashSuccess(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  // Admin Delete Feedback
  const handleDeleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await apiCall(`/admin/feedbacks/${id}`, 'DELETE');
      flashSuccess('Feedback deleted');
      const res = await apiCall('/admin/feedbacks');
      setAdminFeedbacks(res.data || []);
    } catch (err) {
      flashSuccess(err.message || 'Failed to delete feedback');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('hospital_token');
    localStorage.removeItem('hospital_user');
    setUser(null);
    setToken(null);
    setStats(null);
  };

  // Flash message utility (Supports success and error notifications)
  const flashToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'success' }), 4500);
  };
  const flashSuccess = (msg) => flashToast(msg, 'success');
  const flashError = (msg) => flashToast(msg, 'error');

  // Patient: Book Appointment
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    if (!bookForm.appointment_date) {
      flashError('Please select a preferred date and time for the consultation.');
      return;
    }
    const selectedDate = new Date(bookForm.appointment_date);
    if (isNaN(selectedDate.getTime())) {
      flashError('Invalid date/time format. Please choose a valid appointment slot.');
      return;
    }
    const now = new Date();
    // Prevent booking in the past (allow 1 minute grace period for form filling)
    if (selectedDate.getTime() < now.getTime() - 60000) {
      flashError('Cannot book appointments in the past! Please select an upcoming date and time.');
      return;
    }
    if (!bookForm.diagnosis || bookForm.diagnosis.trim().length < 3) {
      flashError('Please provide details of your symptoms or reason for visit (minimum 3 characters).');
      return;
    }

    try {
      await apiCall('/patient/appointments', 'POST', {
        doctor_id: bookModal.doctor.doctor_id,
        appointment_date: bookForm.appointment_date,
        diagnosis: bookForm.diagnosis,
      });
      flashSuccess(`Appointment booked successfully with Dr. ${bookModal.doctor.name}!`);
      setBookModal({ open: false, doctor: null });
      setBookForm({ appointment_date: '', diagnosis: '' });
      setActiveTab('appointments');
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message);
    }
  };

  // Patient: Pay Bill
  const handlePayBillSubmit = async (e) => {
    e.preventDefault();
    try {
      const currentBill = payModal.bill;
      await apiCall(`/patient/pay-bill/${currentBill.bill_id}`, 'POST', {
        payment_mode: payMethod,
        amount: currentBill.total_amount,
      });
      flashSuccess(`Payment of ₹${currentBill.total_amount} successful via ${payMethod}!`);
      setPayModal({ open: false, bill: null });
      // Automatically open official hospital receipt so patient can view & print
      setReceiptModal({
        open: true,
        bill: { ...currentBill, payment_status: 'Paid', payment_mode: payMethod }
      });
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message);
    }
  };

  // Doctor: Update Status
  const handleUpdateStatus = async (appId, status) => {
    try {
      await apiCall(`/doctor/appointments/${appId}/status`, 'PATCH', { status });
      flashSuccess(`Appointment #${appId} updated to ${status}`);
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message);
    }
  };

  // Doctor: Issue Prescription
  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/doctor/prescriptions', 'POST', {
        appointment_id: prescriptionModal.appointment.appointment_id,
        medicine_id: Number(prescriptionForm.medicine_id),
        dosage_pattern: prescriptionForm.dosage_pattern,
        duration_days: Number(prescriptionForm.duration_days),
        notes: prescriptionForm.notes,
      });
      flashSuccess('Digital prescription issued and sent to dispensary!');
      setPrescriptionModal({ open: false, appointment: null });
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message);
    }
  };

  // Doctor: Refer to Specialist (Protected against duplicate submission)
  const [referralSubmitting, setReferralSubmitting] = useState(false);
  const handleReferralSubmit = async (e) => {
    e.preventDefault();
    if (referralSubmitting) return;
    setReferralSubmitting(true);
    try {
      await apiCall('/doctor/refer', 'POST', {
        appointment_id: referralModal.appointment?.appointment_id,
        patient_id: referralModal.appointment?.patient_id,
        referred_to_doctor_id: Number(referralForm.referred_to_doctor_id),
        reason: referralForm.reason,
      });
      flashSuccess('Specialist referral successfully created!');
      setReferralModal({ open: false, appointment: null });
      setReferralForm({ referred_to_doctor_id: '', reason: '' });
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message || 'Failed to create referral');
    } finally {
      setReferralSubmitting(false);
    }
  };

  // Pharmacist: Dispense Prescription with Expiry Safety Check & Verified Quantity
  const handleDispense = async (prescribedId, requiredQty, currentStock, expiryDate, medicineName, customMedicineId = null) => {
    const qtyToDispense = Number(requiredQty);
    if (!qtyToDispense || qtyToDispense <= 0 || isNaN(qtyToDispense)) {
      flashError('Please enter a valid positive quantity to dispense');
      return;
    }
    if (expiryDate && new Date(expiryDate).getTime() < Date.now()) {
      flashError(`Clinical Safety Block: Cannot dispense expired drug! ${medicineName || 'This medication'} passed its expiration date.`);
      return;
    }
    if (currentStock !== undefined && currentStock < qtyToDispense) {
      flashError(`Cannot dispense: Insufficient stock! Required: ${qtyToDispense} units, but only ${currentStock} units in dispensary. Please request restock.`);
      return;
    }
    try {
      const payload = { custom_quantity: qtyToDispense };
      if (customMedicineId) payload.custom_medicine_id = Number(customMedicineId);
      const res = await apiCall(`/pharmacy/dispense/${prescribedId}`, 'POST', payload);
      flashSuccess(res.message || `Prescription #${prescribedId} verified and dispensed successfully! Stock deducted and bill generated.`);
      setVerifyRxModal({ open: false, rx: null });
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message || 'Failed to dispense medicine');
    }
  };

  // Pharmacist: Create Reorder
  const handleReorderSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall('/pharmacy/reorder', 'POST', {
        medicine_id: Number(reorderForm.medicine_id),
        requested_quantity: Number(reorderForm.requested_quantity),
      });
      flashSuccess('Restock request submitted for Hospital Administrator approval!');
      setReorderModal(false);
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message);
    }
  };

  // Admin: Approve/Reject Reorder
  const handleReorderAction = async (reorderId, action) => {
    try {
      await apiCall(`/admin/reorder/${reorderId}/action`, 'POST', { action });
      flashSuccess(`Reorder #${reorderId} ${action === 'approve' ? 'approved' : 'rejected'}!`);
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message);
    }
  };

  // Admin: Directly Add Stock to Medicine Inventory
  const handleAdminAddStock = async (medicineId, medicineName) => {
    const qty = Number(adminStockInputs[medicineId]);
    if (!qty || qty <= 0 || isNaN(qty)) {
      flashError('Please enter a valid quantity to add (e.g. 10, 50, 100)');
      return;
    }
    setAdminStockLoading(medicineId);
    try {
      const res = await apiCall(`/admin/medicines/${medicineId}/add-stock`, 'POST', { quantity: qty });
      flashSuccess(res.message || `Successfully added ${qty} units to ${medicineName}!`);
      setAdminStockInputs((prev) => ({ ...prev, [medicineId]: '' }));
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message || 'Failed to add medicine stock');
    } finally {
      setAdminStockLoading(null);
    }
  };

  // Admin: Open Inward Consignment Procurement Modal
  const openProcureModal = (med = null) => {
    // Generate default future expiry (2 years from now)
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2);
    const expStr = futureDate.toISOString().split('T')[0];

    const medPrefix = med ? med.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'MED';
    const randomBatch = `BATCH-${medPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomInv = `INV-${Date.now().toString().slice(-5)}`;

    setProcureModal({ open: true, medicine: med });
    setProcureForm({
      medicine_id: med ? med.medicine_id : '',
      supplier_name: 'Sun Pharma Distributors',
      batch_number: randomBatch,
      quantity: 50,
      expiry_date: expStr,
      unit_price: med?.price_per_unit || '',
      invoice_no: randomInv,
    });
  };

  // Admin: Confirm & Receive Inward Consignment from Pharmaceutical Supplier
  const handleProcureSubmit = async (e) => {
    e.preventDefault();
    const medId = procureModal.medicine ? procureModal.medicine.medicine_id : procureForm.medicine_id;
    if (!medId) {
      flashError('Please select a medicine item to procure');
      return;
    }
    const qty = Number(procureForm.quantity);
    if (!qty || qty <= 0 || isNaN(qty)) {
      flashError('Please enter a valid positive quantity of units to procure');
      return;
    }
    if (!procureForm.expiry_date) {
      flashError('Please provide an expiry date for the new consignment');
      return;
    }
    const expTime = new Date(procureForm.expiry_date).getTime();
    const todayTime = new Date().setHours(0, 0, 0, 0);
    if (isNaN(expTime) || expTime <= todayTime) {
      flashError('Consignment expiry date must be a valid future date (not today or in the past)!');
      return;
    }

    setProcureLoading(true);
    try {
      const res = await apiCall(`/admin/medicines/${medId}/procure`, 'POST', {
        quantity: qty,
        supplier_name: procureForm.supplier_name,
        batch_number: procureForm.batch_number,
        expiry_date: procureForm.expiry_date,
        unit_price: procureForm.unit_price,
        invoice_no: procureForm.invoice_no,
        dispose_expired: true,
      });

      flashSuccess(res.message || 'Fresh consignment successfully received & logged into inventory!');
      setProcureModal({ open: false, medicine: null });
      loadDataForCurrentTab();
    } catch (err) {
      flashError(err.message || 'Failed to record consignment');
    } finally {
      setProcureLoading(false);
    }
  };

  // Admin: Add Doctor
  const handleAddDoctor = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newDoctor.name.trim()) errors.name = 'Doctor name required';
    else if (!/^[a-zA-Z\s.]+$/.test(newDoctor.name.trim())) errors.name = 'Letters only';

    if (!newDoctor.contact_no) errors.contact_no = 'Phone required';
    else if (!/^[6-9]\d{9}$/.test(newDoctor.contact_no.trim())) errors.contact_no = 'Invalid 10-digit number';

    if (!newDoctor.email) errors.email = 'Email required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newDoctor.email.trim())) errors.email = 'Invalid email';

    if (newDoctor.fee < 0) errors.fee = 'Invalid fee';

    if (newDoctor.password && newDoctor.password.length < 6) errors.password = 'Min 6 characters';

    if (Object.keys(errors).length > 0) {
      setDocErrors(errors);
      return;
    }
    setDocErrors({});
    try {
      await apiCall('/admin/doctors', 'POST', {
        ...newDoctor,
        name: newDoctor.name.trim(),
        email: newDoctor.email.trim(),
        contact_no: newDoctor.contact_no.trim(),
        password: newDoctor.password || 'doctor123',
      });
      flashSuccess(`${formatDoctorName(newDoctor.name)} onboarded!`);
      setAddDoctorModal(false);
      setNewDoctor({ name: '', specialization: 'Cardiologist', contact_no: '', email: '', fee: 500, password: '' });
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message || 'Failed to onboard doctor');
    }
  };

  // Admin: Add Pharmacist
  const handleAddPharmacist = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!newPharmacist.name.trim()) errors.name = 'Pharmacist name required';
    else if (!/^[a-zA-Z\s.]+$/.test(newPharmacist.name.trim())) errors.name = 'Letters only';

    if (!newPharmacist.contact_no) errors.contact_no = 'Phone required';
    else if (!/^[6-9]\d{9}$/.test(newPharmacist.contact_no.trim())) errors.contact_no = 'Invalid 10-digit number';

    if (newPharmacist.password && newPharmacist.password.length < 6) errors.password = 'Min 6 characters';

    if (Object.keys(errors).length > 0) {
      setPharmErrors(errors);
      return;
    }
    setPharmErrors({});
    try {
      await apiCall('/admin/pharmacists', 'POST', {
        ...newPharmacist,
        name: newPharmacist.name.trim(),
        contact_no: newPharmacist.contact_no.trim(),
        password: newPharmacist.password || 'pharm123',
      });
      flashSuccess(`Pharmacist ${newPharmacist.name} registered!`);
      setAddPharmacistModal(false);
      setNewPharmacist({ name: '', contact_no: '', password: '' });
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message || 'Failed to register pharmacist');
    }
  };

  // Admin: Delete Doctor
  const handleDeleteDoctor = async (id) => {
    if (!confirm('Are you sure you want to remove this doctor?')) return;
    try {
      await apiCall(`/admin/doctors/${id}`, 'DELETE');
      flashSuccess('Doctor record removed');
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message);
    }
  };

  // Admin: Delete Pharmacist
  const handleDeletePharmacist = async (id) => {
    if (!confirm('Are you sure you want to remove this pharmacist?')) return;
    try {
      await apiCall(`/admin/pharmacists/${id}`, 'DELETE');
      flashSuccess('Pharmacist record removed');
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message);
    }
  };

  // Admin: Delete Patient
  const handleDeletePatient = async (id) => {
    if (!confirm('Are you sure you want to remove this patient and their records?')) return;
    try {
      await apiCall(`/admin/patients/${id}`, 'DELETE');
      flashSuccess('Patient record removed');
      loadDataForCurrentTab();
    } catch (err) {
      flashSuccess(err.message);
    }
  };

  return (
    <div className="app-container">
      {/* Sticky Header */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={24} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>Lifeline Hospital</div>
            <div className="brand-subtext">Integrated Healthcare System</div>
          </div>
        </div>

        <div className="nav-actions">
          {/* Feedback option accessible by anyone */}
          <button
            onClick={() => { setFeedbackModal(true); setFeedbackErrors({}); }}
            className="btn btn-secondary btn-sm"
            title="Give Hospital Feedback">
            <MessageSquarePlus size={15} color="var(--primary)" />
            <span className="nav-btn-text">Feedback</span>
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <button
                onClick={() => {
                  setMandatoryPasswordChange(false);
                  setChangePasswordModal(true);
                  setChangePassErrors({});
                  setChangePassNotice('');
                }}
                className="btn btn-secondary btn-sm"
                title="Change Account Password">
                <KeyRound size={15} />
                <span className="nav-btn-text">Password</span>
              </button>

              <div className="user-badge">
                <User size={16} color="var(--primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{user.name}</span>
                <span className="user-role-tag">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Sign Out">
                <LogOut size={15} />
                <span className="nav-btn-text">Logout</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Modern Floating Toast Notification */}
      {toast.message && (
        <div
          className="toast-toast"
          style={toast.type === 'error' ? { background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b', boxShadow: '0 8px 24px rgba(239,68,68,0.2)' } : {}}>
          {toast.type === 'error' ? <AlertCircle size={18} color="#ef4444" /> : <CheckCircle2 size={18} color="#4ade80" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/*                       UNAUTHENTICATED AUTH VIEW                       */}
      {/* ===================================================================== */}
      {!user ? (
        <div className="main-content" style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 120px)' }}>
          <div className="auth-card" style={{ maxWidth: 520, width: '100%', background: 'white', borderRadius: 24, padding: '2.5rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #0284c7, #0d9488)', display: 'grid', placeItems: 'center', color: 'white', margin: '0 auto 1.25rem', boxShadow: 'var(--shadow-glow)' }}>
                <Shield size={32} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.35rem' }}>Hospital Clinical Portal</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Secure Clinical Healthcare & Multi-Specialty Care System
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.35rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: 12, marginBottom: '1.75rem' }}>
              <button
                type="button"
                onClick={() => setQuickLogin('admin')}
                style={{ padding: '0.6rem 0.25rem', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: loginRole === 'admin' ? 'white' : 'transparent', color: loginRole === 'admin' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginRole === 'admin' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                👑 Admin
              </button>
              <button
                type="button"
                onClick={() => setQuickLogin('doctor')}
                style={{ padding: '0.6rem 0.25rem', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: loginRole === 'doctor' ? 'white' : 'transparent', color: loginRole === 'doctor' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginRole === 'doctor' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                🩺 Doctor
              </button>
              <button
                type="button"
                onClick={() => setQuickLogin('patient')}
                style={{ padding: '0.6rem 0.25rem', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: loginRole === 'patient' ? 'white' : 'transparent', color: loginRole === 'patient' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginRole === 'patient' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                🧑 Patient
              </button>
              <button
                type="button"
                onClick={() => setQuickLogin('pharmacist')}
                style={{ padding: '0.6rem 0.25rem', border: 'none', borderRadius: 8, fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', background: loginRole === 'pharmacist' ? 'white' : 'transparent', color: loginRole === 'pharmacist' ? 'var(--primary)' : 'var(--text-muted)', boxShadow: loginRole === 'pharmacist' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>
                💊 Pharmacist
              </button>
            </div>

            {/* Standard Login vs Registration Form */}
            {!isRegisterMode ? (
              <form onSubmit={handleLoginSubmit}>
                {formAlert && (
                  <div className="form-inline-error">
                    <AlertCircle size={15} />
                    <span>{formAlert}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    {loginRole === 'admin' ? 'Username' : loginRole === 'pharmacist' ? 'Pharmacist Name / Contact' : 'Email Address'}
                  </label>
                  <input
                    type="text"
                    required
                    className={`form-input ${loginErrors.usernameOrEmail ? 'input-error' : ''}`}
                    value={loginForm.usernameOrEmail}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, usernameOrEmail: e.target.value });
                      if (loginErrors.usernameOrEmail) setLoginErrors((prev) => ({ ...prev, usernameOrEmail: '' }));
                      setFormAlert('');
                    }}
                  />
                  {loginErrors.usernameOrEmail && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {loginErrors.usernameOrEmail}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    required
                    className={`form-input ${loginErrors.password ? 'input-error' : ''}`}
                    value={loginForm.password}
                    onChange={(e) => {
                      setLoginForm({ ...loginForm, password: e.target.value });
                      if (loginErrors.password) setLoginErrors((prev) => ({ ...prev, password: '' }));
                      setFormAlert('');
                    }}
                  />
                  {loginErrors.password && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {loginErrors.password}</div>
                  )}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                  {loading ? 'Authenticating...' : `Enter ${loginRole.toUpperCase()} Dashboard`}
                </button>

                {loginRole === 'patient' && (
                  <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
                    Need a medical file?{' '}
                    <button type="button" onClick={() => setIsRegisterMode(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                      Register as New Patient
                    </button>
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit}>
                {formAlert && (
                  <div className="form-inline-error">
                    <AlertCircle size={15} />
                    <span>{formAlert}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    className={`form-input ${regErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Ramesh Verma"
                    value={regForm.name}
                    onChange={(e) => {
                      setRegForm({ ...regForm, name: e.target.value });
                      if (regErrors.name) setRegErrors((prev) => ({ ...prev, name: '' }));
                    }}
                  />
                  {regErrors.name && <div className="field-error-msg"><AlertCircle size={13} /> {regErrors.name}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select className="form-select" value={regForm.gender} onChange={(e) => setRegForm({ ...regForm, gender: e.target.value })}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      required
                      className={`form-input ${regErrors.dob ? 'input-error' : ''}`}
                      value={regForm.dob}
                      onChange={(e) => {
                        setRegForm({ ...regForm, dob: e.target.value });
                        if (regErrors.dob) setRegErrors((prev) => ({ ...prev, dob: '' }));
                      }}
                    />
                    {regErrors.dob && <div className="field-error-msg"><AlertCircle size={13} /> {regErrors.dob}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    className={`form-input ${regErrors.contact_no ? 'input-error' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                    value={regForm.contact_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setRegForm({ ...regForm, contact_no: val });
                      if (regErrors.contact_no) setRegErrors((prev) => ({ ...prev, contact_no: '' }));
                    }}
                  />
                  {regErrors.contact_no && <div className="field-error-msg"><AlertCircle size={13} /> {regErrors.contact_no}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    className={`form-input ${regErrors.email ? 'input-error' : ''}`}
                    placeholder="patient@gmail.com"
                    value={regForm.email}
                    onChange={(e) => {
                      setRegForm({ ...regForm, email: e.target.value });
                      if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                  {regErrors.email && <div className="field-error-msg"><AlertCircle size={13} /> {regErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Create Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={`form-input ${regErrors.password ? 'input-error' : ''}`}
                    placeholder="Min 6 characters"
                    value={regForm.password}
                    onChange={(e) => {
                      setRegForm({ ...regForm, password: e.target.value });
                      if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: '' }));
                    }}
                  />
                  {regErrors.password && <div className="field-error-msg"><AlertCircle size={13} /> {regErrors.password}</div>}
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                  {loading ? 'Creating Patient File...' : 'Complete Registration & Sign In'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem' }}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setIsRegisterMode(false)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer' }}>
                    Sign in here
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-Click Fast Fill Demo Accounts */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                ⚡ 1-Click Demo Accounts
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                <button type="button" onClick={() => setQuickLogin('admin')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  👑 Admin (Rishabh)
                </button>
                <button type="button" onClick={() => setQuickLogin('doctor')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  🩺 Doctor (Dr. Mohan)
                </button>
                <button type="button" onClick={() => setQuickLogin('patient')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  🧑 Patient (Mohan)
                </button>
                <button type="button" onClick={() => setQuickLogin('pharmacist')} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start' }}>
                  💊 Pharmacist (Suresh)
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* =================================================================== */
        /*                     AUTHENTICATED USER DASHBOARDS                   */
        /* =================================================================== */
        <main className="main-content">
          {/* ================================================================= */}
          {/* 1. ADMIN DASHBOARD                                                */}
          {/* ================================================================= */}
          {user.role === 'admin' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Executive Administration Suite</h1>
                  <p className="page-subtitle">Hospital Oversight, Real-Time Financials, Staffing, and Compliance</p>
                </div>
              </div>

              {/* Confidential KPI Metrics */}
              {stats && (
                <div className="stat-grid">
                  <div className="stat-card">
                    <div className="stat-info">
                      <h4>Total Doctors</h4>
                      <div className="stat-value">{stats.total_doctors}</div>
                    </div>
                    <div className="stat-icon blue"><Stethoscope size={24} /></div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <h4>Total Patients</h4>
                      <div className="stat-value">{stats.total_patients}</div>
                    </div>
                    <div className="stat-icon purple"><Users size={24} /></div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-info">
                      <h4>Total Pharmacists</h4>
                      <div className="stat-value">{stats.total_pharmacists ?? 0}</div>
                    </div>
                    <div className="stat-icon amber"><Pill size={24} /></div>
                  </div>

                  <div className="stat-card" style={{ border: '2px solid #86efac', background: '#f0fdf4' }}>
                    <div className="stat-info">
                      <h4>Hospital Revenue (Paid)</h4>
                      <div className="stat-value" style={{ color: '#16a34a' }}>
                        ₹{Number(stats.revenue?.total_revenue ?? stats.revenue?.total ?? 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="stat-icon green"><DollarSign size={24} /></div>
                  </div>
                </div>
              )}

              {/* Admin Navigation Tabs */}
              <div className="tabs-nav">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                  <Activity size={18} /> Executive Overview
                </button>
                <button className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>
                  <Stethoscope size={18} /> Doctors ({stats?.total_doctors ?? doctorsList.length})
                </button>
                <button className={`tab-btn ${activeTab === 'pharmacists' ? 'active' : ''}`} onClick={() => setActiveTab('pharmacists')}>
                  <Pill size={18} /> Pharmacists ({stats?.total_pharmacists ?? pharmacistsList.length})
                </button>
                <button className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`} onClick={() => setActiveTab('patients')}>
                  <Users size={18} /> Patient Directory ({stats?.total_patients ?? patientsList.length})
                </button>
                <button className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`} onClick={() => setActiveTab('stock')}>
                  <Shield size={18} /> Stock Compliance & Approvals
                </button>
                <button className={`tab-btn ${activeTab === 'feedbacks' ? 'active' : ''}`} onClick={() => setActiveTab('feedbacks')}>
                  <Star size={18} /> User Feedbacks ({adminFeedbacks.length})
                </button>
              </div>

              {/* Admin Tab 1: Overview */}
              {activeTab === 'overview' && stats && (
                <div className="grid-2-col">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Billing & Collections Summary</div>
                      <span className="badge paid">Audited</span>
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Settled Invoices</span>
                        <strong>{stats.revenue?.total_paid_bills ?? stats.revenue?.paid_bills ?? 0} Bills</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Consultation Fees Earned</span>
                        <strong>₹{Number(stats.revenue?.total_consultation_fees || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Pharmacy Dispensed Revenue</span>
                        <strong>₹{Number(stats.revenue?.total_medicine_revenue || 0).toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0 0', fontSize: '1.1rem' }}>
                        <span style={{ fontWeight: 800 }}>Net Gross Collected</span>
                        <strong style={{ color: '#16a34a' }}>₹{Number(stats.revenue?.total_revenue ?? stats.revenue?.total ?? 0).toLocaleString('en-IN')}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">Appointments Health</div>
                      <Calendar size={18} color="var(--primary)" />
                    </div>
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Total Appointments Scheduled</span>
                        <strong>{stats.appointments?.total || 0}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Completed Consultations</span>
                        <span className="badge completed">{stats.appointments?.completed || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Active / Accepted</span>
                        <span className="badge accepted">{stats.appointments?.accepted || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Pending Awaiting Review</span>
                        <span className="badge pending">{stats.appointments?.pending || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Tab 2: Doctors List */}
              {activeTab === 'doctors' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Registered Hospital Doctors</div>
                    <button onClick={() => setAddDoctorModal(true)} className="btn btn-primary btn-sm">
                      <Plus size={16} /> Onboard Doctor
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Doctor Name</th>
                          <th>Specialization</th>
                          <th>Contact Phone</th>
                          <th>Email Address</th>
                          <th>Consult Fee</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorsList.map((doc, idx) => (
                          <tr key={doc.doctor_id}>
                            <td>#{idx + 1}</td>
                            <td><strong>{formatDoctorName(doc.name)}</strong></td>
                            <td><span className="badge accepted">{doc.specialization}</span></td>
                            <td>{doc.contact_no}</td>
                            <td>{doc.email}</td>
                            <td><strong>₹{Number(doc.fee ?? doc.fees ?? 0).toLocaleString('en-IN')}</strong></td>
                            <td>
                              <button onClick={() => handleDeleteDoctor(doc.doctor_id)} className="btn btn-danger btn-sm">
                                <Trash2 size={14} /> Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admin Tab 3: Pharmacists List */}
              {activeTab === 'pharmacists' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Licensed Dispensary Chemists</div>
                    <button onClick={() => setAddPharmacistModal(true)} className="btn btn-secondary btn-sm">
                      <Plus size={16} /> Add Pharmacist
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Pharmacist Name</th>
                          <th>Contact Number</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacistsList.map((pharm, idx) => {
                          const pharmId = pharm.pharmacist_id || pharm.Pharmacist_id;
                          const pharmName = pharm.name || pharm.Name;
                          const pharmContact = pharm.contact_no || pharm.Contact_no;
                          return (
                            <tr key={pharmId || idx}>
                              <td>#{idx + 1}</td>
                              <td><strong>{pharmName}</strong></td>
                              <td>{pharmContact}</td>
                              <td><span className="badge accepted">Active</span></td>
                              <td>
                                <button onClick={() => handleDeletePharmacist(pharmId)} className="btn btn-danger btn-sm">
                                  <Trash2 size={14} /> Remove
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admin Tab 4: Patient Directory */}
              {activeTab === 'patients' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Patient Directory</div>
                    <span className="badge completed">{patientsList.length} Registered</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Full Name</th>
                          <th>Gender</th>
                          <th>Age</th>
                          <th>Phone</th>
                          <th>Email</th>
                          <th>Address</th>
                          <th>Medical History Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientsList.map((pat, idx) => (
                          <tr key={pat.patient_id}>
                            <td>#{idx + 1}</td>
                            <td><strong>{pat.name}</strong></td>
                            <td>{pat.gender}</td>
                            <td><strong style={{ color: 'var(--primary)' }}>{calculateAge(pat.dob)}</strong></td>
                            <td>{pat.contact_no}</td>
                            <td>{pat.email}</td>
                            <td>{pat.address || '—'}</td>
                            <td>
                              <span className="badge accepted" title="Permanent medical history is securely preserved">
                                <Check size={12} /> Active EHR
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admin Tab 5: Stock Compliance & Approvals */}
              {activeTab === 'stock' && (() => {
                const stockData = stockCompliance || {};
                const medicines = stockData.medicines || [];
                const pendingReqs = stockData.pending_requests || [];
                const expiredList = medicines.filter((m) => m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now()));
                const lowStockList = medicines.filter((m) => (Number(m.stock_quantity) <= 20 || m.status === 'LOW_STOCK') && !(m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now())));

                // Filter medicines for formulary sub-tab
                const filteredMeds = medicines.filter((m) => {
                  const isExpired = m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now());
                  const isLow = !isExpired && (Number(m.stock_quantity) <= 20 || m.status === 'LOW_STOCK');
                  if (medicineFilter === 'low' && !isLow) return false;
                  if (medicineFilter === 'expired' && !isExpired) return false;
                  if (medicineFilter === 'ok' && (isLow || isExpired)) return false;
                  if (medicineSearch.trim()) {
                    const q = medicineSearch.toLowerCase().trim();
                    return m.name.toLowerCase().includes(q) || (m.type && m.type.toLowerCase().includes(q));
                  }
                  return true;
                });

                return (
                  <div>
                    {/* Compact KPI Metric Strip */}
                    <div className="metric-strip">
                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Restock Approvals</div>
                          <div className="val" style={{ color: pendingReqs.length > 0 ? '#b45309' : '#15803d' }}>
                            {pendingReqs.length} Pending
                          </div>
                        </div>
                        <span className={`badge ${pendingReqs.length > 0 ? 'pending' : 'ok'}`}>
                          {pendingReqs.length > 0 ? 'Action Needed' : 'Cleared'}
                        </span>
                      </div>

                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Safety Threshold</div>
                          <div className="val" style={{ color: lowStockList.length > 0 ? '#dc2626' : '#15803d' }}>
                            {lowStockList.length} Low-Stock
                          </div>
                        </div>
                        <span className={`badge ${lowStockList.length > 0 ? 'low-stock' : 'ok'}`}>
                          {lowStockList.length > 0 ? '≤ 20 Units' : 'Optimal'}
                        </span>
                      </div>

                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Expired Batches</div>
                          <div className="val" style={{ color: expiredList.length > 0 ? '#dc2626' : '#15803d' }}>
                            {expiredList.length} Blocked
                          </div>
                        </div>
                        <span className={`badge ${expiredList.length > 0 ? 'expired' : 'ok'}`}>
                          {expiredList.length > 0 ? 'Dispense Blocked' : 'Zero Expired'}
                        </span>
                      </div>

                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Inward Consignments</div>
                          <div className="val" style={{ color: 'var(--primary)' }}>
                            {procurementHistory.length} Batches
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openProcureModal(null)}
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.35rem 0.65rem' }}>
                          <ShoppingCart size={13} /> + Procure
                        </button>
                      </div>
                    </div>

                    {/* Clean Sub-Tabs Switcher */}
                    <div className="subtab-nav">
                      <button
                        type="button"
                        onClick={() => setAdminStockSubTab('approvals')}
                        className={`subtab-btn ${adminStockSubTab === 'approvals' ? 'active' : ''}`}>
                        <CheckCircle2 size={15} /> Restock Approvals ({pendingReqs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminStockSubTab('inventory')}
                        className={`subtab-btn ${adminStockSubTab === 'inventory' ? 'active' : ''}`}>
                        <Pill size={15} /> Medicine Formulary & Stock ({medicines.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminStockSubTab('procurement')}
                        className={`subtab-btn ${adminStockSubTab === 'procurement' ? 'active' : ''}`}>
                        <Truck size={15} /> Vendor Procurement Ledger ({procurementHistory.length})
                      </button>
                    </div>

                    {/* Subtab 1: Pending Restock Approvals */}
                    {adminStockSubTab === 'approvals' && (
                      <div>
                        <div className="card">
                          <div className="card-header">
                            <div>
                              <div className="card-title">Dispensary Restock Requests Awaiting Approval</div>
                              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Review and approve pharmacy replenishment requisitions submitted by hospital pharmacists
                              </p>
                            </div>
                            <span className="badge pending">{pendingReqs.length} Requests Pending</span>
                          </div>
                          <div className="table-responsive">
                            <table className="data-table">
                              <thead>
                                <tr>
                                  <th>Req #</th>
                                  <th>Medicine Name</th>
                                  <th>Current Units</th>
                                  <th>Requested Stock</th>
                                  <th>Requested By</th>
                                  <th>Requisition Date</th>
                                  <th>Executive Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pendingReqs.length === 0 ? (
                                  <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <CheckCircle2 size={32} color="#16a34a" />
                                        <strong style={{ color: 'var(--text-main)' }}>All Restock Requests Cleared</strong>
                                        <span style={{ fontSize: '0.85rem' }}>There are currently no pending replenishment requests from the dispensary.</span>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  pendingReqs.map((r, idx) => (
                                    <tr key={r.request_id}>
                                      <td><strong>#{idx + 1}</strong></td>
                                      <td><strong style={{ color: 'var(--primary)' }}>{r.medicine_name}</strong></td>
                                      <td><span className="badge low-stock">{r.current_stock} left</span></td>
                                      <td><span className="badge ok">+{r.requested_quantity} units</span></td>
                                      <td>{r.pharmacist_name || 'Dispensary Pharmacist'}</td>
                                      <td>{new Date(r.reorder_date || r.request_date).toLocaleDateString()}</td>
                                      <td>
                                        <div style={{ display: 'flex', gap: '0.45rem' }}>
                                          <button
                                            type="button"
                                            onClick={() => handleReorderAction(r.request_id, 'approve')}
                                            className="btn btn-success btn-sm">
                                            <Check size={13} /> Approve
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleReorderAction(r.request_id, 'reject')}
                                            className="btn btn-danger btn-sm">
                                            <X size={13} /> Reject
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Regulatory Safety Advisory Summary Card */}
                        {(lowStockList.length > 0 || expiredList.length > 0) && (
                          <div className="card" style={{ borderLeft: '4px solid #f59e0b', background: '#fffdfa' }}>
                            <div className="card-header" style={{ background: 'transparent' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertTriangle size={18} color="#d97706" />
                                <strong style={{ color: '#92400e' }}>Active Regulatory Compliance Alerts</strong>
                              </div>
                              <button
                                type="button"
                                onClick={() => openProcureModal(null)}
                                className="btn btn-primary btn-sm">
                                <ShoppingCart size={13} /> Procure Fresh Consignment
                              </button>
                            </div>
                            <div className="card-body" style={{ paddingTop: 0 }}>
                              {lowStockList.length > 0 && (
                                <p style={{ fontSize: '0.85rem', color: '#b45309', marginBottom: '0.5rem' }}>
                                  ⚠️ <strong>{lowStockList.length} medicines</strong> at or below safety limit (≤ 20 units):{' '}
                                  {lowStockList.map((m) => `${m.name} (${m.stock_quantity})`).join(', ')}.
                                </p>
                              )}
                              {expiredList.length > 0 && (
                                <p style={{ fontSize: '0.85rem', color: '#dc2626', margin: 0 }}>
                                  ⛔ <strong>{expiredList.length} medications</strong> expired and blocked from dispensary fulfillment:{' '}
                                  {expiredList.map((m) => m.name).join(', ')}.
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subtab 2: Medicine Formulary & Stock */}
                    {adminStockSubTab === 'inventory' && (
                      <div className="card">
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                          <div>
                            <div className="card-title">Hospital Medicine Inventory & Stock Ledger</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                              Active formulary units, batch safety thresholds, and direct consignment procurement
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div className="filter-bar">
                              <button
                                type="button"
                                onClick={() => setMedicineFilter('all')}
                                className={`filter-chip ${medicineFilter === 'all' ? 'active' : ''}`}>
                                All ({medicines.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicineFilter('ok')}
                                className={`filter-chip ${medicineFilter === 'ok' ? 'active' : ''}`}>
                                In Stock
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicineFilter('low')}
                                className={`filter-chip ${medicineFilter === 'low' ? 'active' : ''}`}>
                                Low Stock ({lowStockList.length})
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedicineFilter('expired')}
                                className={`filter-chip ${medicineFilter === 'expired' ? 'active' : ''}`}>
                                Expired ({expiredList.length})
                              </button>
                            </div>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => openProcureModal(null)}>
                              <ShoppingCart size={13} /> + Procure Stock
                            </button>
                          </div>
                        </div>

                        {/* Live Search Input */}
                        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', background: '#f8fafc' }}>
                          <div style={{ position: 'relative', maxWidth: 360 }}>
                            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                              type="text"
                              value={medicineSearch}
                              onChange={(e) => setMedicineSearch(e.target.value)}
                              placeholder="Filter medicines by name or type..."
                              className="form-input"
                              style={{ paddingLeft: 32, paddingRight: 10, height: 34, fontSize: '0.825rem' }}
                            />
                          </div>
                        </div>

                        <div className="table-responsive">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>#</th>
                                <th>Medicine Name</th>
                                <th>Category</th>
                                <th>Unit Price</th>
                                <th>Current Stock</th>
                                <th>Batch Expiry</th>
                                <th>Stock Status</th>
                                <th>Procurement Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredMeds.length === 0 ? (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No medicines match your filter criteria.
                                  </td>
                                </tr>
                              ) : (
                                filteredMeds.map((m, idx) => {
                                  const isExpired = m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now());
                                  const isLow = !isExpired && (Number(m.stock_quantity) <= 20 || m.status === 'LOW_STOCK');
                                  return (
                                    <tr key={m.medicine_id}>
                                      <td>#{idx + 1}</td>
                                      <td><strong>{m.name}</strong></td>
                                      <td><span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>{m.type}</span></td>
                                      <td>₹{Number(m.price_per_unit || 0).toFixed(2)}</td>
                                      <td>
                                        <span className={`badge ${isExpired ? 'expired' : isLow ? 'low-stock' : 'accepted'}`}>
                                          {m.stock_quantity} units
                                        </span>
                                      </td>
                                      <td style={isExpired ? { color: '#dc2626', fontWeight: 700 } : {}}>
                                        {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '—'}
                                      </td>
                                      <td>
                                        {isExpired ? (
                                          <span className="badge expired">⛔ EXPIRED</span>
                                        ) : isLow ? (
                                          <span className="badge low-stock">⚠️ LOW STOCK</span>
                                        ) : (
                                          <span className="badge accepted">✓ IN STOCK</span>
                                        )}
                                      </td>
                                      <td>
                                        <button
                                          type="button"
                                          className={`btn btn-sm ${isExpired ? 'btn-danger' : 'btn-primary'}`}
                                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                                          onClick={() => openProcureModal(m)}>
                                          <ShoppingCart size={12} /> {isExpired ? 'Replace Batch' : 'Procure Stock'}
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Subtab 3: Inward Procurement Ledger */}
                    {adminStockSubTab === 'procurement' && (
                      <div className="card">
                        <div className="card-header">
                          <div>
                            <div className="card-title">Hospital Medicine Procurement & Inward Stock Ledger</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                              Verified vendor inward records, batch numbers, supplier invoices, and regulatory audit trail
                            </p>
                          </div>
                          <span className="badge accepted">📦 {procurementHistory.length} Inward Consignments</span>
                        </div>
                        <div className="table-responsive">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Consignment #</th>
                                <th>Medicine Name</th>
                                <th>Vendor / Supplier</th>
                                <th>Batch & Invoice</th>
                                <th>Quantity</th>
                                <th>Fresh Expiry</th>
                                <th>Stock Transition</th>
                                <th>Procured By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {procurementHistory.length === 0 ? (
                                <tr>
                                  <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No inward procurement consignments recorded yet.
                                  </td>
                                </tr>
                              ) : (
                                procurementHistory.map((item) => (
                                  <tr key={item.procurement_id}>
                                    <td>
                                      <strong>#{item.procurement_id}</strong>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                                      </div>
                                    </td>
                                    <td><strong>{item.medicine_name}</strong></td>
                                    <td>
                                      <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                                        🏢 {item.supplier_name}
                                      </span>
                                    </td>
                                    <td>
                                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.batch_number}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Inv: {item.invoice_no}</div>
                                    </td>
                                    <td>
                                      <span className="badge ok">+{item.quantity} units</span>
                                    </td>
                                    <td>
                                      <strong style={{ color: '#047857' }}>
                                        {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString() : '—'}
                                      </strong>
                                    </td>
                                    <td>
                                      {Number(item.disposed_expired_units) > 0 ? (
                                        <div>
                                          <span className="badge expired" style={{ fontSize: '0.72rem', marginBottom: 2 }}>
                                            Disposed {item.disposed_expired_units}
                                          </span>
                                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            New: <strong>{item.new_stock} units</strong>
                                          </div>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.82rem' }}>
                                          {item.previous_stock} ➔ <strong>{item.new_stock} units</strong>
                                        </span>
                                      )}
                                    </td>
                                    <td>
                                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                        {item.procured_by || 'Hospital Admin'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Admin Tab 6: Feedbacks Management */}
              {activeTab === 'feedbacks' && (
                <div className="card">
                  <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="card-title">User Reviews & Hospital Feedback</div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>
                        Public & patient ratings submitted across clinical consultations and pharmacy services.
                      </p>
                    </div>
                    <span className="badge paid" style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
                      ⭐ {adminFeedbacks.length} Feedbacks Received
                    </span>
                  </div>

                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Submitter</th>
                          <th>Role</th>
                          <th>Rating</th>
                          <th>Category</th>
                          <th>Feedback Comments</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminFeedbacks.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                              No user feedbacks recorded yet.
                            </td>
                          </tr>
                        ) : (
                          adminFeedbacks.map((f, idx) => (
                            <tr key={f.feedback_id || idx}>
                              <td>#{idx + 1}</td>
                              <td><strong>{f.user_name || 'Anonymous'}</strong></td>
                              <td>
                                <span className={`badge ${f.user_role === 'patient' ? 'accepted' : f.user_role === 'doctor' ? 'completed' : 'pending'}`}>
                                  {f.user_role}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 2, color: '#f59e0b' }}>
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      size={14}
                                      fill={s <= f.rating ? '#f59e0b' : 'none'}
                                      color={s <= f.rating ? '#f59e0b' : '#cbd5e1'}
                                    />
                                  ))}
                                </div>
                              </td>
                              <td><span className="badge" style={{ background: '#f1f5f9', color: '#334155', fontWeight: 600 }}>{f.category}</span></td>
                              <td style={{ maxWidth: 360, whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: 1.4 }}>
                                {f.message}
                              </td>
                              <td style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                                {new Date(f.created_at).toLocaleDateString()}
                              </td>
                              <td>
                                <button
                                  onClick={() => handleDeleteFeedback(f.feedback_id)}
                                  className="btn btn-danger btn-sm"
                                  title="Delete Feedback Record">
                                  <Trash2 size={14} /> Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 2. DOCTOR DASHBOARD                                               */}
          {/* ================================================================= */}
          {user.role === 'doctor' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Doctor Clinical Suite</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  {formatDoctorName(user.name)} — Consultation Schedule, Prescriptions History & Referrals
                </p>
              </div>

              {/* Doctor Suite Navigation Tabs */}
              <div className="tabs-nav">
                <button
                  className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('appointments')}>
                  <Calendar size={18} /> Consultations Schedule ({doctorAppointments.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`}
                  onClick={() => setActiveTab('prescriptions')}>
                  <Pill size={18} /> Issued Prescriptions History ({doctorPrescriptions.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`}
                  onClick={() => setActiveTab('referrals')}>
                  <ArrowRight size={18} /> Specialist Outgoing Referrals ({doctorReferrals.length})
                </button>
              </div>

              {/* Tab 1: Consultations Schedule */}
              {activeTab === 'appointments' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Patient Consultations Schedule</div>
                    <span className="badge accepted">{doctorAppointments.length} Appointments</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Patient Name</th>
                          <th>Gender / Age</th>
                          <th>Contact</th>
                          <th>Date & Time</th>
                          <th>Diagnosis / Symptoms</th>
                          <th>Status</th>
                          <th>Clinical Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                              No patient appointments assigned today.
                            </td>
                          </tr>
                        ) : (
                          doctorAppointments.map((a, idx) => (
                            <tr key={a.appointment_id}>
                              <td>#{idx + 1}</td>
                              <td><strong>{a.patient_name}</strong></td>
                              <td>
                                {a.gender || '—'} {a.dob ? <strong style={{ color: 'var(--primary)', marginLeft: 4 }}>({calculateAge(a.dob)})</strong> : ''}
                              </td>
                              <td>{a.contact_no}</td>
                              <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                              <td>{a.diagnosis}</td>
                              <td>
                                <span className={`badge ${a.status?.toLowerCase().includes('pending') ? 'pending' : a.status?.toLowerCase().includes('accept') ? 'accepted' : 'completed'}`}>
                                  {a.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                  {a.status?.toLowerCase().includes('pending') ? (
                                    <>
                                      <button onClick={() => handleUpdateStatus(a.appointment_id, 'Accepted')} className="btn btn-success btn-sm">
                                        <Check size={13} /> Accept
                                      </button>
                                      <button onClick={() => setReferralModal({ open: true, appointment: a })} className="btn btn-secondary btn-sm">
                                        <ArrowRight size={13} /> Refer
                                      </button>
                                    </>
                                  ) : a.status?.toLowerCase().includes('complete') ? (
                                    <>
                                      <span className="badge completed" style={{ fontSize: '0.78rem' }}>
                                        ✓ Completed
                                      </span>
                                      <button onClick={() => setReferralModal({ open: true, appointment: a })} className="btn btn-secondary btn-sm">
                                        <ArrowRight size={13} /> Refer
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button onClick={() => setPrescriptionModal({ open: true, appointment: a })} className="btn btn-primary btn-sm">
                                        <Pill size={13} /> Prescribe
                                      </button>
                                      <button onClick={() => setReferralModal({ open: true, appointment: a })} className="btn btn-secondary btn-sm">
                                        <ArrowRight size={13} /> Refer
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 2: Issued Prescriptions History */}
              {activeTab === 'prescriptions' && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Issued Doctor Prescriptions & Medication History</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Complete clinical audit of medicines prescribed by {formatDoctorName(user.name)}
                      </p>
                    </div>
                    <span className="badge completed">{doctorPrescriptions.length} Prescriptions Recorded</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Patient Name</th>
                          <th>Age / Gender</th>
                          <th>Contact</th>
                          <th>Diagnosis / Condition</th>
                          <th>Medicine & Dosage</th>
                          <th>Qty & Duration</th>
                          <th>Prescribed Date</th>
                          <th>Dispensary Status</th>
                          <th>Doctor Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorPrescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={10} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                              No prescription history recorded yet. Prescribe medication for an appointment to see history here.
                            </td>
                          </tr>
                        ) : (
                          doctorPrescriptions.map((p, idx) => (
                            <tr key={p.prescribed_id}>
                              <td>#{idx + 1}</td>
                              <td><strong>{p.patient_name}</strong></td>
                              <td>
                                {p.patient_gender || '—'} {p.patient_dob ? <strong style={{ color: 'var(--primary)', marginLeft: 3 }}>({calculateAge(p.patient_dob)})</strong> : ''}
                              </td>
                              <td>{p.patient_contact || '—'}</td>
                              <td>
                                <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}>
                                  🩺 {p.diagnosis || 'Clinical Assessment'}
                                </span>
                              </td>
                              <td>
                                <div>
                                  <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{p.medicine_name}</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Dosage: {p.dosage || '1-0-1'}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div>
                                  <strong>{p.quantity} units</strong>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Duration: {p.duration || '5 days'}
                                  </div>
                                </div>
                              </td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                {new Date(p.prescription_date).toLocaleDateString()}
                              </td>
                              <td>
                                <span className={`badge ${p.dispense_status === 'Dispensed' ? 'accepted' : 'pending'}`}>
                                  {p.dispense_status === 'Dispensed' ? '✓ Dispensed' : '⏳ Pending Pharmacy'}
                                </span>
                              </td>
                              <td style={{ maxWidth: 220, fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                "{p.doctor_notes || 'Take as prescribed'}"
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tab 3: Outgoing Specialist Referrals History */}
              {activeTab === 'referrals' && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Outgoing Specialist Patient Referrals Ledger</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Audit log of patients referred to other department specialists with dates and clinical justifications
                      </p>
                    </div>
                    <span className="badge accepted">{doctorReferrals.length} Referrals Tracked</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Patient Name</th>
                          <th>Age / Gender</th>
                          <th>Contact</th>
                          <th>Referred Specialist Doctor</th>
                          <th>Specialization</th>
                          <th>Consult Fee</th>
                          <th>Referral Date</th>
                          <th>Clinical Reason / Why Referred</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctorReferrals.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                              No outgoing specialist referrals made yet.
                            </td>
                          </tr>
                        ) : (
                          doctorReferrals.map((r, idx) => (
                            <tr key={r.refer_id}>
                              <td>#{idx + 1}</td>
                              <td><strong>{r.patient_name}</strong></td>
                              <td>
                                {r.patient_gender || '—'} {r.patient_dob ? <strong style={{ color: 'var(--primary)', marginLeft: 3 }}>({calculateAge(r.patient_dob)})</strong> : ''}
                              </td>
                              <td>{r.patient_contact || '—'}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <ArrowRight size={14} color="#0284c7" />
                                  <div>
                                    <strong>{formatDoctorName(r.to_doctor_name)}</strong>
                                    {r.to_doctor_contact && (
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Ph: {r.to_doctor_contact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="badge" style={{ background: '#f0fdf4', color: '#166534', fontWeight: 700 }}>
                                  {r.to_doctor_specialization || 'Specialist'}
                                </span>
                              </td>
                              <td>₹{Number(r.to_doctor_fee || 0).toFixed(2)}</td>
                              <td style={{ whiteSpace: 'nowrap' }}>
                                {new Date(r.refer_date).toLocaleDateString()}
                              </td>
                              <td style={{ maxWidth: 280 }}>
                                <div style={{ background: '#f8fafc', padding: '0.4rem 0.65rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#0f172a', lineHeight: 1.4 }}>
                                  "{r.reason || 'Specialist Evaluation & Consultation'}"
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 3. PATIENT DASHBOARD                                              */}
          {/* ================================================================= */}
          {user.role === 'patient' && (
            <div>
              <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Patient Portal</h1>
                <p style={{ color: 'var(--text-muted)' }}>
                  Welcome {user.name} — Medical Appointments, Prescriptions & Invoices
                </p>
              </div>

              {/* Patient Navigation Tabs */}
              <div className="tabs-nav">
                <button className={`tab-btn ${activeTab === 'doctors' ? 'active' : ''}`} onClick={() => setActiveTab('doctors')}>
                  <Search size={18} /> Find Doctors & Book
                </button>
                <button className={`tab-btn ${activeTab === 'appointments' ? 'active' : ''}`} onClick={() => setActiveTab('appointments')}>
                  <Calendar size={18} /> My Appointments ({patientAppointments.length})
                </button>
                <button className={`tab-btn ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
                  <Pill size={18} /> My Prescriptions ({patientPrescriptions.length})
                </button>
                <button className={`tab-btn ${activeTab === 'referrals' ? 'active' : ''}`} onClick={() => setActiveTab('referrals')}>
                  <ArrowRight size={18} /> Specialist Referrals ({patientReferrals.length})
                </button>
                <button className={`tab-btn ${activeTab === 'bills' ? 'active' : ''}`} onClick={() => setActiveTab('bills')}>
                  <CreditCard size={18} /> Hospital Bills & Payments ({patientBills.length})
                </button>
              </div>

              {/* Patient Tab 1: Find Doctors */}
              {activeTab === 'doctors' && (
                <div className="doctor-cards-grid">
                  {patientDoctors.map((doc, idx) => (
                    <div key={doc.doctor_id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary)', display: 'grid', placeItems: 'center' }}>
                            <Stethoscope size={24} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span className="badge" style={{ fontSize: '0.72rem', padding: '0.15rem 0.45rem', background: '#e0e7ff', color: '#4338ca', fontWeight: 700 }}>#{idx + 1}</span>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{formatDoctorName(doc.name)}</h3>
                            </div>
                            <span className="badge accepted">{doc.specialization}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                          <Phone size={14} style={{ display: 'inline', marginRight: 6 }} /> {doc.contact_no}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                          <Mail size={14} style={{ display: 'inline', marginRight: 6 }} /> {doc.email}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CONSULTATION FEE</div>
                          <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>₹{Number(doc.fee ?? doc.fees ?? 0).toLocaleString('en-IN')}</strong>
                        </div>
                        <button onClick={() => setBookModal({ open: true, doctor: doc })} className="btn btn-primary btn-sm">
                          <Calendar size={14} /> Book Appointment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Patient Tab 2: Appointments */}
              {activeTab === 'appointments' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">My Scheduled Consultations</div>
                    <span className="badge accepted">{patientAppointments.length} Visits</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Doctor</th>
                          <th>Specialization</th>
                          <th>Date</th>
                          <th>Diagnosis</th>
                          <th>Consult Fee</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientAppointments.map((a, idx) => (
                          <tr key={a.appointment_id}>
                            <td>#{idx + 1}</td>
                            <td><strong>{formatDoctorName(a.doctor_name)}</strong></td>
                            <td><span className="badge accepted">{a.specialization}</span></td>
                            <td>{new Date(a.appointment_date).toLocaleDateString()}</td>
                            <td>{a.diagnosis}</td>
                            <td>₹{Number(a.fee ?? a.fees ?? 0).toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge ${a.status?.toLowerCase().includes('pending') ? 'pending' : a.status?.toLowerCase().includes('accept') ? 'accepted' : 'completed'}`}>
                                {a.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Patient Tab 3: Prescriptions */}
              {activeTab === 'prescriptions' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Doctor Issued Clinical Prescriptions</div>
                    <span className="badge completed">{patientPrescriptions.length} Records</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>RX #</th>
                          <th>Doctor</th>
                          <th>Diagnosis</th>
                          <th>Notes / Instructions</th>
                          <th>Date Issued</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientPrescriptions.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                              No medical prescriptions issued yet.
                            </td>
                          </tr>
                        ) : (
                          patientPrescriptions.map((p, idx) => (
                            <tr key={p.prescription_id}>
                              <td>#{idx + 1}</td>
                              <td><strong>{formatDoctorName(p.doctor_name)}</strong></td>
                              <td>{p.diagnosis}</td>
                              <td>{p.notes || 'As prescribed by physician'}</td>
                              <td>{new Date(p.prescription_date).toLocaleDateString()}</td>
                              <td><span className="badge completed"><Check size={12} /> Issued</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Patient Tab 4: Referrals */}
              {activeTab === 'referrals' && (
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Specialist Medical Referrals</div>
                    <span className="badge referred">{patientReferrals.length} Referrals</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Referral #</th>
                          <th>Referred By</th>
                          <th>Referred To Specialist</th>
                          <th>Specialty</th>
                          <th>Reason</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientReferrals.map((r, idx) => (
                          <tr key={r.refer_id}>
                            <td>#{idx + 1}</td>
                            <td>{formatDoctorName(r.referred_by_name || r.from_doctor)}</td>
                            <td><strong>{formatDoctorName(r.referred_to_name || r.to_doctor)}</strong></td>
                            <td><span className="badge accepted">{r.referred_to_specialty || r.to_specialization}</span></td>
                            <td>{r.reason}</td>
                            <td>{new Date(r.refer_date || r.referral_date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Patient Tab 5: Hospital Bills */}
              {activeTab === 'bills' && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Hospital Invoices & Official Payment Receipts</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        View itemized medical invoices and print official NABH hospital tax receipts for settled bills
                      </p>
                    </div>
                    <span className="badge paid">{patientBills.length} Invoices</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Invoice #</th>
                          <th>Doctor Consult Fee</th>
                          <th>Medicine Costs</th>
                          <th>Total Amount</th>
                          <th>Payment Status</th>
                          <th>Payment Mode</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patientBills.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                              No medical bills or invoices issued yet.
                            </td>
                          </tr>
                        ) : (
                          patientBills.map((b, idx) => (
                            <tr key={b.bill_id}>
                              <td>
                                <strong>INV-2026-{String(b.bill_id).padStart(4, '0')}</strong>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {new Date(b.bill_date || Date.now()).toLocaleDateString()}
                                </div>
                              </td>
                              <td>₹{Number(b.doctor_fee).toFixed(2)}</td>
                              <td>₹{Number(b.total_medicine_cost).toFixed(2)}</td>
                              <td><strong style={{ color: '#16a34a', fontSize: '1.05rem' }}>₹{Number(b.total_amount).toFixed(2)}</strong></td>
                              <td>
                                <span className={`badge ${b.payment_status?.toLowerCase()}`}>
                                  {b.payment_status}
                                </span>
                              </td>
                              <td>{b.payment_mode || '—'}</td>
                              <td>
                                {b.payment_status === 'Unpaid' || b.payment_status === 'Pending' ? (
                                  <button onClick={() => setPayModal({ open: true, bill: b })} className="btn btn-primary btn-sm">
                                    <CreditCard size={14} /> Settle Bill
                                  </button>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span className="badge paid"><Check size={12} /> Settled</span>
                                    <button
                                      onClick={() => setReceiptModal({ open: true, bill: b })}
                                      className="btn btn-secondary btn-sm"
                                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                                      <Printer size={13} /> View & Print Receipt
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* 4. PHARMACIST DASHBOARD                                           */}
          {/* ================================================================= */}
          {user.role === 'pharmacist' && (
            <div>
              <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Hospital Pharmacy Dispensary</h1>
                  <p style={{ color: 'var(--text-muted)' }}>
                    Pharmacist {user.name} — Prescription Dispensation & Drug Inventory
                  </p>
                </div>
                <button onClick={() => setReorderModal(true)} className="btn btn-primary btn-sm">
                  <ShoppingCart size={16} /> Request Restock
                </button>
              </div>

              <div className="tabs-nav">
                <button className={`tab-btn ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
                  <Clock size={18} /> Dispense Queue ({pendingPrescriptions.length})
                </button>
                <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                  <Pill size={18} /> Drug Inventory ({inventoryList.length})
                </button>
              </div>

              {/* Pharmacist Dispensary Health Strip */}
              {(() => {
                const expiredMeds = (inventoryList || []).filter(
                  (m) => m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now())
                );
                const lowMeds = (inventoryList || []).filter(
                  (m) => (Number(m.stock_quantity) <= 20 || m.status === 'LOW_STOCK') &&
                         !(m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now()))
                );

                return (
                  <div>
                    {/* Compact Dispensary Metric Strip */}
                    <div className="metric-strip">
                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Prescription Queue</div>
                          <div className="val" style={{ color: 'var(--primary)' }}>
                            {pendingPrescriptions.length} Orders
                          </div>
                        </div>
                        <span className="badge pending">Awaiting Fulfillment</span>
                      </div>

                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Low Stock Warnings</div>
                          <div className="val" style={{ color: lowMeds.length > 0 ? '#d97706' : '#15803d' }}>
                            {lowMeds.length} Items
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReorderModal(true)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                          <ShoppingCart size={12} /> Restock
                        </button>
                      </div>

                      <div className="metric-pill-card">
                        <div>
                          <div className="label">Safety Expiry Gate</div>
                          <div className="val" style={{ color: expiredMeds.length > 0 ? '#dc2626' : '#15803d' }}>
                            {expiredMeds.length > 0 ? `${expiredMeds.length} Blocked` : 'All Safe'}
                          </div>
                        </div>
                        <span className={`badge ${expiredMeds.length > 0 ? 'expired' : 'ok'}`}>
                          {expiredMeds.length > 0 ? 'Dispense Blocked' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Pharmacist Dispense Queue Table */}
              {activeTab === 'queue' && (() => {
                const filteredQueue = pendingPrescriptions.filter((p) => {
                  const isExp = p.expiry_date && new Date(p.expiry_date).getTime() < Date.now();
                  const isShort = Number(p.current_stock || 0) < Number(p.quantity || 0);
                  if (queueFilter === 'ready' && (isExp || isShort)) return false;
                  if (queueFilter === 'short' && !isShort) return false;
                  if (queueFilter === 'expired' && !isExp) return false;
                  return true;
                });

                return (
                  <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div className="card-title">Doctor Prescriptions Dispense Queue</div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Verify patient medical details, deduct stock inventory, and generate pharmacy discharge invoice
                        </p>
                      </div>

                      {/* Queue Filter Bar */}
                      <div className="filter-bar">
                        <button
                          type="button"
                          onClick={() => setQueueFilter('all')}
                          className={`filter-chip ${queueFilter === 'all' ? 'active' : ''}`}>
                          All Orders ({pendingPrescriptions.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter('ready')}
                          className={`filter-chip ${queueFilter === 'ready' ? 'active' : ''}`}>
                          ✓ Ready to Dispense
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueueFilter('short')}
                          className={`filter-chip ${queueFilter === 'short' ? 'active' : ''}`}>
                          ⚠️ Short Stock
                        </button>
                      </div>
                    </div>

                    <div className="table-responsive">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Patient Information</th>
                            <th>Prescribing Doctor</th>
                            <th>Diagnosed Illness</th>
                            <th>Prescribed Medication</th>
                            <th>Dispensary Stock</th>
                            <th>Clinical Fulfillment</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQueue.length === 0 ? (
                            <tr>
                              <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                  <CheckCircle2 size={32} color="#16a34a" />
                                  <strong style={{ color: 'var(--text-main)' }}>No Pending Prescriptions</strong>
                                  <span style={{ fontSize: '0.85rem' }}>All doctor prescriptions for this filter have been verified and dispensed.</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            filteredQueue.map((p, idx) => {
                              const isExp = p.expiry_date && new Date(p.expiry_date).getTime() < Date.now();
                              const isShort = Number(p.current_stock || 0) < Number(p.quantity || 0);
                              const isLow = !isShort && Number(p.current_stock || 0) <= 20;

                              return (
                                <tr key={p.prescribed_id}>
                                  <td><strong>#{idx + 1}</strong></td>
                                  <td>
                                    <strong>{p.patient_name}</strong>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                      {p.patient_gender || '—'} {p.patient_dob ? `(${calculateAge(p.patient_dob)})` : ''}
                                    </div>
                                  </td>
                                  <td>
                                    <div>
                                      <strong>{formatDoctorName(p.doctor_name)}</strong>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {p.specialization || 'Specialist'}
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1' }}>
                                      🩺 {p.diagnosis || 'Clinical Visit'}
                                    </span>
                                  </td>
                                  <td>
                                    <div>
                                      <strong style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>{p.medicine_name}</strong>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        <strong>{p.quantity} units</strong> • {p.dosage || 'Standard dose'} ({p.instructions || 'After meals'})
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    {isExp ? (
                                      <span className="badge expired">⛔ EXPIRED</span>
                                    ) : isShort ? (
                                      <span className="badge low-stock">⚠️ Short ({p.current_stock ?? 0} left)</span>
                                    ) : isLow ? (
                                      <span className="badge low-stock">⚠️ Low ({p.current_stock} left)</span>
                                    ) : (
                                      <span className="badge accepted">✓ {p.current_stock} in stock</span>
                                    )}
                                  </td>
                                  <td>
                                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                                      {isExp ? (
                                        <button
                                          type="button"
                                          disabled
                                          className="btn btn-danger btn-sm"
                                          style={{ opacity: 0.65, cursor: 'not-allowed' }}>
                                          ⛔ Blocked
                                        </button>
                                      ) : isShort ? (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setReorderForm({
                                              medicine_id: p.medicine_id || '',
                                              requested_quantity: Math.max(50, Number(p.quantity) - Number(p.current_stock || 0) + 50)
                                            });
                                            setReorderModal(true);
                                          }}
                                          className="btn btn-secondary btn-sm"
                                          style={{ borderColor: '#f59e0b', color: '#b45309' }}>
                                          <ShoppingCart size={12} /> Restock
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => handleDispense(p.prescribed_id, p.quantity, p.current_stock, p.expiry_date, p.medicine_name)}
                                          className="btn btn-success btn-sm">
                                          <Check size={13} /> Dispense
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setVerifyRxModal({ open: true, rx: p });
                                          setVerifyDispenseQty(p.quantity || 1);
                                          setVerifyDispenseMedId(p.medicine_id || '');
                                        }}
                                        className="btn btn-secondary btn-sm"
                                        title="Verify full clinical prescription & batch details">
                                        <Eye size={13} /> Verify Rx
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {activeTab === 'inventory' && (
                <div className="card">
                  <div className="card-header">
                    <div>
                      <div className="card-title">Pharmacy Medication Stock Ledger</div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Live medication units, batch expiration monitoring & real-time safety status
                      </p>
                    </div>
                    <span className="badge completed">{inventoryList.length} Drugs Active</span>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Drug #</th>
                          <th>Medicine Name</th>
                          <th>Category</th>
                          <th>Unit Price</th>
                          <th>Stock Units</th>
                          <th>Expiry Date</th>
                          <th>Stock Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryList.map((m, idx) => {
                          const isExpired = m.status === 'EXPIRED' || (m.expiry_date && new Date(m.expiry_date).getTime() < Date.now());
                          const isLow = !isExpired && (Number(m.stock_quantity) <= 20 || m.status === 'LOW_STOCK');

                          return (
                            <tr key={m.medicine_id}>
                              <td>#{idx + 1}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
                                  <strong>{m.name}</strong>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReorderForm({
                                        medicine_id: m.medicine_id,
                                        requested_quantity: 50,
                                      });
                                      setReorderModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                    title={`Raise restock replenishment request for ${m.name}`}>
                                    <ShoppingCart size={11} /> Raise Request
                                  </button>
                                </div>
                              </td>
                              <td>{m.type}</td>
                              <td>₹{Number(m.price_per_unit).toFixed(2)}</td>
                              <td>
                                <span
                                  className={`badge ${isExpired ? 'expired' : isLow ? 'low-stock' : 'accepted'}`}
                                  style={isExpired ? { fontWeight: 800, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca' } : isLow ? { fontWeight: 800, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca' } : {}}>
                                  {m.stock_quantity} units
                                </span>
                              </td>
                              <td style={isExpired ? { color: '#dc2626', fontWeight: 700 } : {}}>
                                {m.expiry_date ? new Date(m.expiry_date).toLocaleDateString() : '—'}
                              </td>
                              <td>
                                {isExpired ? (
                                  <span className="badge" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', fontWeight: 800 }}>
                                    ⛔ EXPIRED
                                  </span>
                                ) : isLow ? (
                                  <span className="badge low-stock" style={{ fontWeight: 800 }}>
                                    ⚠️ LOW STOCK
                                  </span>
                                ) : (
                                  <span className="badge accepted">
                                    ✓ OK
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* ===================================================================== */}
      {/*                               MODALS                                  */}
      {/* ===================================================================== */}

      {/* Admin: Procure Medicine Consignment Modal */}
      {procureModal.open && (
        <div className="modal-overlay" onClick={() => setProcureModal({ open: false, medicine: null })}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingCart className="text-primary" size={24} />
                <div>
                  <div className="card-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                    {procureModal.medicine ? `Procure Stock: ${procureModal.medicine.name}` : 'Procure Inward Consignment'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Receive fresh pharmaceutical consignment & update stock ledger
                  </div>
                </div>
              </div>
              <button onClick={() => setProcureModal({ open: false, medicine: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleProcureSubmit}>
              <div className="modal-body">
                {/* Medicine details or selector */}
                <div className="form-group">
                  <label className="form-label">Medicine Item</label>
                  {procureModal.medicine ? (
                    <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{procureModal.medicine.name}</strong>{' '}
                          <span className="badge" style={{ background: '#e2e8f0', color: '#475569', fontSize: '0.75rem' }}>
                            {procureModal.medicine.type}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Current Units: <strong>{procureModal.medicine.stock_quantity}</strong>
                        </span>
                      </div>
                      {/* Notice if currently expired */}
                      {Boolean(procureModal.medicine.expiry_date && new Date(procureModal.medicine.expiry_date).getTime() < Date.now()) && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: '#b91c1c', background: '#fef2f2', padding: '0.5rem 0.65rem', borderRadius: '6px', border: '1px solid #fecaca', display: 'flex', gap: '6px' }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          <div>
                            <strong>Expired Batch Replacement Notice:</strong> Current stock of {procureModal.medicine.stock_quantity} units is expired (Expiry: {new Date(procureModal.medicine.expiry_date).toLocaleDateString()}). Confirming this consignment will safely write off/dispose the expired stock and restock with this fresh batch and new future expiry date!
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      required
                      value={procureForm.medicine_id || ''}
                      onChange={(e) => {
                        const mid = Number(e.target.value);
                        const selectedMed = (stockCompliance?.medicines || []).find((m) => m.medicine_id === mid);
                        setProcureModal({ open: true, medicine: selectedMed || null });
                        setProcureForm({
                          ...procureForm,
                          medicine_id: mid,
                          unit_price: selectedMed?.price_per_unit || '',
                        });
                      }}
                    >
                      <option value="">-- Choose Medicine from Dispensary List --</option>
                      {(stockCompliance?.medicines || []).map((m) => (
                        <option key={m.medicine_id} value={m.medicine_id}>
                          {m.name} ({m.type}) - Current: {m.stock_quantity} units
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pharmaceutical Supplier / Distributor */}
                <div className="form-group">
                  <label className="form-label">Pharmaceutical Supplier / Distributor</label>
                  <select
                    className="form-select"
                    value={procureForm.supplier_name}
                    onChange={(e) => setProcureForm({ ...procureForm, supplier_name: e.target.value })}
                  >
                    <option value="Sun Pharma Distributors">Sun Pharma Distributors</option>
                    <option value="Cipla Global Healthcare">Cipla Global Healthcare</option>
                    <option value="Mankind Pharma Ltd.">Mankind Pharma Ltd.</option>
                    <option value="Apex Healthcare Supplies">Apex Healthcare Supplies</option>
                    <option value="MedSource Lifeline Wholesale">MedSource Lifeline Wholesale</option>
                    <option value="Zydus Cadila Healthcare">Zydus Cadila Healthcare</option>
                    <option value="Torrent Pharmaceuticals">Torrent Pharmaceuticals</option>
                    <option value="Abbott Healthcare India">Abbott Healthcare India</option>
                  </select>
                </div>

                {/* Batch Number & Invoice No */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Consignment / Batch #</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={procureForm.batch_number}
                      onChange={(e) => setProcureForm({ ...procureForm, batch_number: e.target.value })}
                      placeholder="e.g. BATCH-8921"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vendor Invoice / Chalan Ref</label>
                    <input
                      type="text"
                      className="form-input"
                      value={procureForm.invoice_no}
                      onChange={(e) => setProcureForm({ ...procureForm, invoice_no: e.target.value })}
                      placeholder="e.g. INV-38491"
                    />
                  </div>
                </div>

                {/* Quantity to Procure & Quick Presets */}
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Fresh Units to Receive</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[25, 50, 100, 200].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.15rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setProcureForm({ ...procureForm, quantity: preset })}
                        >
                          +{preset}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    required
                    value={procureForm.quantity}
                    onChange={(e) => setProcureForm({ ...procureForm, quantity: e.target.value })}
                    placeholder="e.g. 50"
                  />
                </div>

                {/* Expiry Date of New Batch (must be future) */}
                <div className="form-group">
                  <label className="form-label">New Consignment Expiry Date (Valid Future Date)</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    min={new Date().toISOString().split('T')[0]}
                    value={procureForm.expiry_date}
                    onChange={(e) => setProcureForm({ ...procureForm, expiry_date: e.target.value })}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    📅 Fresh stock expiry must be a valid future date (typically 1 to 3 years from today).
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setProcureModal({ open: false, medicine: null })} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={procureLoading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingCart size={15} />
                  {procureLoading ? 'Receiving Consignment...' : 'Confirm Inward Stock & Update Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {bookModal.open && (
        <div className="modal-overlay" onClick={() => setBookModal({ open: false, doctor: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Book Consultation with {formatDoctorName(bookModal.doctor?.name)}</div>
              <button onClick={() => setBookModal({ open: false, doctor: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleBookSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Preferred Date & Time (Future Slot)</label>
                  <input
                    type="datetime-local"
                    required
                    min={getMinBookingDateTime()}
                    className="form-input"
                    value={bookForm.appointment_date}
                    onChange={(e) => setBookForm({ ...bookForm, appointment_date: e.target.value })}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    ⏰ Please select an upcoming date and time for consultation (past dates are disabled).
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Symptoms / Reason for Appointment</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    placeholder="Describe symptoms, duration or relevant history (min 3 chars)..."
                    value={bookForm.diagnosis}
                    onChange={(e) => setBookForm({ ...bookForm, diagnosis: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setBookModal({ open: false, doctor: null })} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Confirm Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescription Modal (Doctor) */}
      {prescriptionModal.open && (
        <div className="modal-overlay" onClick={() => setPrescriptionModal({ open: false, appointment: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Digital E-Prescription for {prescriptionModal.appointment?.patient_name}</div>
              <button onClick={() => setPrescriptionModal({ open: false, appointment: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handlePrescribeSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Drug to Dispense</label>
                  <select
                    className="form-select"
                    required
                    value={prescriptionForm.medicine_id}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicine_id: e.target.value })}>
                    <option value="">-- Choose Medicine --</option>
                    {availableMedicines.map((m) => (
                      <option key={m.medicine_id} value={m.medicine_id}>
                        {m.name} ({m.type}) — ${m.price_per_unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Dosage Pattern</label>
                    <input
                      type="text"
                      required
                      className="form-input"
                      value={prescriptionForm.dosage_pattern}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage_pattern: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Days)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={30}
                      className="form-input"
                      value={prescriptionForm.duration_days}
                      onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration_days: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Physician Notes & Instructions</label>
                  <textarea
                    rows={2}
                    className="form-textarea"
                    placeholder="e.g. Take after breakfast and dinner with plenty of water"
                    value={prescriptionForm.notes}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setPrescriptionModal({ open: false, appointment: null })} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Transmit Prescription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Modal (Doctor) */}
      {referralModal.open && (
        <div className="modal-overlay" onClick={() => setReferralModal({ open: false, appointment: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Refer {referralModal.appointment?.patient_name} to Specialist</div>
              <button onClick={() => setReferralModal({ open: false, appointment: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleReferralSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Specialist Doctor</label>
                  <select
                    className="form-select"
                    required
                    value={referralForm.referred_to_doctor_id}
                    onChange={(e) => setReferralForm({ ...referralForm, referred_to_doctor_id: e.target.value })}>
                    <option value="">-- Choose Specialist Doctor --</option>
                    {doctorsList
                      .filter((d) => d.doctor_id !== user.id)
                      .map((d) => (
                        <option key={d.doctor_id} value={d.doctor_id}>
                          {formatDoctorName(d.name)} — {d.specialization}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Clinical Justification & Notes</label>
                  <textarea
                    rows={3}
                    required
                    className="form-textarea"
                    placeholder="Explain clinical reason for specialty referral..."
                    value={referralForm.reason}
                    onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setReferralModal({ open: false, appointment: null })} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={referralSubmitting} className="btn btn-primary">
                  {referralSubmitting ? 'Creating Referral...' : 'Create Referral'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Bill Modal (Patient) */}
      {payModal.open && payModal.bill && (
        <div className="modal-overlay" onClick={() => setPayModal({ open: false, bill: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="card-title">Pay Hospital Invoice #{payModal.bill.bill_id}</div>
              <button onClick={() => setPayModal({ open: false, bill: null })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handlePayBillSubmit}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: 12, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Doctor Consultation Fee:</span>
                    <strong>₹{payModal.bill.doctor_fee}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pharmacy Medication:</span>
                    <strong>₹{payModal.bill.total_medicine_cost}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, fontSize: '1.15rem' }}>
                    <span style={{ fontWeight: 800 }}>Total Amount Due:</span>
                    <strong style={{ color: '#16a34a' }}>₹{payModal.bill.total_amount}</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Choose Payment Method</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                    {['UPI', 'Card', 'Cash'].map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setPayMethod(m)}
                        style={{
                          padding: '0.75rem 0.5rem',
                          borderRadius: 8,
                          border: `2px solid ${payMethod === m ? 'var(--primary)' : 'var(--border)'}`,
                          background: payMethod === m ? 'var(--primary-light)' : 'white',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          color: payMethod === m ? 'var(--primary)' : 'inherit'
                        }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setPayModal({ open: false, bill: null })} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-success">
                  <CreditCard size={16} /> Pay ${payModal.bill.total_amount} via {payMethod}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Doctor Modal (Admin) */}
      {addDoctorModal && (
        <div className="modal-overlay" onClick={() => setAddDoctorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Onboard New Medical Doctor</div>
              <button onClick={() => setAddDoctorModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDoctor}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Doctor Name</label>
                  <input
                    type="text"
                    required
                    className={`form-input ${docErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Anand Sharma"
                    value={newDoctor.name}
                    onChange={(e) => {
                      setNewDoctor({ ...newDoctor, name: e.target.value });
                      if (docErrors.name) setDocErrors((prev) => ({ ...prev, name: '' }));
                    }}
                  />
                  {docErrors.name && <div className="field-error-msg"><AlertCircle size={13} /> {docErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization</label>
                  <select className="form-select" value={newDoctor.specialization} onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}>
                    <option value="Cardiologist">Cardiologist</option>
                    <option value="Neurologist">Neurologist</option>
                    <option value="Orthopedic Surgeon">Orthopedic Surgeon</option>
                    <option value="Dermatologist">Dermatologist</option>
                    <option value="Ophthalmologist">Ophthalmologist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Contact Phone</label>
                    <input
                      type="tel"
                      required
                      className={`form-input ${docErrors.contact_no ? 'input-error' : ''}`}
                      placeholder="9876543210"
                      maxLength={10}
                      value={newDoctor.contact_no}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setNewDoctor({ ...newDoctor, contact_no: val });
                        if (docErrors.contact_no) setDocErrors((prev) => ({ ...prev, contact_no: '' }));
                      }}
                    />
                    {docErrors.contact_no && <div className="field-error-msg"><AlertCircle size={13} /> {docErrors.contact_no}</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      className={`form-input ${docErrors.fee ? 'input-error' : ''}`}
                      value={newDoctor.fee}
                      onChange={(e) => {
                        setNewDoctor({ ...newDoctor, fee: Number(e.target.value) });
                        if (docErrors.fee) setDocErrors((prev) => ({ ...prev, fee: '' }));
                      }}
                    />
                    {docErrors.fee && <div className="field-error-msg"><AlertCircle size={13} /> {docErrors.fee}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor Login Email</label>
                  <input
                    type="email"
                    required
                    className={`form-input ${docErrors.email ? 'input-error' : ''}`}
                    placeholder="doctor@hospital.com"
                    value={newDoctor.email}
                    onChange={(e) => {
                      setNewDoctor({ ...newDoctor, email: e.target.value });
                      if (docErrors.email) setDocErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                  {docErrors.email && <div className="field-error-msg"><AlertCircle size={13} /> {docErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Account Password</label>
                  <input
                    type="password"
                    minLength={6}
                    className={`form-input ${docErrors.password ? 'input-error' : ''}`}
                    placeholder="Default: doctor123 (min 6 chars)"
                    value={newDoctor.password}
                    onChange={(e) => {
                      setNewDoctor({ ...newDoctor, password: e.target.value });
                      if (docErrors.password) setDocErrors((prev) => ({ ...prev, password: '' }));
                    }}
                  />
                  {docErrors.password && <div className="field-error-msg"><AlertCircle size={13} /> {docErrors.password}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAddDoctorModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Doctor Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pharmacist Modal (Admin) */}
      {addPharmacistModal && (
        <div className="modal-overlay" onClick={() => setAddPharmacistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Register Licensed Pharmacist</div>
              <button onClick={() => setAddPharmacistModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleAddPharmacist}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Pharmacist Name</label>
                  <input
                    type="text"
                    required
                    className={`form-input ${pharmErrors.name ? 'input-error' : ''}`}
                    placeholder="e.g. Sunita Devi"
                    value={newPharmacist.name}
                    onChange={(e) => {
                      setNewPharmacist({ ...newPharmacist, name: e.target.value });
                      if (pharmErrors.name) setPharmErrors((prev) => ({ ...prev, name: '' }));
                    }}
                  />
                  {pharmErrors.name && <div className="field-error-msg"><AlertCircle size={13} /> {pharmErrors.name}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    className={`form-input ${pharmErrors.contact_no ? 'input-error' : ''}`}
                    placeholder="9876543210"
                    maxLength={10}
                    value={newPharmacist.contact_no}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewPharmacist({ ...newPharmacist, contact_no: val });
                      if (pharmErrors.contact_no) setPharmErrors((prev) => ({ ...prev, contact_no: '' }));
                    }}
                  />
                  {pharmErrors.contact_no && <div className="field-error-msg"><AlertCircle size={13} /> {pharmErrors.contact_no}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Account Password</label>
                  <input
                    type="password"
                    minLength={6}
                    className={`form-input ${pharmErrors.password ? 'input-error' : ''}`}
                    placeholder="Default: pharm123 (min 6 chars)"
                    value={newPharmacist.password}
                    onChange={(e) => {
                      setNewPharmacist({ ...newPharmacist, password: e.target.value });
                      if (pharmErrors.password) setPharmErrors((prev) => ({ ...prev, password: '' }));
                    }}
                  />
                  {pharmErrors.password && <div className="field-error-msg"><AlertCircle size={13} /> {pharmErrors.password}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setAddPharmacistModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Register Pharmacist</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reorder Request Modal (Pharmacist) */}
      {reorderModal && (
        <div className="modal-overlay" onClick={() => setReorderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="card-title">Submit Restock Reorder Request</div>
              <button onClick={() => setReorderModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleReorderSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Drug to Restock</label>
                  <select
                    className="form-select"
                    required
                    value={reorderForm.medicine_id}
                    onChange={(e) => setReorderForm({ ...reorderForm, medicine_id: e.target.value })}>
                    <option value="">-- Choose Medicine --</option>
                    {inventoryList.map((m) => (
                      <option key={m.medicine_id} value={m.medicine_id}>
                        {m.name} ({m.type}) — Current Stock: {m.stock_quantity}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Requested Units Quantity</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={1000}
                    className="form-input"
                    value={reorderForm.requested_quantity}
                    onChange={(e) => setReorderForm({ ...reorderForm, requested_quantity: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setReorderModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Submit to Admin</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal (For all users + Mandatory on first login) */}
      {changePasswordModal && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!mandatoryPasswordChange) setChangePasswordModal(false);
          }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} color="var(--primary)" />
                {mandatoryPasswordChange ? 'Mandatory Password Setup' : 'Change Account Password'}
              </div>
              {!mandatoryPasswordChange && (
                <button
                  onClick={() => setChangePasswordModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handlePasswordChangeSubmit}>
              <div className="modal-body">
                {mandatoryPasswordChange && (
                  <div className="security-notice-box">
                    <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <strong>Temporary Password Detected:</strong> Administrator provisioned your account. For security, you must set your private password before continuing.
                    </div>
                  </div>
                )}

                {changePassNotice && (
                  <div className="form-inline-error">
                    <AlertCircle size={15} />
                    <span>{changePassNotice}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Current / Temporary Password</label>
                  <input
                    type="password"
                    required
                    className={`form-input ${changePassErrors.old_password ? 'input-error' : ''}`}
                    placeholder="Enter current password"
                    value={changePassForm.old_password}
                    onChange={(e) => {
                      setChangePassForm({ ...changePassForm, old_password: e.target.value });
                      if (changePassErrors.old_password) setChangePassErrors((prev) => ({ ...prev, old_password: '' }));
                      setChangePassNotice('');
                    }}
                  />
                  {changePassErrors.old_password && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {changePassErrors.old_password}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">New Secure Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={`form-input ${changePassErrors.new_password ? 'input-error' : ''}`}
                    placeholder="Min 6 characters"
                    value={changePassForm.new_password}
                    onChange={(e) => {
                      setChangePassForm({ ...changePassForm, new_password: e.target.value });
                      if (changePassErrors.new_password) setChangePassErrors((prev) => ({ ...prev, new_password: '' }));
                      setChangePassNotice('');
                    }}
                  />
                  {changePassErrors.new_password && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {changePassErrors.new_password}</div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={`form-input ${changePassErrors.confirm_password ? 'input-error' : ''}`}
                    placeholder="Re-enter new password"
                    value={changePassForm.confirm_password}
                    onChange={(e) => {
                      setChangePassForm({ ...changePassForm, confirm_password: e.target.value });
                      if (changePassErrors.confirm_password) setChangePassErrors((prev) => ({ ...prev, confirm_password: '' }));
                      setChangePassNotice('');
                    }}
                  />
                  {changePassErrors.confirm_password && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {changePassErrors.confirm_password}</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                {!mandatoryPasswordChange && (
                  <button
                    type="button"
                    onClick={() => setChangePasswordModal(false)}
                    className="btn btn-secondary">
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: mandatoryPasswordChange ? '100%' : 'auto' }} disabled={loading}>
                  {loading ? 'Updating Password...' : 'Save & Secure Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal (Accessible by Anyone) */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                Hospital Experience Feedback
              </div>
              <button
                onClick={() => setFeedbackModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Your feedback helps hospital administration maintain medical standards and excellent healthcare delivery.
                </p>

                <div className="form-group">
                  <label className="form-label">Rating Experience</label>
                  <div className="feedback-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                        className={`star-btn ${star <= feedbackForm.rating ? 'active' : ''}`}
                        title={`${star} Star${star > 1 ? 's' : ''}`}>
                        <Star
                          size={28}
                          fill={star <= feedbackForm.rating ? '#f59e0b' : 'none'}
                          color={star <= feedbackForm.rating ? '#f59e0b' : '#cbd5e1'}
                        />
                      </button>
                    ))}
                    <span style={{ marginLeft: 10, alignSelf: 'center', fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b' }}>
                      {feedbackForm.rating === 5 ? '5/5 Excellent' :
                       feedbackForm.rating === 4 ? '4/5 Very Good' :
                       feedbackForm.rating === 3 ? '3/5 Satisfactory' :
                       feedbackForm.rating === 2 ? '2/5 Needs Improvement' : '1/5 Poor'}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback Category</label>
                  <select
                    className="form-select"
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}>
                    <option value="Doctor Consultation">Doctor Consultation</option>
                    <option value="Pharmacy Service">Pharmacy & Medication</option>
                    <option value="Hospital Facilities">Hospital Cleanliness & Facilities</option>
                    <option value="Staff & Nursing Care">Staff & Nursing Care</option>
                    <option value="Billing & Accounts">Billing & Reception</option>
                    <option value="General Suggestion">General Suggestion</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Feedback Message</label>
                  <textarea
                    rows={4}
                    required
                    className={`form-textarea ${feedbackErrors.message ? 'input-error' : ''}`}
                    placeholder="Write your honest comments or suggestions..."
                    value={feedbackForm.message}
                    onChange={(e) => {
                      setFeedbackForm({ ...feedbackForm, message: e.target.value });
                      if (feedbackErrors.message) setFeedbackErrors({ message: '' });
                    }}
                  />
                  {feedbackErrors.message && (
                    <div className="field-error-msg"><AlertCircle size={13} /> {feedbackErrors.message}</div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit to Administration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. Pharmacist: Clinical Prescription Verification Modal */}
      {verifyRxModal.open && verifyRxModal.rx && (() => {
        const rx = verifyRxModal.rx;
        const activeMedId = verifyDispenseMedId || rx.medicine_id;
        const selectedMed = inventoryList.find((m) => String(m.medicine_id) === String(activeMedId)) || {
          medicine_id: rx.medicine_id,
          name: rx.medicine_name,
          stock_quantity: rx.current_stock,
          price_per_unit: rx.price_per_unit,
          expiry_date: rx.expiry_date,
        };

        const activeStock = Number(selectedMed.stock_quantity ?? rx.current_stock ?? 0);
        const activeExpiry = selectedMed.expiry_date || rx.expiry_date;
        const activePrice = Number(selectedMed.price_per_unit ?? rx.price_per_unit ?? 0);
        const activeName = selectedMed.name || rx.medicine_name;
        const isExp = activeExpiry && new Date(activeExpiry).getTime() < Date.now();
        const currentQty = Number(verifyDispenseQty !== '' ? verifyDispenseQty : rx.quantity || 1);
        const isShort = activeStock < currentQty;
        const totalDispenseCost = (activePrice * currentQty).toFixed(2);

        return (
          <div className="modal-overlay" onClick={() => setVerifyRxModal({ open: false, rx: null })}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, padding: '1.75rem' }}>
              <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary-light)', display: 'grid', placeItems: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="card-title" style={{ fontSize: '1.15rem' }}>Doctor Prescription Verification & Dispense Setup</div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Prescription Order #{rx.prescribed_id} — Doctor Order vs Pharmacist Fulfillment Cross-Check
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerifyRxModal({ open: false, rx: null })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={20} color="var(--text-muted)" />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: 0 }}>
                {/* Expiry / Stock Warnings */}
                {isExp && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#991b1b', fontSize: '0.875rem' }}>
                    <AlertTriangle size={22} style={{ flexShrink: 0, color: '#dc2626' }} />
                    <div>
                      <strong>Critical Clinical Safety Alert: Drug Expired!</strong>
                      <div>
                        This batch of <strong>{activeName}</strong> expired on <strong>{new Date(activeExpiry).toLocaleDateString()}</strong>.
                        Dispensing expired medication to a patient is strictly prohibited by hospital protocol.
                      </div>
                    </div>
                  </div>
                )}
                {isShort && !isExp && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '0.85rem 1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', color: '#92400e', fontSize: '0.875rem' }}>
                    <AlertCircle size={22} style={{ flexShrink: 0, color: '#d97706' }} />
                    <div>
                      <strong>Insufficient Stock in Dispensary:</strong>
                      <div>Required to dispense: {currentQty} units, but only {activeStock} units are currently available. Please request a restock order.</div>
                    </div>
                  </div>
                )}

                {/* 1. Patient Demographic Verification */}
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 10, padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6, letterSpacing: '0.5px' }}>
                    1. Patient Demographic Verification
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Patient Name</div>
                      <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{rx.patient_name}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gender / Age</div>
                      <strong>{rx.patient_gender || '—'} {rx.patient_dob ? `(${calculateAge(rx.patient_dob)})` : ''}</strong>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone Contact</div>
                      <strong>{rx.patient_contact || '—'}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Prescribing Doctor & Diagnosed Condition (What Doctor Wrote) */}
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#166534', marginBottom: 6, letterSpacing: '0.5px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>2. Doctor's Clinical Prescription (Doctor Ne Kya Likha He)</span>
                    <span style={{ color: '#15803d' }}>Date: {new Date(rx.prescription_date).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem', marginBottom: '0.65rem' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534' }}>Attending Physician</div>
                      <strong style={{ color: '#14532d', fontSize: '0.95rem' }}>{formatDoctorName(rx.doctor_name)}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d' }}>Department: {rx.specialization || 'Clinical Care'}</span>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#166534' }}>Doctor Prescribed Medicine</div>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>{rx.medicine_name}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#15803d' }}>Qty: {rx.quantity} units | Dosage: {rx.dosage || '1-0-1'}</span>
                    </div>
                  </div>
                  <div style={{ background: '#ffffff', border: '1px solid #86efac', borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.4rem' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>Doctor's Clinical Diagnosis:</div>
                    <strong style={{ color: '#0369a1', fontSize: '0.95rem' }}>🩺 {rx.diagnosis || 'Clinical Consultation'}</strong>
                  </div>
                  {rx.clinical_notes && (
                    <div style={{ fontSize: '0.8rem', color: '#166534', fontStyle: 'italic', marginTop: 4 }}>
                      "Doctor's Instructions: {rx.clinical_notes}"
                    </div>
                  )}
                </div>

                {/* 3. Pharmacist Dispense Verification & Input Selection (Input me kya quantity konsi medicine select he) */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '0.85rem 1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: 8, letterSpacing: '0.5px' }}>
                    3. Pharmacist Verification & Dispense Input (Konsi Medicine & Kitni Quantity Select He)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: 4 }}>
                        Selected Medicine to Dispense:
                      </label>
                      <select
                        className="form-select"
                        value={activeMedId}
                        onChange={(e) => setVerifyDispenseMedId(e.target.value)}
                        style={{ fontSize: '0.88rem', fontWeight: 600, background: '#ffffff' }}>
                        {inventoryList.length > 0 ? (
                          inventoryList.map((m) => (
                            <option key={m.medicine_id} value={m.medicine_id}>
                              {m.name} ({m.type}) — Stock: {m.stock_quantity} units
                            </option>
                          ))
                        ) : (
                          <option value={rx.medicine_id}>{rx.medicine_name} (Prescribed)</option>
                        )}
                      </select>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 6, fontSize: '0.78rem', color: '#3b82f6' }}>
                        <span>Stock: <strong>{activeStock} units</strong></span>
                        <span>Price: <strong>₹{activePrice.toFixed(2)}</strong></span>
                        <span>Expiry: <strong>{activeExpiry ? new Date(activeExpiry).toLocaleDateString() : '—'}</strong></span>
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', display: 'block', marginBottom: 4 }}>
                        Dispense Quantity Input:
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="number"
                          min={1}
                          max={activeStock || 999}
                          className="form-input"
                          value={verifyDispenseQty}
                          onChange={(e) => setVerifyDispenseQty(e.target.value)}
                          placeholder={String(rx.quantity || 1)}
                          style={{ fontWeight: 800, fontSize: '1rem', background: '#ffffff', width: '90px' }}
                        />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>units</span>
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Doctor prescribed: <strong>{rx.quantity} units</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px dashed #93c5fd' }}>
                    <div>
                      <span style={{ fontSize: '0.82rem', color: '#1e40af' }}>Total Medication Bill: </span>
                      <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>₹{totalDispenseCost}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 5 }}>({currentQty} × ${activePrice.toFixed(2)})</span>
                    </div>
                    <div>
                      <span className={`badge ${isExp ? 'expired' : isShort ? 'low-stock' : 'accepted'}`} style={isExp ? { background: '#fef2f2', color: '#dc2626', fontWeight: 800 } : {}}>
                        {isExp ? '⛔ EXPIRED (Blocked)' : isShort ? '⚠️ SHORT STOCK' : '✓ VERIFIED & READY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  type="button"
                  onClick={() => setVerifyRxModal({ open: false, rx: null })}
                  className="btn btn-secondary">
                  Cancel / Recheck
                </button>
                {isExp ? (
                  <button
                    type="button"
                    disabled
                    className="btn btn-danger"
                    style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                    ⛔ Dispense Blocked (Drug Expired)
                  </button>
                ) : isShort ? (
                  <button
                    type="button"
                    onClick={() => {
                      setReorderForm({
                        medicine_id: activeMedId || rx.medicine_id || '',
                        requested_quantity: Math.max(50, currentQty - activeStock + 50),
                      });
                      setVerifyRxModal({ open: false, rx: null });
                      setReorderModal(true);
                    }}
                    className="btn btn-primary">
                    <ShoppingCart size={15} /> Request Stock Replenishment
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleDispense(rx.prescribed_id, currentQty, activeStock, activeExpiry, activeName, activeMedId)}
                    className="btn btn-success">
                    <CheckCircle2 size={16} /> Confirm & Dispense Verified Medicine
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 11. Patient / Hospital Official Bill & Payment Receipt Modal */}
      {receiptModal.open && receiptModal.bill && (() => {
        const b = receiptModal.bill;
        return (
          <div className="modal-overlay" onClick={() => setReceiptModal({ open: false, bill: null })}>
            <div className="modal-content printable-receipt" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 680, padding: '2rem', background: '#ffffff', color: '#0f172a' }}>
              {/* Header with Hospital Letterhead */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #0284c7', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #0284c7, #0d9488)', display: 'grid', placeItems: 'center', color: '#ffffff', boxShadow: '0 4px 10px rgba(2,132,199,0.3)' }}>
                    <Activity size={26} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                      LIFELINE MULTI-SPECIALTY HOSPITAL
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                      NABH Accredited Tertiary Healthcare & Clinical Research Centre
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                      124 Healthcare Boulevard, Medical District | Ph: +91 (800) 555-0199 | Reg: MH-HOSP-2024-884
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="no-print"
                  onClick={() => setReceiptModal({ open: false, bill: null })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <X size={22} color="#64748b" />
                </button>
              </div>

              {/* Title & Receipt Meta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem', border: '1px solid #e2e8f0' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>OFFICIAL TAX INVOICE & RECEIPT</span>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0284c7' }}>
                    INV-2026-{String(b.bill_id).padStart(5, '0')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>PAYMENT DATE</span>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>
                    {new Date(b.bill_date || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Patient & Doctor Two-Column Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', marginBottom: 6 }}>
                    PATIENT DETAILS
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {b.patient_name || user.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                    Patient ID: PID-{String(b.patient_id || user.id).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Age / Gender: {b.patient_gender || user.gender || '—'} {b.patient_dob ? `(${calculateAge(b.patient_dob)})` : user.dob ? `(${calculateAge(user.dob)})` : ''}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Contact: {b.patient_contact || user.contact_no || '—'}
                  </div>
                  {b.patient_address && (
                    <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                      Address: {b.patient_address}
                    </div>
                  )}
                </div>

                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 800, color: '#64748b', marginBottom: 6 }}>
                    ATTENDING PHYSICIAN
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {formatDoctorName(b.doctor_name || 'Dr. Consultant')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 2 }}>
                    Department: {b.doctor_specialization || 'Clinical Care'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                    Consultation Status: Verified & Completed
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: 4 }}>
                    Hospital Unit: Main Clinical Wing OPD
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>#</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569' }}>Description / Medical Service</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: '#475569', textAlign: 'right' }}>Amount (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.85rem' }}>1</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <strong>Doctor Consultation & Clinical Assessment</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Primary physician clinical consultation & diagnostic evaluation
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>1</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>
                        ₹{Number(b.doctor_fee || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.65rem 0.85rem' }}>2</td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <strong>Pharmacy Dispensed Medication: {b.medicine_name || 'Prescribed Drugs'}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Prescription dosage: {b.dosage || 'As directed'} {b.duration ? `(${b.duration})` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                        {b.medicine_quantity || 1} units
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600 }}>
                        ₹{Number(b.total_medicine_cost || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr style={{ background: '#fafafa' }}>
                      <td style={{ padding: '0.65rem 0.85rem' }}>3</td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#64748b' }}>
                        Hospital Facility & Administrative Maintenance
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center', color: '#64748b' }}>1</td>
                      <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#64748b' }}>
                        ₹0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Calculation & Official Seal Box */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                {/* Official PAID Stamp Seal */}
                <div style={{ border: '2px dashed #16a34a', borderRadius: 10, padding: '0.85rem', background: '#f0fdf4', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', border: '3px solid #16a34a', display: 'grid', placeItems: 'center', color: '#16a34a', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', transform: 'rotate(-10deg)', flexShrink: 0 }}>
                    PAID
                  </div>
                  <div>
                    <strong style={{ color: '#15803d', fontSize: '0.9rem', display: 'block' }}>
                      ✓ PAYMENT RECEIVED & SETTLED
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#166534' }}>
                      Mode: <strong>{b.payment_mode || 'Online / UPI'}</strong> | Status: Verified Cleared
                    </span>
                  </div>
                </div>

                {/* Amount Summary */}
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Gross Subtotal:</span>
                    <span>₹{Number(b.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 4 }}>
                    <span style={{ color: '#64748b' }}>Applicable GST / Tax:</span>
                    <span>₹0.00 (Included)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e2e8f0', paddingTop: 6, fontSize: '1.15rem' }}>
                    <strong style={{ color: '#0f172a' }}>Total Paid:</strong>
                    <strong style={{ color: '#16a34a' }}>₹{Number(b.total_amount || 0).toFixed(2)}</strong>
                  </div>
                </div>
              </div>

              {/* Footer & Authorized Signature */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: '#64748b' }}>
                <div>
                  <div>* This is an authentic computer-generated hospital receipt. No physical signature required.</div>
                  <div>* Retain this tax invoice for healthcare insurance claims and medical reimbursements.</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ height: 26, borderBottom: '1px solid #94a3b8', width: 140, marginBottom: 4 }}></div>
                  <strong style={{ color: '#334155' }}>Authorized Accounts Desk</strong>
                </div>
              </div>

              {/* Print / Action Buttons */}
              <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setReceiptModal({ open: false, bill: null })}
                  className="btn btn-secondary">
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#0284c7' }}>
                  <Printer size={16} /> Print Official Receipt
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
