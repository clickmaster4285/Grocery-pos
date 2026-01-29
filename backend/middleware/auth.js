const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const errorHandler = require('./errorHandler');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. No token provided.',
      });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. Invalid token.',
      });
    }

    // Attach the full user object to the request, excluding the password.
    const user = await User.findOne({ userId: decoded.userId, isDeleted: false }).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authorization denied. User not found.',
      });
    }

    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Your account has been deactivated.',
        });
    }

    req.user = user;
    next();
  } catch (error) {
    // Pass to the generic error handler
    return errorHandler(error, req, res);
  }
};

module.exports = auth;
