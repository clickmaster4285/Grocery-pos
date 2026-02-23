"use client";

import { useMemo, useState } from "react";
import { Plus, MonitorSmartphone, Search, SlidersHorizontal, Cpu, Signal, SignalLow, SignalZero } from "lucide-react";
import { useTerminalHook } from "@/hooks/useTerminalHook";
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
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import TerminalsTable from "./terminals-table";
import { useRouter, useParams } from "next/navigation";

const Terminals = () => {
   const {
      terminals,
      isTerminalsLoading,
      isFormOpen,
      editingTerminal,
      handleOpenForm,
      handleCloseForm,
      handleSubmit,
      isSubmitting,
      handleDelete,
      canCreate,
      isAdmin,
      selectedBranchId,
      setSelectedBranchId
   } = useTerminalHook();

   const router = useRouter();
   const params = useParams();

   const [searchQuery, setSearchQuery] = useState("");
   const [statusFilter, setStatusFilter] = useState("all");
   const [terminalToDelete, setTerminalToDelete] = useState(null);

   const filteredTerminals = useMemo(() => {
      return terminals.filter((terminal) => {
         const matchesSearch =
            terminal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            terminal.terminalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            terminal.ipAddress?.includes(searchQuery);

         const matchesStatus =
            statusFilter === "all" || terminal.status === statusFilter;

         return matchesSearch && matchesStatus;
      });
   }, [terminals, searchQuery, statusFilter]);

   const openDeleteConfirm = (terminal) => setTerminalToDelete(terminal);

   const handleExecuteDelete = async () => {
      if (!terminalToDelete) return;
      await handleDelete(terminalToDelete._id);
      setTerminalToDelete(null);
   };

   if (isTerminalsLoading) {
      return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Scanning Terminal Network...</div>;
   }

   return (
      <div className="space-y-8 animate-in fade-in duration-500">
         <main className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2 mb-1">
                     <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <Cpu className="h-5 w-5" />
                     </div>
                     <h1 className="text-3xl font-bold tracking-tight text-foreground">POS Terminals</h1>
                  </div>
                  <p className="text-muted-foreground font-medium">
                     Manage register hardware, peripheral connectivity, and active cashier sessions.
                  </p>
               </div>
               {canCreate && (
                  <Button
                     onClick={() => router.push(`/${params.role}/pos/terminals/create`)}
                     className="gap-2 bg-primary hover:bg-primary/90 font-semibold px-5 h-11 shadow-sm rounded-xl"
                  >
                     <Plus className="h-4 w-4" />
                     Register New Terminal
                  </Button>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-card p-4 rounded-xl border border-slate-100 shadow-sm">
               <div className="lg:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                     type="search"
                     placeholder="Search by ID, name, or IP..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 h-11 rounded-xl border-slate-100 bg-slate-50/50 focus-visible:bg-background transition-colors"
                  />
               </div>

               <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                     <SelectTrigger className="h-11 rounded-xl font-medium bg-slate-50/50 border-slate-100">
                        <div className="flex items-center gap-2">
                           <SlidersHorizontal className="h-3.5 w-3.5 opacity-60" />
                           <SelectValue placeholder="Status" />
                        </div>
                     </SelectTrigger>
                     <SelectContent>
                        <SelectItem value="all">All States</SelectItem>
                        <SelectItem value="Available">Available</SelectItem>
                        <SelectItem value="Occupied">Occupied</SelectItem>
                        <SelectItem value="Locked">Locked</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                     </SelectContent>
                  </Select>
               </div>

               <div className="flex justify-end">
                  <div className="flex items-center gap-2 bg-slate-50/80 px-4 py-2 rounded-lg border border-slate-100">
                     <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
                     <span className="text-sm font-semibold text-slate-700">
                        {filteredTerminals.length} <span className="text-slate-400 font-medium tracking-tight">Units Online</span>
                     </span>
                  </div>
               </div>
            </div>

            <TerminalsTable
               terminals={filteredTerminals}
               onEdit={(terminal) => router.push(`/${params.role}/pos/terminals/${terminal._id}`)}
               onDelete={openDeleteConfirm}
            />
         </main>

         {/* Form now on separate page */}

         <AlertDialog open={!!terminalToDelete} onOpenChange={(open) => !open && setTerminalToDelete(null)}>
            <AlertDialogContent className="border-none shadow-2xl rounded-2xl">
               <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold text-destructive">Decommission Terminal</AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-muted-foreground py-2 leading-relaxed">
                     Are you sure you want to deactivate <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary/30">{terminalToDelete?.name}</span>?
                     This hardware entry will be archived and sessions will be forcibly closed.
                  </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter className="pt-4">
                  <AlertDialogCancel className="font-semibold rounded-xl h-11">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                     onClick={handleExecuteDelete}
                     className="bg-destructive hover:bg-destructive/90 text-white font-semibold rounded-xl h-11"
                  >
                     Archive Hardware
                  </AlertDialogAction>
               </AlertDialogFooter>
            </AlertDialogContent>
         </AlertDialog>
      </div>
   );
};

export default Terminals;
