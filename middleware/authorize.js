// middleware/authorize.js

const CustomError = require('../utils/customError');

// This middleware checks if the logged-in user has one of the allowed roles
// Usage example in routes: router.get('/admin', authMiddleware, authorize('admin'), handler)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // 1️⃣ Check if the user's role (from req.user) is in the allowedRoles list
    if (!allowedRoles.includes(req.user.role)) {
      // 2️⃣ If not, send a 403 Forbidden error
      return next(new CustomError('Access denied: insufficient role', 403));
    }
    // 3️⃣ If role is allowed, move to the next middleware/route
    next();
  };
};

module.exports = authorize;
