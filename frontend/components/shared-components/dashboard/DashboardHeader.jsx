'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

const AdminHeader = ({ onAddUser }) => {
  const { user, isLoading, isError } = useAuth();
  const { can } = usePermissions();
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer',
    department: '',
    phone: '',
  });

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex-1">
        <h1>
          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}{' '}
          Dashboard
        </h1>
      
        <p className="text-slate-600 mt-2 text-lg">
          Comprehensive system overview and user management
        </p>
      </div>
    </div>
  );
};

export default AdminHeader;
