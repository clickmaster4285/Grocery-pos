"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateCustomer } from '@/features/customer.api';
import { useForm } from 'react-hook-form';
import { Loader2, UserPlus, Phone, Mail, User, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';

const AddCustomerModal = ({ isOpen, onClose, onSuccess }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const createCustomerMutation = useCreateCustomer();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      phonePrimary: '',
      email: '',
      customerGroup: 'Regular',
      isActive: true
    }
  });

  const onSubmit = async (data) => {
    try {
      const response = await createCustomerMutation.mutateAsync(data);
      if (response.success) {
        onSuccess(response.data);
        reset();
        setShowAdvanced(false);
      }
    } catch (err) {
        // Handled by mutation onError toast, but we can add specific logic here if needed
        if (err.response?.status === 409) {
            const existingCustomer = err.response.data.data;
            if (window.confirm(`${err.response.data.message}
Would you like to select the existing customer "${existingCustomer.firstName} ${existingCustomer.lastName}" instead?`)) {
                onSuccess(existingCustomer);
                reset();
            }
        }
    }
  };

  const handleClose = () => {
    reset();
    setShowAdvanced(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-106.25 rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-primary p-6 text-white flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <UserPlus className="h-6 w-6" />
            </div>
            <div>
                <DialogTitle className="text-xl font-bold uppercase tracking-tight">Add New Customer</DialogTitle>
                <p className="text-primary-foreground/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">POS Runtime Creation</p>
            </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  {...register('firstName', { required: 'First name is required' })}
                  placeholder="John" 
                  className={cn(
                    "pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10",
                    errors.firstName && "border-rose-500 focus-visible:ring-rose-500/10"
                  )}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name</Label>
              <Input 
                {...register('lastName')}
                placeholder="Doe" 
                className="h-10 rounded-xl bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Primary Phone *</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                {...register('phonePrimary', { required: 'Phone number is required' })}
                placeholder="03xx-xxxxxxx" 
                className={cn(
                    "pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10",
                    errors.phonePrimary && "border-rose-500 focus-visible:ring-rose-500/10"
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                {...register('email')}
                type="email"
                placeholder="john.doe@example.com" 
                className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10"
              />
            </div>
          </div>

          {/* Advanced Section Toggle */}
          <button 
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors py-2"
          >
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showAdvanced ? "Hide Advanced Details" : "Add Address & Preferences"}
          </button>

          <AnimatePresence>
            {showAdvanced && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-4 overflow-hidden"
                >
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Street Address</Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <Input 
                                {...register('streetAddress')}
                                placeholder="House #, Street..." 
                                className="pl-9 h-10 rounded-xl bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">City</Label>
                            <Input 
                                {...register('city')}
                                placeholder="City" 
                                className="h-10 rounded-xl bg-slate-50/50 border-slate-100"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Group</Label>
                            <select 
                                {...register('customerGroup')}
                                className="w-full h-10 rounded-xl bg-slate-50/50 border-slate-100 text-sm font-medium px-3 focus:outline-none focus:ring-2 focus:ring-primary/10"
                            >
                                <option value="Regular">Regular</option>
                                <option value="Silver">Silver</option>
                                <option value="Gold">Gold</option>
                                <option value="Platinum">Platinum</option>
                                <option value="Staff">Staff</option>
                            </select>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={handleClose}
                className="rounded-xl font-bold text-[10px] uppercase tracking-widest"
            >
                Cancel
            </Button>
            <Button 
                type="submit" 
                disabled={createCustomerMutation.isPending}
                className="rounded-xl font-bold text-[10px] uppercase tracking-widest px-8 shadow-xl shadow-primary/20"
            >
                {createCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCustomerModal;
