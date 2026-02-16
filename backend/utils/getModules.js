const { PERMISSIONS, SYSTEM_HIERARCHY } = require('../config/permissions');

/**
 * Transforms a flat list of user permission strings into a structured hierarchy.
 * Returns an array of Modules, each containing an array of Menus they have access to.
 */
const getModulesFromPermissions = (userPermissions) => {
    const structuredModules = [];

    SYSTEM_HIERARCHY.forEach(moduleDef => {
        const moduleSlug = moduleDef.module.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_');
        const accessibleMenus = [];

        moduleDef.menus.forEach(menuName => {
            const menuSlug = menuName.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_');
            
            // Check if user has ANY permission for this specific menu
            // We filter the global PERMISSIONS list to find matches for this menu
            const menuPermissions = PERMISSIONS.filter(p => 
                p.module === moduleDef.module && 
                p.menu === menuName && 
                userPermissions.includes(p.id)
            ).map(p => p.id);

            if (menuPermissions.length > 0) {
                accessibleMenus.push({
                    menuName: menuName,
                    menuSlug: menuSlug,
                    permissions: menuPermissions
                });
            }
        });

        if (accessibleMenus.length > 0) {
            structuredModules.push({
                moduleName: moduleDef.module,
                moduleSlug: moduleSlug,
                icon: moduleDef.icons || 'LayoutDashboard', // Use the icon from SYSTEM_HIERARCHY
                menus: accessibleMenus
            });
        }
    });

    return structuredModules;
};

module.exports = {
    getModulesFromPermissions,
};
