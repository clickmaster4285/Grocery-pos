"use client";

import { useParams, useRouter } from "next/navigation";
import TerminalForm from "@/components/shared-components/pos/terminals/terminal-form";
import { useTerminalHook } from "@/hooks/useTerminalHook";

const CreateTerminalPage = () => {
   const params = useParams();
   const router = useRouter();
   const { role } = params;

   const {
      handleSubmit,
      isSubmitting,
      isAdmin,
      selectedBranchId,
   } = useTerminalHook();

   const handleOnSubmit = async (formData) => {
      try {
         await handleSubmit(formData);
         router.push(`/${role}/pos/terminals`);
      } catch (error) {
         console.error("Creation failed:", error);
      }
   };

   return (
      <div>
         <TerminalForm
            initialData={null}
            onSubmit={handleOnSubmit}
            isSubmitting={isSubmitting}
            isAdmin={isAdmin}
            selectedBranchId={selectedBranchId}
         />
      </div>
   );
};

export default CreateTerminalPage;
