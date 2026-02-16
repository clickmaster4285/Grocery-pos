// frontend/hooks/usePermissions.js
import { useAuth } from './useAuth';
import { useCallback, useMemo } from 'react';

/**
 * usePermissions Hook
 * Provides granular permission checking based on the module:menu:action structure.
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = useMemo(() => user?.permissions || [], [user]);
  const currentUserRole = useMemo(() => user?.role?.toLowerCase() || '', [user]);

  /**
   * can: Base function to check for a specific permission string
   * @param {string} permissionId - e.g., 'inventory_management:product_database:create'
   */
  const can = useCallback((permissionId) => {
    if (!userPermissions || userPermissions.length === 0) return false;
    return userPermissions.includes(permissionId);
  }, [userPermissions]);

  /**
   * Helper to build permission ID and check it
   */
  const check = useCallback((module, menu, action) => {
    return can(`${module}:${menu}:${action}`);
  }, [can]);

  /**
   * Specialized Helpers
   */
  const canCreate = useCallback((module, menu) => check(module, menu, 'create'), [check]);
  const canRead = useCallback((module, menu) => check(module, menu, 'read'), [check]);
  const canUpdate = useCallback((module, menu) => check(module, menu, 'update'), [check]);
  const canDelete = useCallback((module, menu) => check(module, menu, 'delete'), [check]);

  /**
   * Role check helper
   */
  const hasRole = useCallback((roleName) => {
    return currentUserRole === roleName.toLowerCase();
  }, [currentUserRole]);

  /**
   * isAdmin check (frequently used)
   */
  const isAdmin = useMemo(() => currentUserRole === 'admin', [currentUserRole]);

  return { 
    can, 
    canCreate, 
    canRead, 
    canUpdate, 
    canDelete, 
    hasRole, 
    isAdmin,
    userPermissions, 
    currentUserRole 
  };
};
