const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. User not authenticated or permissions not found.',
      });
    }

    const userHasPermission = req.user.permissions.includes(requiredPermission);

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
