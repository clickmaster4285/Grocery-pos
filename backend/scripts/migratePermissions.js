// backend/scripts/migratePermissions.js
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const { connectDatabase } = require('../config/database');
const { PERMISSIONS } = require('../config/permissions');

const migrate = async () => {
  try {
    await connectDatabase();
    console.log('🚀 Starting Permission Migration...');

    const allPermissionIds = PERMISSIONS.map(p => p.id);
    
    // Define base permissions for common roles (Optional but helpful)
    const cashierPermissions = PERMISSIONS.filter(p => 
      p.module === 'Point of Sale' || 
      (p.module === 'Inventory Management' && p.action === 'read')
    ).map(p => p.id);

    const users = await User.find({ isDeleted: false });
    console.log(`Found ${users.length} users to migrate.`);

    let updatedCount = 0;

    for (const user of users) {
      let newPermissions = [];
      const role = user.role.toLowerCase();

      if (role === 'admin') {
        // Admins get everything
        newPermissions = allPermissionIds;
      } else if (role === 'cashier') {
        // Cashiers get POS and Read-only Inventory
        newPermissions = cashierPermissions;
      } else {
        // Others get cleared or you can define logic here
        newPermissions = [];
      }

      await User.updateOne(
        { _id: user._id },
        { $set: { permissions: newPermissions } }
      );
      
      updatedCount++;
      console.log(`✅ Migrated user: ${user.email} (Role: ${user.role})`);
    }

    console.log(`
🎉 Migration Complete! ${updatedCount} users updated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();
