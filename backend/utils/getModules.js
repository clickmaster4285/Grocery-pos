const { PERMISSIONS } = require('../config/permissions');

const getModulesFromPermissions = (userPermissions) => {
    // Get unique module names that the user has permissions for
    const accessibleModuleNames = [...new Set(
        PERMISSIONS
            .filter(p => userPermissions.includes(p.id))
            .map(p => p.module)
    )];

    // Structure the modules with their associated permissions
    const structuredModules = accessibleModuleNames.map(moduleName => {
        const modulePermissions = PERMISSIONS
            .filter(p => p.module === moduleName && userPermissions.includes(p.id))
            .map(p => p.id); // Get the full permission ID (e.g., 'users:create')

        return {
            moduleName: moduleName,
            permissions: modulePermissions,
        };
    });

    return structuredModules;
};

module.exports = {
    getModulesFromPermissions,
};
