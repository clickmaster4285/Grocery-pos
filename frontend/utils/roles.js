// frontend/utils/roles.js

export const getFilteredRoles = (allRoles, currentUserRole) => {
    // Ensure allRoles is an array before proceeding
    if (!Array.isArray(allRoles)) {
        return [];
    }

    if (currentUserRole === 'admin') {
        return allRoles;
    } else {
        // Non-admin users cannot assign 'admin' role
        return allRoles.filter(role => role.value !== 'admin');
    }
};
