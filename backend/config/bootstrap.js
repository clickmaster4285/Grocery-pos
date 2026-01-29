const mongoose = require('mongoose');
const User = require('../models/User');
const { generateUserId } = require('../utils/userIdGenerator');
const { hashPassword } = require('../utils/password');
const { ROLES } = require('./roles');

const initializeAdminAccount = async () => {
  // 1. Validate Environment Variables
  const {
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  if (!ADMIN_FIRST_NAME || !ADMIN_LAST_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Missing required environment variables for default admin creation.');
    console.error('Please set ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD.');
    process.exit(1);
  }

  try {
    // 2. Check if an admin user already exists (idempotency check)
    const existingAdmin = await User.findOne({
      roles: ROLES.ADMIN,
      isDeleted: false,
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists. Skipping creation.');
      return;
    }

    console.log('No admin user found. Creating default admin...');

    // 3. Hash the default password
    const hashedPassword = await hashPassword(ADMIN_PASSWORD);

    // 4. Generate a User ID
    const userId = generateUserId({
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        role: ROLES.ADMIN,
    });
    
    // 5. Create the new admin user
    const adminUser = new User({
        userId,
        firstName: ADMIN_FIRST_NAME,
        lastName: ADMIN_LAST_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        roles: [ROLES.ADMIN],
        isActive: true,
      });

    await adminUser.save();

    console.log('✅ Default admin user created successfully.');
    
  } catch (error) {
    console.error('❌ Error during admin user initialization:', error.message);
    // Exit gracefully without exposing sensitive details
    process.exit(1);
  }
};

module.exports = { initializeAdminAccount };