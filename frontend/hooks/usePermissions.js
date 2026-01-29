// frontend/hooks/usePermissions.js
import { useAuth } from './useAuth';
import { userHasRole, hasPermission } from '../utils/permissions';
import { useMemo, useCallback } from 'react'; 
export const usePermissions = () => {
  const { user } = useAuth();
  const userRoles = useMemo(() => user?.roles || [], [user]);

  const canUserAccess = useCallback((requiredPermission) => {
    return hasPermission(userRoles, requiredPermission);
  }, [userRoles]);

  const doesUserHaveRole = useCallback((role) => {
    return userHasRole(userRoles, role);
  }, [userRoles]);

  return { canUserAccess, doesUserHaveRole, userRoles };
};
