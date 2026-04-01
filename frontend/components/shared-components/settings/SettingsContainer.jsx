'use client';

import React, { useState, useEffect } from 'react';
import { useGetSettings, useUpdateSettings, useUpdateProfile } from '@/features/settings.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Store, 
  User, 
  Bell, 
  Receipt, 
  Globe, 
  Shield, 
  Upload, 
  Loader2, 
  Save,
  Mail,
  Phone,
  DollarSign,
  Languages,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

import PageHeader from '@/components/shared-components/PageHeader';

const SettingsContainer = () => {
  const { user } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useGetSettings();
  const updateSettingsMutation = useUpdateSettings();
  const updateProfileMutation = useUpdateProfile();

  // Local states for forms
  const [storeData, setStoreData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    taxPercentage: 0,
    taxName: 'VAT',
    currency: 'USD',
    currencySymbol: '$',
    lowStockThreshold: 10,
    language: 'en',
    timezone: 'UTC',
    logo: null
  });

  const [receiptData, setReceiptData] = useState({
    receiptFooterMessage: '',
    receiptTerms: '',
    taxNumber: ''
  });

  const [notificationData, setNotificationData] = useState({
    emailNotifications: true,
    smsNotifications: false,
    salesAlerts: true,
    inventoryAlerts: true,
    systemUpdates: true,
    dailyReports: false,
    weeklyReports: false
  });

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Sync with fetched data
  useEffect(() => {
    if (settings) {
      setStoreData({
        companyName: settings.companyName || '',
        companyAddress: settings.companyAddress || '',
        companyPhone: settings.companyPhone || '',
        companyEmail: settings.companyEmail || '',
        companyWebsite: settings.companyWebsite || '',
        taxPercentage: settings.taxPercentage || 0,
        taxName: settings.taxName || 'VAT',
        currency: settings.currency || 'USD',
        currencySymbol: settings.currencySymbol || '$',
        lowStockThreshold: settings.lowStockThreshold || 10,
        language: settings.language || 'en',
        timezone: settings.timezone || 'UTC',
        logo: settings.logo || null
      });

      setReceiptData({
        receiptFooterMessage: settings.receiptFooterMessage || '',
        receiptTerms: settings.receiptTerms || '',
        taxNumber: settings.taxNumber || ''
      });

      if (settings.notifications) {
        setNotificationData(settings.notifications);
      }
    }
  }, [settings]);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || ''
      }));
    }
  }, [user]);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStoreData({ ...storeData, logo: file });
    }
  };

  const getLogoPreview = () => {
    if (storeData.logo instanceof File) {
      return URL.createObjectURL(storeData.logo);
    }
    if (storeData.logo && typeof storeData.logo === 'string') {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}/${storeData.logo}`;
    }
    return null;
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({ ...storeData, ...receiptData, notifications: notificationData });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    updateProfileMutation.mutate(profileData);
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="System Configuration"
        description="Control your POS identity, regional settings, and system-wide behavior."
      />

      <Tabs defaultValue="store" className="space-y-6">
        <TabsList className="bg-muted/50 p-0.5 border grid grid-cols-2 lg:grid-cols-4 w-full lg:w-200">
          <TabsTrigger value="store" className="gap-2 font-bold data-[state=active]:bg-background">
            <Store size={16} /> Store Profile
          </TabsTrigger>
          <TabsTrigger value="receipt" className="gap-2 font-bold data-[state=active]:bg-background">
            <Receipt size={16} /> POS & Receipts
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 font-bold data-[state=active]:bg-background">
            <Bell size={16} /> Notifications
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2 font-bold data-[state=active]:bg-background">
            <User size={16} /> My Profile
          </TabsTrigger>
        </TabsList>

        {/* --- STORE PROFILE --- */}
        <TabsContent value="store" className="space-y-4">
          <Card className="border-none shadow-lg p-0">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Globe className="text-primary" /> Company Identity
              </CardTitle>
              <CardDescription>This information will appear on system headers and official documents.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateStore} className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start mb-6">
                    <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Brand Logo</Label>
                        <div className="relative group cursor-pointer h-32 w-32 rounded-2xl border-2 border-dashed border-primary/20 bg-muted/30 flex items-center justify-center overflow-hidden transition-all hover:border-primary/50">
                            {getLogoPreview() ? (
                                <img src={getLogoPreview()} alt="Logo Preview" className="h-full w-full object-contain p-2" />
                            ) : (
                                <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Upload className="text-white h-6 w-6" />
                            </div>
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={handleLogoChange}
                                accept="image/*"
                            />
                        </div>
                        <p className="text-[9px] text-muted-foreground max-w-32 text-center font-bold">Recommended: Square PNG with Transparent Background</p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Company Name</Label>
                            <Input 
                            value={storeData.companyName} 
                            onChange={e => setStoreData({...storeData, companyName: e.target.value})} 
                            className="bg-muted/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Official Website</Label>
                            <Input 
                            placeholder="https://example.com"
                            value={storeData.companyWebsite} 
                            onChange={e => setStoreData({...storeData, companyWebsite: e.target.value})} 
                            className="bg-muted/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Support Email</Label>
                            <Input 
                            type="email"
                            value={storeData.companyEmail} 
                            onChange={e => setStoreData({...storeData, companyEmail: e.target.value})} 
                            className="bg-muted/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Contact Phone</Label>
                            <Input 
                            value={storeData.companyPhone} 
                            onChange={e => setStoreData({...storeData, companyPhone: e.target.value})} 
                            className="bg-muted/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Physical Address</Label>
                    <Textarea 
                        value={storeData.companyAddress} 
                        onChange={e => setStoreData({...storeData, companyAddress: e.target.value})} 
                        className="bg-muted/20 min-h-20"
                    />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <Clock size={12} /> Timezone
                    </Label>
                    <Input value={storeData.timezone} onChange={e => setStoreData({...storeData, timezone: e.target.value})} className="bg-muted/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <Languages size={12} /> System Language
                    </Label>
                    <Input value={storeData.language} onChange={e => setStoreData({...storeData, language: e.target.value})} className="bg-muted/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                      <Shield size={12} /> Low Stock Threshold
                    </Label>
                    <Input 
                      type="number" 
                      value={storeData.lowStockThreshold} 
                      onChange={e => setStoreData({...storeData, lowStockThreshold: parseInt(e.target.value)})} 
                      className="bg-muted/20 font-bold"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={updateSettingsMutation.isPending} className="gap-2 font-bold px-8 shadow-lg shadow-primary/20">
                    {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                    Save Identity Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- POS & RECEIPTS --- */}
        <TabsContent value="receipt" className="space-y-4">
          <Card className="border-none shadow-lg p-0">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Receipt className="text-primary" /> Financial & Receipt Configuration
              </CardTitle>
              <CardDescription>Setup tax rules and how your physical receipts will look.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateStore} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Default Tax Name</Label>
                    <Input 
                      value={storeData.taxName} 
                      onChange={e => setStoreData({...storeData, taxName: e.target.value})} 
                      placeholder="VAT / GST"
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Tax Percentage (%)</Label>
                    <Input 
                      type="number"
                      value={storeData.taxPercentage} 
                      onChange={e => setStoreData({...storeData, taxPercentage: parseFloat(e.target.value)})} 
                      className="bg-muted/20 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Tax Reg No.</Label>
                    <Input 
                      value={receiptData.taxNumber} 
                      onChange={e => setReceiptData({...receiptData, taxNumber: e.target.value})} 
                      placeholder="Company VAT ID"
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Currency Symbol</Label>
                    <Input 
                      value={storeData.currencySymbol} 
                      onChange={e => setStoreData({...storeData, currencySymbol: e.target.value})} 
                      className="bg-muted/20 text-center font-black"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Receipt Footer Message</Label>
                    <Input 
                      value={receiptData.receiptFooterMessage} 
                      onChange={e => setReceiptData({...receiptData, receiptFooterMessage: e.target.value})} 
                      placeholder="e.g. Visit us again!"
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Receipt Terms & Conditions</Label>
                    <Textarea 
                      value={receiptData.receiptTerms} 
                      onChange={e => setReceiptData({...receiptData, receiptTerms: e.target.value})} 
                      placeholder="Return policy details..."
                      className="bg-muted/20 min-h-25"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={updateSettingsMutation.isPending} className="gap-2 font-bold px-8 shadow-lg shadow-primary/20">
                    {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                    Apply POS Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- NOTIFICATIONS --- */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="border-none shadow-lg p-0">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Bell className="text-primary" /> Notification Center
              </CardTitle>
              <CardDescription>Decide which events trigger system and external alerts.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary border-b pb-2">
                    <Mail size={16} /> Channels
                  </h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                    <div className="space-y-0.5">
                      <Label className="font-bold">Email Notifications</Label>
                      <p className="text-[10px] text-muted-foreground uppercase">Enable system emails to staff</p>
                    </div>
                    <Switch 
                      checked={notificationData.emailNotifications} 
                      onCheckedChange={v => setNotificationData({...notificationData, emailNotifications: v})} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                    <div className="space-y-0.5">
                      <Label className="font-bold">SMS Notifications</Label>
                      <p className="text-[10px] text-muted-foreground uppercase">Emergency mobile alerts</p>
                    </div>
                    <Switch 
                      checked={notificationData.smsNotifications} 
                      onCheckedChange={v => setNotificationData({...notificationData, smsNotifications: v})} 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-bold flex items-center gap-2 text-primary border-b pb-2">
                    <Shield size={16} /> Alert Categories
                  </h4>
                  <div className="space-y-4">
                    {[
                      { key: 'salesAlerts', label: 'Real-time Sales Alerts', desc: 'Notify on every large transaction' },
                      { key: 'inventoryAlerts', label: 'Inventory Critical Alerts', desc: 'Notify when stock is below threshold' },
                      { key: 'dailyReports', label: 'EOD Daily Reports', desc: 'Automatic end-of-day summary' },
                      { key: 'weeklyReports', label: 'Weekly Performance', desc: 'Summary of weekly operations' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-2">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">{item.label}</Label>
                          <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch 
                          checked={notificationData[item.key]} 
                          onCheckedChange={v => setNotificationData({...notificationData, [item.key]: v})} 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-8 border-t mt-8">
                <Button onClick={handleUpdateStore} disabled={updateSettingsMutation.isPending} className="gap-2 font-bold px-8 shadow-lg shadow-primary/20">
                  {updateSettingsMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                  Update Notification Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- USER PROFILE --- */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="border-none shadow-lg p-0">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Shield className="text-primary" /> My Account Security
              </CardTitle>
              <CardDescription>Manage your personal login credentials and profile details.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpdateProfile} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">First Name</Label>
                    <Input 
                      value={profileData.firstName} 
                      onChange={e => setProfileData({...profileData, firstName: e.target.value})} 
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Last Name</Label>
                    <Input 
                      value={profileData.lastName} 
                      onChange={e => setProfileData({...profileData, lastName: e.target.value})} 
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Email Address</Label>
                    <Input 
                      value={profileData.email} 
                      onChange={e => setProfileData({...profileData, email: e.target.value})} 
                      className="bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Phone Number</Label>
                    <Input 
                      value={profileData.phone} 
                      onChange={e => setProfileData({...profileData, phone: e.target.value})} 
                      className="bg-muted/20"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 space-y-6">
                  <h4 className="text-sm font-black uppercase tracking-widest text-amber-700 flex items-center gap-2">
                    <Shield size={16} /> Change System Password
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-amber-800">Old Password</Label>
                      <Input 
                        type="password" 
                        value={profileData.oldPassword} 
                        onChange={e => setProfileData({...profileData, oldPassword: e.target.value})} 
                        className="bg-white border-amber-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-amber-800">New Password</Label>
                      <Input 
                        type="password" 
                        value={profileData.newPassword} 
                        onChange={e => setProfileData({...profileData, newPassword: e.target.value})} 
                        className="bg-white border-amber-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-amber-800">Confirm New Password</Label>
                      <Input 
                        type="password" 
                        value={profileData.confirmPassword} 
                        onChange={e => setProfileData({...profileData, confirmPassword: e.target.value})} 
                        className="bg-white border-amber-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-6 rounded-2xl border space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    Security Verification
                  </h4>
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    <div className="space-y-2 flex-1">
                      <Label className="text-sm font-bold">Current Password</Label>
                      <p className="text-[10px] text-muted-foreground uppercase font-medium">Enter your password to authorize these changes</p>
                      <Input 
                        type="password" 
                        required={profileData.email !== user?.email || profileData.phone !== user?.phone}
                        value={profileData.currentPassword} 
                        onChange={e => setProfileData({...profileData, currentPassword: e.target.value})} 
                        className="bg-white shadow-inner"
                        placeholder="Verify Identity"
                      />
                    </div>
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="gap-2 font-bold px-8 h-10 shadow-xl shadow-primary/20">
                      {updateProfileMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save size={18} />}
                      Confirm Profile Updates
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsContainer;
