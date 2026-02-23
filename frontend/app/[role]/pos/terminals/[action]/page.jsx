"use client";

import { useParams, useRouter } from "next/navigation";
import TerminalForm from "@/components/shared-components/pos/terminals/terminal-form";
import { useTerminalHook } from "@/hooks/useTerminalHook";
import { useGetTerminalById } from "@/features/terminal.api";
import { toast } from "sonner";
import { useEffect } from "react";

const ActionPage = () => {
   const params = useParams();
   const router = useRouter();
   const action = params.action; // "create" or the terminal ID
   const isCreate = action === "create";

   const {
      handleSubmit,
      isSubmitting,
      isAdmin,
      selectedBranchId,
   } = useTerminalHook();

   // Fetch data if editing
   const { data: terminalResponse, isLoading: isFetching } = useGetTerminalById(
      !isCreate ? action : null,
      { enabled: !isCreate }
   );

   const initialData = terminalResponse?.data;

   const handleOnSubmit = async (formData) => {
      try {
         // Re-wrapping the logic from handleSubmit in useTerminalHook but adapted for page navigation
         // Actually, handleFormSubmit in useTerminalHook handles navigation via handleCloseForm
         // But we need to override handleCloseForm to navigate back instead of closing a modal.

         // For now, let's use a local submit handler that calls the hook's handleSubmit 
         // but we need to ensure the hook's handleSubmit knows where to go next.
         // Looking at useTerminalHook.js, handleSubmit calls handleCloseForm() which sets setIsFormOpen(false).
         // Since we are not using the modal, we should probably handle the submission and navigation here or update the hook.

         // To keep things simple and avoid changing the hook too much:
         await handleSubmit(formData);
         router.push(`/${params.role}/pos/terminals`);
      } catch (error) {
         // Error handling is already in the hook's handleSubmit (toast)
      }
   };

   if (!isCreate && isFetching) {
      return (
         <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">
            Loading Terminal Configuration...
         </div>
      );
   }

   return (
      <div className="p-6">
         <TerminalForm
            initialData={initialData}
            onSubmit={handleOnSubmit}
            isSubmitting={isSubmitting}
            isAdmin={isAdmin}
            selectedBranchId={selectedBranchId}
         />
      </div>
   );
};

export default ActionPage;
