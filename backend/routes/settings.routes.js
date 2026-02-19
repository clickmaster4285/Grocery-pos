// routes/settings.routes.js
const express = require("express");
const router = express.Router();
const { updateSettingsSchema, updateProfileSchema } = require("../validation/settings.validation");
const settingsController = require("../controllers/settings.controller");
const { settingsUpload } = require("../middleware/upload");

const auth = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");
const { PERMISSIONS_OBJECT } = require("../config/permissions");

// Middleware to parse JSON strings from FormData (e.g., notifications)
const parseJsonFields = (fields) => (req, res, next) => {
  fields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      try {
        req.body[field] = JSON.parse(req.body[field]);
      } catch (e) {
        // Not a JSON string, leave as is
      }
    }
  });
  next();
};

// Middleware to validate request body using Joi
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      details: error.details.map((d) => d.message),
    });
  }
  next();
};

const SettingsPermissions = PERMISSIONS_OBJECT.SETTINGS;

router.get(
  "/",
  // checkPermission([SettingsPermissions.STORE_SETTINGS.READ]),
  settingsController.getSettings
);
// Apply auth middleware globally for all settings routes
router.use(auth);


// For updating "Store Settings"
router.put(
  "/",
  checkPermission([SettingsPermissions.STORE_SETTINGS.UPDATE]),
  settingsUpload.single("logo"),
  parseJsonFields(['notifications']),
  validate(updateSettingsSchema),
  settingsController.updateSettings
);

router.put(
  "/profile",
  validate(updateProfileSchema),
  settingsController.updateProfile
);

module.exports = router;
