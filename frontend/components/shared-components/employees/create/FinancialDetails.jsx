'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Banknote, Landmark } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export const FinancialDetails = ({ formData, updateFormField }) => {
  const payTypes = [
    { value: 'SALARY', label: 'Monthly Salary' },
    { value: 'HOURLY', label: 'Hourly Rate' },
    { value: 'FIXED', label: 'Fixed Contract' },
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHECK', label: 'Check' },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <Banknote className="h-4 w-4" />
          <span>Compensation</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="baseAmount">Base Amount</Label>
            <Input
              id="baseAmount"
              type="number"
              placeholder="0.00"
              value={formData.salary.baseAmount}
              onChange={(e) => updateFormField('salary.baseAmount', Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Pay Type</Label>
            <Select 
              value={formData.salary.payType} 
              onValueChange={(val) => updateFormField('salary.payType', val)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                {payTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select 
              value={formData.salary.paymentMethod} 
              onValueChange={(val) => updateFormField('salary.paymentMethod', val)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {formData.salary.paymentMethod === 'BANK_TRANSFER' && (
        <section className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
            <Landmark className="h-4 w-4" />
            <span>Bank Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g. Chase, HBL"
                value={formData.salary.bankDetails.bankName}
                onChange={(e) => updateFormField('salary.bankDetails.bankName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="Enter account number"
                value={formData.salary.bankDetails.accountNumber}
                onChange={(e) => updateFormField('salary.bankDetails.accountNumber', e.target.value)}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="iban">IBAN / Swift Code</Label>
              <Input
                id="iban"
                placeholder="International Bank Account Number"
                value={formData.salary.bankDetails.iban}
                onChange={(e) => updateFormField('salary.bankDetails.iban', e.target.value)}
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
