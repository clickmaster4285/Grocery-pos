// utils/formatters.js
export const formatPhoneNumber = (phoneNumber) => {
   if (!phoneNumber) return '';

   // Remove all non-digit characters
   const cleaned = String(phoneNumber).replace(/\D/g, '');

   // Pakistani phone number format: 0300-0000000
   if (cleaned.length >= 4) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
   }

   return cleaned;
};

export const unformatPhoneNumber = (formattedNumber) => {
   if (!formattedNumber) return '';
   // Remove all non-digit characters to get the raw number
   return String(formattedNumber).replace(/\D/g, '');
};

export const validatePhoneNumber = (phoneNumber) => {
   const cleaned = unformatPhoneNumber(phoneNumber);

   // Pakistani mobile numbers: 03XX-XXXXXXX (11 digits total)
   if (cleaned.length !== 11) {
      return { isValid: false, message: 'Phone number must be 11 digits' };
   }

   if (!cleaned.startsWith('03')) {
      return { isValid: false, message: 'Phone number must start with 03' };
   }

   return { isValid: true, message: '' };
};

export const formatPhoneNumberForDisplay = (phoneNumber) => {
   if (!phoneNumber) return '';

   const cleaned = String(phoneNumber).replace(/\D/g, '');

   if (cleaned.length === 11) {
      return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 11)}`;
   }

   // If already formatted or different length, return as is
   return phoneNumber;
};