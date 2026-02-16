"use client";

import { useMemo, useState } from "react";
import { Plus, Truck, Search, SlidersHorizontal } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SuppliersTable from "@/components/shared-components/inventory/suppliers/suppliers-table";
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

    const suppliers = data?.data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.supplier_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || supplier.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchQuery, statusFilter]);

    // Navigation Handlers
    const openAddPage = () => router.push(`/${userPrimaryRole}/inventory/suppliers/new`);
    const openEditPage = (supplier) => router.push(`/${userPrimaryRole}/inventory/suppliers/${supplier._id}/edit`);

    // Handlers for Delete Confirmation
    const confirmDeleteSupplier = (supplierId) => {
        const sup = suppliers.find(s => s._id === supplierId);
        setSupplierToDelete(sup);
    };

    const executeDelete = async () => {
        if (!supplierToDelete) return;
        const toastId = toast.loading('Archiving supplier node...');
        try {
            await deleteSupplierMutation.mutateAsync(supplierToDelete._id);
            toast.success('Supplier node archived successfully.', { id: toastId });
            setSupplierToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Analyzing Supply Network...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <main className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Suppliers</h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Manage and oversee your global supply chain partners.
                        </p>
                    </div>
                    <Button
                        onClick={openAddPage}
                        className="gap-2 bg-primary hover:bg-primary/90 font-semibold px-5 h-11 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Supplier
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, code, contact..."
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
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">
                                {filteredSuppliers.length} <span className="text-muted-foreground font-medium">Partners</span>
                            </span>
                        </div>
                    </div>
                </div>

                <SuppliersTable
                    suppliers={filteredSuppliers}
                    onEdit={openEditPage}
                    onDelete={confirmDeleteSupplier}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!supplierToDelete} onOpenChange={(open) => !open && setSupplierToDelete(null)}>
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-destructive">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground py-2 leading-relaxed">
                            Are you sure you want to remove <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary/30">{supplierToDelete?.name}</span>?
                            This trade partner will be archived and hidden from active procurement cycles.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white font-semibold"
                        >
                            Delete Supplier
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Suppliers;