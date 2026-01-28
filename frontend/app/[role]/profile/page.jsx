'use client';

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Check,
  User,
  Mail,
  Lock,
  Phone,
  Save,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { toast } from 'sonner';
import { useUpdateProfile, useGetMe } from '@/features/authApi';

export default function ProfileSettings() {
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
const [alertMsg, setAlertMsg] = useState('');
const [alertType, setAlertType] = useState('success');

  // 🔹 Get logged-in user
  const { data: user, isLoading: isUserLoading, error } = useGetMe();

  // 🔹 Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (user) {
      setPersonalInfo({
        firstName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // 🔹 Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  function FormAlert({ type = 'success', message }) {
    if (!message) return null;

    const isSuccess = type === 'success';

    return (
      <Card
        className={`border ${
          isSuccess
            ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
            : 'border-red-300 bg-red-50 dark:bg-red-950/30'
        }`}
      >
        <CardContent className="py-4 flex items-center gap-3">
          {isSuccess ? (
            <Check className="h-5 w-5 text-emerald-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}

          <div>
            <p
              className={`font-medium ${
                isSuccess ? 'text-emerald-700' : 'text-red-700'
              }`}
            >
              {isSuccess ? 'Success' : 'Error'}
            </p>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handlePersonalChange = (field, value) => {
    setPersonalInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const { mutate: updateProfile } = useUpdateProfile();

const handleSavePersonal = () => {
  if (!personalInfo.firstName || !personalInfo.email) {
    setAlertType('error');
    setAlertMsg('Name and email are required.');
    return;
  }

  setIsLoading(true);

  updateProfile(
    {
      name: personalInfo.firstName,
      email: personalInfo.email,
      phone: personalInfo.phone,
    },
    {
      onSuccess: () => {
        setAlertType('success');
        setAlertMsg('Profile updated successfully!');
      },
      onError: (err) => {
        setAlertType('error');
        setAlertMsg(
          err?.response?.data?.message || 'Failed to update profile.'
        );
      },
      onSettled: () => {
        setIsLoading(false);
        setTimeout(() => setAlertMsg(''), 3000);
      },
    }
  );
};

  const handleSavePassword = () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters!');
      return;
    }

    setIsLoading(true);
    // TODO: call real change-password API here
    setTimeout(() => {
      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setIsLoading(false);
    }, 500);
  };

  if (isUserLoading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Failed to load profile.</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6">
          <h1>Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and security settings
          </p>
        </div>
        {alertMsg && (
          <div className="mb-6">
            <FormAlert type={alertType} message={alertMsg} />
          </div>
        )}

        {/* Parallel layout: Personal (left) + Security (right) */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className=" text-xl flex items-center gap-2">
                <User className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    First Name
                  </label>
                  <Input
                    value={personalInfo.firstName}
                    onChange={(e) =>
                      handlePersonalChange('firstName', e.target.value)
                    }
                    placeholder="First name"
                    className="bg-background"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) =>
                    handlePersonalChange('email', e.target.value)
                  }
                  placeholder="Email address"
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this for account notifications
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) =>
                    handlePersonalChange('phone', e.target.value)
                  }
                  placeholder="Phone number"
                  className="bg-background"
                />
              </div>

              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  onClick={handleSavePersonal}
                  disabled={isLoading}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right column: Security + Security Status */}
          <div className="space-y-6">
            {/* Security / Change Password */}
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Current Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) =>
                        handlePasswordChange('currentPassword', e.target.value)
                      }
                      placeholder="Enter current password"
                      className="bg-background pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        handlePasswordChange('newPassword', e.target.value)
                      }
                      placeholder="Enter new password"
                      className="bg-background pr-10"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground transition-colors hover:text-foreground"
                      type="button"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      handlePasswordChange('confirmPassword', e.target.value)
                    }
                    placeholder="Confirm new password"
                    className="bg-background"
                  />
                </div>

                <div className="flex justify-end border-t border-border pt-4">
                  <Button
                    onClick={handleSavePassword}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        {/* Security Tips Section */}
        <div
          className="mt-8 animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        >
          <Card className="card-elevated bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
            <CardContent className="py-5">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold font-display text-foreground mb-1">
                    Security Tips
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Use a strong password with at least 8 characters</li>
                    <li>
                      • Include uppercase, lowercase, numbers, and symbols
                    </li>
                    <li>• Never share your password with anyone</li>
                    <li>
                      • Enable two-factor authentication for extra security
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
    