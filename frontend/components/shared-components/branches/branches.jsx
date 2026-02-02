
import { useState, useMemo } from "react";
import { Search, Plus, Building2 } from "lucide-react";

import BranchesTable from "@/components/branches/branches-table";
import BranchModal from "@/components/branches/branch-modal";
import DeleteConfirmationModal from "@/components/branches/delete-confirmation-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   useBranches,
   useCreateBranch,
   useUpdateBranch,
   useToggleBranchStatus,
} from "@/hooks/useBranches";



const Branches = () => {

   const { data, isLoading } = useBranches();
   const createBranchMutation = useCreateBranch();
   const updateBranchMutation = useUpdateBranch();
   const toggleStatusMutation = useToggleBranchStatus();

   const branches = data?.data ?? [];

   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [modalState, setModalState] = useState({ isOpen: false, mode: "add", branch: null });
   const [toggleModal, setToggleModal] = useState({ isOpen: false, branch: null });

   // Filter branches based on search and status
   const filteredBranches = useMemo(() => {
      return branches.filter((branch) => {
         const matchesSearch =
            branch.branch_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            branch.address.state.toLowerCase().includes(searchQuery.toLowerCase());

         const matchesStatus =
            statusFilter === "all" || branch.status === statusFilter;

         return matchesSearch && matchesStatus;
      });
   }, [branches, searchQuery, statusFilter]);


   // Modal handlers
   const openAddModal = () => {
      setModalState({ isOpen: true, mode: "add", branch: null });
   };

   const openViewModal = (branch) => {
      setModalState({ isOpen: true, mode: "view", branch });
   };

   const openEditModal = (branch) => {
      setModalState({ isOpen: true, mode: "edit", branch });
   };

   const closeModal = () => {
      setModalState({ isOpen: false, mode: "add", branch: null });
   };

   const openToggleModal = (branch) => {
      setToggleModal({ isOpen: true, branch });
   };

   const closeToggleModal = () => {
      setToggleModal({ isOpen: false, branch: null });
   };

   // CRUD operations
   const handleSaveBranch = (formData) => {
      if (modalState.mode === "add") {
         createBranchMutation.mutate(formData);
      }

      if (modalState.mode === "edit" && modalState.branch) {
         updateBranchMutation.mutate({
            id: modalState.branch._id,
            data: formData,
         });
      }

      closeModal();
   };


   const handleConfirmStatusChange = () => {
      if (!toggleModal.branch) return;

      toggleStatusMutation.mutate(toggleModal.branch._id, {
         onSuccess: () => {
            setToggleModal({ isOpen: false, branch: null });
         },
      });
   };


   if (isLoading) {
      return <div className="p-6">Loading branches...</div>;
   }

   return (
      <div className="flex min-h-screen bg-background">
         {/* Page Content */}
         <main className="flex-1">
            {/* Breadcrumb */}
            <div className="mb-2 flex items-center gap-2 text-sm">
               <span className="text-muted-foreground">Home</span>
               <span className="text-muted-foreground">•</span>
               <span className="text-primary font-medium">Branches</span>
            </div>

            {/* Page Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
               <div>
                  <h1 className="text-2xl font-bold text-foreground">Branches</h1>
                  <p className="text-sm text-muted-foreground">
                     Manage all your store branches and locations
                  </p>
               </div>
               <Button
                  onClick={openAddModal}
                  className="gap-2 bg-primary hover:bg-primary/90"
               >
                  <Plus className="h-4 w-4" />
                  Add Branch
               </Button>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
               <div className="flex flex-1 items-center gap-4">
                  {/* Search */}
                  <div className="relative flex-1 max-w-sm">
                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                     <Input
                        type="search"
                        placeholder="Search by name, city, or state..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                     />
                  </div>

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="w-37.5">
                        <SelectValue placeholder="Filter by status" />
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               {/* Results count */}
               <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                     {filteredBranches.length} branch
                     {filteredBranches.length !== 1 ? "es" : ""} found
                  </span>
               </div>
            </div>

            {/* Table */}
            <BranchesTable
               branches={filteredBranches}
               onView={openViewModal}
               onEdit={openEditModal}
               onToggleStatus={openToggleModal}
            />
         </main>


         {/* Modals */}
         <BranchModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onSave={handleSaveBranch}
            branch={modalState.branch}
            mode={modalState.mode}
         />

         <DeleteConfirmationModal
            isOpen={toggleModal.isOpen}
            onClose={closeToggleModal}
            onConfirm={handleConfirmStatusChange}
            branch={toggleModal.branch}
         />
      </div>
   );
};

export default Branches;