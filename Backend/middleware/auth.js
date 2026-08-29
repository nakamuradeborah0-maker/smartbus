const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes & extract user
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'global_voyage_jwt_secret_key_2026_super_secure_token'
      );

      req.user = await User.findById(decoded.id).select('-password').populate('stationId');

      if (!req.user) {
        return res.status(401).json({ error: 'User account no longer exists.' });
      }

      next();
    } catch (error) {
      console.error('JWT Token verification failed:', error.message);
      return res.status(401).json({ error: 'Not authorized, invalid or expired token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no authentication token provided.' });
  }
};

// Middleware to authorize specific roles (RBAC)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access forbidden: Role '${req.user.role}' is not authorized for this resource.`,
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
