"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import BranchesTable from "@/components/shared-components/branches/branches-table";
import StatusToggleModal from "@/components/shared-components/branches/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   useGetAllBranches,
   useUpdateBranch,
   useDeleteBranch,
} from "@/features/branch.api.js";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Branches = () => {
   const router = useRouter();
   const { data, isLoading, refetch } = useGetAllBranches();
   const updateBranchMutation = useUpdateBranch();
   const deleteBranchMutation = useDeleteBranch();
   const { user } = useAuth();
   const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

   const branches = data?.data ?? [];

   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [toggleModal, setToggleModal] = useState({ isOpen: false, branch: null });
   const [branchToDelete, setBranchToDelete] = useState(null);


   const filteredBranches = useMemo(() => {
      return branches.filter((branch) => {
         const matchesSearch =
            branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.address?.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.address?.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.branch_code?.toLowerCase().includes(searchQuery.toLowerCase());

         const matchesStatus =
            statusFilter === "all" || branch.status === statusFilter;

         return matchesSearch && matchesStatus;
      });
   }, [branches, searchQuery, statusFilter]);


   const openAddModal = () => router.push(`/${userPrimaryRole}/branches/new`);
   const openEditModal = (branch) => router.push(`/${userPrimaryRole}/branches/${branch._id}/edit`);
   const openToggleModal = (branch) => setToggleModal({ isOpen: true, branch });
   const closeToggleModal = () => setToggleModal({ isOpen: false, branch: null });
   const openDeleteConfirm = (branch) => setBranchToDelete(branch);

   const handleConfirmStatusChange = async () => {
      if (!toggleModal.branch) return;
      const toastId = toast.loading('Updating status...');
      try {
         const newStatus = toggleModal.branch.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
         await updateBranchMutation.mutateAsync({
            id: toggleModal.branch._id,
            branchData: { status: newStatus }
         });
         toast.success("Branch status updated.", { id: toastId });
         closeToggleModal();
         refetch();
      } catch (error) {
         toast.error("Update failed", {
            id: toastId,
            description: error?.response?.data?.message || "An unexpected error occurred.",
         });
      }
   };

   const handleExecuteDelete = async () => {
       if (!branchToDelete) return;
       const toastId = toast.loading('Deleting branch...');
       try {
           await deleteBranchMutation.mutateAsync(branchToDelete._id);
           toast.success("Branch deleted successfully.", { id: toastId });
           setBranchToDelete(null);
           refetch();
       } catch (error) {
           toast.error("Deletion failed", {
               id: toastId,
               description: error?.response?.data?.message || "An unexpected error occurred.",
           });
       }
   };


   if (isLoading) {
      return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Loading Branch Network...</div>;
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <main className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Branches</h1>
                  <p className="text-muted-foreground font-medium mt-1">
                     Oversee and manage your physical storefronts and logistics hubs.
                  </p>
               </div>
               <Button
                  onClick={openAddModal}
                  className="gap-2 bg-primary hover:bg-primary/90 font-semibold px-5 h-11 shadow-sm"
               >
                  <Plus className="h-4 w-4" />
                  New Branch
               </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
               <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     type="search"
                     placeholder="Search by code, name, or city..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 h-10 border-muted bg-muted/20 focus-visible:bg-background transition-colors"
                  />
               </div>

               <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="h-10 font-medium bg-muted/20 border-muted">
                        <div className="flex items-center gap-2">
                           <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
                           <SelectValue placeholder="Status" />
                        </div>
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-muted/30 px-4 py-2 rounded-lg border border-border">
                     <Building2 className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm font-semibold text-foreground">
                        {filteredBranches.length} <span className="text-muted-foreground font-medium">Locations</span>
                     </span>
                  </div>
               </div>
            </div>

            <BranchesTable
               branches={filteredBranches}
               onEdit={openEditModal}
               onToggleStatus={openToggleModal}
               onDelete={openDeleteConfirm}
               userPrimaryRole={userPrimaryRole}
            />
         </main>

         <StatusToggleModal
            isOpen={toggleModal.isOpen}
            onClose={closeToggleModal}
            onConfirm={handleConfirmStatusChange}
            branch={toggleModal.branch}
         />

         <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
            <AlertDialogContent className="border-none shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold text-destructive">Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription className="text-base text-muted-foreground py-2 leading-relaxed">
                        Are you sure you want to remove <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary/30">{branchToDelete?.branch_name}</span>? 
                        This location will be archived and hidden from all active operations.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="pt-4">
                    <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleExecuteDelete}
                        className="bg-destructive hover:bg-destructive/90 text-white font-semibold"
                    >
                        Delete Branch
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};

export default Branches;