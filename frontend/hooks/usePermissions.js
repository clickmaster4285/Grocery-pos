// frontend/hooks/usePermissions.js
import { useAuth } from './useAuth';
import { userCan, userHasRole } from '../utils/permissions';
import { useCallback, useMemo } from 'react';

export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = useMemo(() => user?.permissions || [], [user]);
  const currentUserRole = useMemo(() => user?.role || '', [user]); 

  const can = useCallback((requiredPermission) => {
    return userCan(userPermissions, requiredPermission);
  }, [userPermissions]);

  const hasRole = useCallback((roleName) => {
    return userHasRole(currentUserRole, roleName);
  }, [currentUserRole]);

  return { can, hasRole, userPermissions, currentUserRole };
};
