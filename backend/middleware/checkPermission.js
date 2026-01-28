const { hasPermission } = require('../config/roles');

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    // req.user is attached by the `auth` middleware
    if (!req.user || !req.user.roles) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You do not have the necessary permissions.',
      });
    }

    const userHasPermission = hasPermission(req.user.roles, requiredPermission);

    if (userHasPermission) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden. You do not have the necessary permissions.',
    });
  };
};

module.exports = checkPermission;
