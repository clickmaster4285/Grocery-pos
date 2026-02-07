"use client";

import { useMemo, useState } from "react";
import { Plus, Truck, Search } from "lucide-react"; // Using Truck icon for supplier
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import SuppliersTable from "@/components/shared-components/suppliers/suppliers-table";
import { useGetAllSuppliers } from "@/features/supplier.api";
import { useSupplierHook } from "@/hooks/useSupplierHook";
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
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const Suppliers = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading } = useGetAllSuppliers();
    const { handleDelete } = useSupplierHook();

    const suppliers = data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter((supplier) => {
            const matchesSearch =
                supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && supplier.isActive) ||
                (statusFilter === "INACTIVE" && !supplier.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [suppliers, searchQuery, statusFilter]);

    const handleAddSupplier = () => {
        router.push(`/${userPrimaryRole}/suppliers/create`);
    };

    const handleEditSupplier = (supplier) => {
        router.push(`/${userPrimaryRole}/suppliers/${supplier._id}/edit`);
    };

    const confirmDeleteSupplier = (supplierId) => {
        setSupplierToDelete(supplierId);
    };

    const executeDelete = async () => {
        if (supplierToDelete) {
            await handleDelete(supplierToDelete);
            setSupplierToDelete(null);
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
                        onClick={handleAddSupplier}
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
                                placeholder="Search by name or description..."
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
                    onEdit={handleEditSupplier}
                    onDelete={confirmDeleteSupplier}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

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
