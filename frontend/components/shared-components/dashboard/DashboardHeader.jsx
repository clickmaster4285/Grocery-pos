'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, UserPlus } from 'lucide-react';
import { useLogin, useRegister, useGetMe } from '@/features/authApi';

const AdminHeader = ({ onAddUser }) => {
  const { data: user, isLoading, error } = useGetMe();
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'viewer',
    department: '',
    phone: '',
  });

  const handleSubmit = () => {
    if (!newUser.name || !newUser.email) {
      toast.error('Missing Required Fields', {
        description: 'Please fill in name and email address.',
      });
      return;
    }

    onAddUser(newUser);

    setNewUser({
      name: '',
      email: '',
      role: 'viewer',
      department: '',
      phone: '',
    });
    setOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      <div className="flex-1">
        <h1>
          {user.user_role.charAt(0).toUpperCase() + user.user_role.slice(1)}{' '}
          Dashboard
        </h1>
      
        <p className="text-slate-600 mt-2 text-lg">
          Comprehensive system overview and user management
        </p>
      </div>
      <div className="flex items-center gap-3">
      </div>
    </div>
  );
};

export default AdminHeader;
