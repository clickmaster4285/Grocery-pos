"use client";

import { useParams, useRouter } from "next/navigation";
import TerminalForm from "@/components/shared-components/pos/terminals/terminal-form";
import { useTerminalHook } from "@/hooks/useTerminalHook";
import { useGetTerminalById } from "@/features/terminal.api";
import { useEffect } from "react";

const EditTerminalPage = () => {
   const params = useParams();
   const router = useRouter();
   const { id, role } = params;

   const {
      handleSubmit,
      isSubmitting,
      isAdmin,
      selectedBranchId,
      handleOpenForm,
      editingTerminal,
   } = useTerminalHook();

   // Fetch data for editing
   const { data: terminalResponse, isLoading: isFetching } = useGetTerminalById(id);
   const fetchedTerminal = terminalResponse?.data;

   // Sync editing state in the hook
   useEffect(() => {
      if (fetchedTerminal) {
         handleOpenForm(fetchedTerminal);
      }
   }, [fetchedTerminal, handleOpenForm]);

   const handleOnSubmit = async (formData) => {
      try {
         await handleSubmit(formData);
         router.push(`/${role}/pos/terminals/${id}`);
      } catch (error) {
         console.error("Update failed:", error);
      }
   };

   if (isFetching) {
      return (
         <div className="min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="h-12 w-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
               <p className="animate-pulse font-semibold text-primary/60 text-sm uppercase tracking-[0.2em] italic">
                  Fetching Configuration...
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className="p-6">
         <TerminalForm
            initialData={editingTerminal}
            onSubmit={handleOnSubmit}
            isSubmitting={isSubmitting}
            isAdmin={isAdmin}
            selectedBranchId={selectedBranchId}
         />
      </div>
   );
};

export default EditTerminalPage;
