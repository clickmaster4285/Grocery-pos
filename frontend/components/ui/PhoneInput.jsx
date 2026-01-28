// components/ui/PhoneInput.jsx
'use client';

import { Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { formatPhoneNumber, unformatPhoneNumber, validatePhoneNumber } from "@/utils/formatters";

export const PhoneInput = ({
   value,
   onChange,
   label = "Phone Number",
   required = true,
   placeholder = "0300-0000000",
   className = "",
   error,
   showValidation = false
}) => {
   const [displayValue, setDisplayValue] = useState('');
   const [validation, setValidation] = useState({ isValid: true, message: '' });

   // Format initial value
   useEffect(() => {
      if (value) {
         setDisplayValue(formatPhoneNumber(value));
      } else {
         setDisplayValue('');
      }
   }, [value]);

   // Validate when value changes
   useEffect(() => {
      if (showValidation && value) {
         const validationResult = validatePhoneNumber(value);
         setValidation(validationResult);
      }
   }, [value, showValidation]);

   const handleChange = useCallback((e) => {
      const inputValue = e.target.value;

      // Remove non-digits
      const cleaned = inputValue.replace(/\D/g, '');

      // Limit to 11 digits (Pakistani phone numbers)
      const limited = cleaned.slice(0, 11);

      // Format as 0300-0000000
      let formatted = '';
      if (limited.length >= 4) {
         formatted = `${limited.slice(0, 4)}-${limited.slice(4)}`;
      } else {
         formatted = limited;
      }

      setDisplayValue(formatted);

      // Call onChange with unformatted value (just digits)
      onChange(limited);
   }, [onChange]);

   const handleKeyDown = useCallback((e) => {
      // Allow: backspace, delete, tab, escape, enter, arrows
      if ([46, 8, 9, 27, 13, 110].includes(e.keyCode) ||
         // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
         (e.keyCode === 65 && e.ctrlKey === true) ||
         (e.keyCode === 67 && e.ctrlKey === true) ||
         (e.keyCode === 86 && e.ctrlKey === true) ||
         (e.keyCode === 88 && e.ctrlKey === true) ||
         // Allow: home, end, left, right
         (e.keyCode >= 35 && e.keyCode <= 39)) {
         return;
      }

      // Ensure it's a number
      if ((e.keyCode < 48 || e.keyCode > 57) && (e.keyCode < 96 || e.keyCode > 105)) {
         e.preventDefault();
      }
   }, []);

   const handleBlur = useCallback(() => {
      if (showValidation && value) {
         const validationResult = validatePhoneNumber(value);
         setValidation(validationResult);
      }
   }, [value, showValidation]);

   return (
      <div className="space-y-2">
         {label && (
            <Label htmlFor="phone-input">
               {label}
               {required && <span className="text-red-500 ml-1">*</span>}
            </Label>
         )}

         <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
               id="phone-input"
               type="tel"
               value={displayValue}
               onChange={handleChange}
               onKeyDown={handleKeyDown}
               onBlur={handleBlur}
               placeholder={placeholder}
               className={`pl-10 ${className} ${!validation.isValid ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
               required={required}
            />
         </div>

         {showValidation && !validation.isValid && (
            <p className="text-sm text-red-500">{validation.message}</p>
         )}

         {validation.isValid && showValidation && value && (
            <p className="text-sm text-green-500">✓ Valid phone number</p>
         )}

         {error && (
            <p className="text-sm text-red-500">{error}</p>
         )}

         <p className="text-xs text-muted-foreground">
            Format: 03XX-XXXXXXX (11 digits total)
         </p>
      </div>
   );
};