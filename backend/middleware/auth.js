const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'node_express_hospital_security_token_key_2026_987654321';

// Verify JWT Token Middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied: Authorization token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid or corrupted authorization token' });
  }
}

// Role-Based Authorization Guard
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ success: false, message: 'Unauthorized role access' });
    }
    const userRole = req.user.role.toLowerCase();
    const hasRole = allowedRoles.some((r) => r.toLowerCase() === userRole);
    if (!hasRole) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Resource restricted to [${allowedRoles.join(', ')}] role`,
      });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRole,
  JWT_SECRET,
};
