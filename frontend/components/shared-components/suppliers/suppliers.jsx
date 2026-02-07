"use client";

import { useMemo, useState } from "react";
import { Plus, Truck, Search } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SuppliersTable from "@/components/shared-components/suppliers/suppliers-table";
import SupplierModal from "@/components/shared-components/suppliers/supplier-modal";
import {
    useGetAllSuppliers,
    useDeleteSupplier,
} from "@/features/supplier.api";
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
} from "@/components/ui/alert-dialog"

const Suppliers = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading, refetch } = useGetAllSuppliers();
    const deleteSupplierMutation = useDeleteSupplier();

    const suppliers = data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", supplier: null });
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) || // Search contact person
                supplier.email.toLowerCase().includes(searchQuery.toLowerCase()) || // Search email
                (supplier.address && (
                    supplier.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    supplier.address.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    supplier.address.country.toLowerCase().includes(searchQuery.toLowerCase())
                ));

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && supplier.isActive) ||
                (statusFilter === "INACTIVE" && !supplier.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchQuery, statusFilter]);

    // Handlers for Supplier Modal
    const openAddModal = () => {
        setModalState({ isOpen: true, mode: "add", supplier: null });
    };

    const openEditModal = (supplier) => {
        setModalState({ isOpen: true, mode: "edit", supplier: supplier });
    };

    const closeSupplierModal = () => {
        setModalState({ isOpen: false, mode: "add", supplier: null });
        refetch(); // Refetch data after modal closes to show updates
    };

    // Handlers for Delete Confirmation
    const confirmDeleteSupplier = (supplierId) => {
        setSupplierToDelete(supplierId);
    };

    const executeDelete = async () => {
        if (!supplierToDelete) return;
        const toastId = toast.loading('Deleting supplier...');
        try {
            await deleteSupplierMutation.mutateAsync(supplierToDelete);
            toast.success('Supplier status updated successfully.', { id: toastId });
            setSupplierToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-6">Loading suppliers...</div>;
    }

    return (
        <div className="flex">
            <main className="flex-1">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Suppliers</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your product suppliers
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="gap-2 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Supplier
                    </Button>
                </div>

                <div className="mb-6 flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 items-center gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name, contact, email or address..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

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

                    <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {filteredSuppliers.length} supplier
                            {filteredSuppliers.length !== 1 ? "s" : ""} found
                        </span>
                    </div>
                </div>

                <SuppliersTable
                    suppliers={filteredSuppliers}
                    onEdit={openEditModal}
                    onDelete={confirmDeleteSupplier}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            {/* Supplier Modal */}
            <SupplierModal
                isOpen={modalState.isOpen}
                onClose={closeSupplierModal}
                supplier={modalState.supplier}
                mode={modalState.mode}
            />

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will toggle the status of the supplier. You can reactivate it later.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={executeDelete}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Suppliers;