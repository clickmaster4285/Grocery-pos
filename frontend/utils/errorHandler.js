// utils/errorHandler.js - Updated with toastId support
export const handleApiError = (error, toast, toastId = null) => {
   console.error('API Error:', error);

   // Extract error data from various possible structures
   let errorData = null;

   // Try different possible error locations
   if (error.data) {
      errorData = error.data; // Your current structure
   } else if (error.response?.data) {
      errorData = error.response.data; // Standard Axios structure
   } else if (error.response) {
      errorData = error.response; // Direct response
   } else {
      errorData = error; // Fallback to the error itself
   }

   // First, dismiss or update the loading toast if we have a toastId
   if (toastId) {
      // Dismiss the loading toast
      toast.dismiss(toastId);
   }

   // Handle duplicate field errors
   if (errorData.errors) {
      if (typeof errorData.errors === 'object' && !Array.isArray(errorData.errors)) {
         // Object format: { phone: 'error message' }
         Object.values(errorData.errors).forEach(err => {
            if (err && typeof err === 'string') {
               toast.error("Duplicate Field", {
                  description: err,
                  duration: 5000
               });
            }
         });
         return;
      } else if (Array.isArray(errorData.errors)) {
         // Array format
         errorData.errors.forEach(err => {
            toast.error("Validation Error", {
               description: err,
               duration: 5000
            });
         });
         return;
      }
   }

   // Handle single error message (try multiple possible keys)
   const errorMessage = errorData.error || errorData.message || errorData.detail || error.message;

   if (errorMessage) {
      toast.error("Operation Failed", {
         description: errorMessage,
         duration: 5000
      });
      return;
   }

   // Fallback
   toast.error("Operation Failed", {
      description: "An unexpected error occurred",
      duration: 5000
   });
};