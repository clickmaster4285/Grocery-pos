// backend/config/permissions.js

// Define modules and permission types
const modules = [
  'Dashboard',
  'Branches',
  'Users',
  'Brands',    
  'Categories',
  'Products',
  'Suppliers', 
];
const permissionTypes = [
  'create',
  'read',
  'update',
  'delete',
];

// Programmatically generate permissions
const PERMISSIONS = [];
modules.forEach((module) => {
  permissionTypes.forEach((type) => {
    PERMISSIONS.push({
      id: `${module.toLowerCase()}:${type}`,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${module.slice(0, -1)}`,
      module,
    });
  });
});

// For backwards compatibility, create the nested object structure
const PERMISSIONS_OBJECT = {};
PERMISSIONS.forEach(p => {
  const [moduleName, action] = p.id.split(':');
  const moduleKey = moduleName.toUpperCase();
  const actionKey = action.toUpperCase();

  if (!PERMISSIONS_OBJECT[moduleKey]) {
    PERMISSIONS_OBJECT[moduleKey] = {};
  }
  PERMISSIONS_OBJECT[moduleKey][actionKey] = p.id;
});


module.exports = {
  PERMISSIONS,
  PERMISSIONS_OBJECT,
};
