"use client";

import { useMemo, useState } from "react";
import { Plus, Building2, Search } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BrandsTable from "@/components/shared-components/brands/brands-table";
import BrandModal from "@/components/shared-components/brands/brand-modal"; // Import the modal
import {
    useGetAllBrands,
    useCreateBrand,
    useUpdateBrand,
    useDeleteBrand,
} from "@/features/brand.api";
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

const Brands = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading, refetch } = useGetAllBrands();
    const createBrandMutation = useCreateBrand();
    const updateBrandMutation = useUpdateBrand();
    const deleteBrandMutation = useDeleteBrand();


    const brands = data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", brand: null });
    const [brandToDelete, setBrandToDelete] = useState(null);

    const filteredBrands = useMemo(() => {
        return brands.filter((brand) => {
            const matchesSearch =
                brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                brand.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && brand.isActive) ||
                (statusFilter === "INACTIVE" && !brand.isActive);

            return matchesSearch && matchesStatus;
        });
    }, [brands, searchQuery, statusFilter]);

    // Handlers for Brand Modal
    const openAddModal = () => {
        setModalState({ isOpen: true, mode: "add", brand: null });
    };

    const openEditModal = (brand) => {
        setModalState({ isOpen: true, mode: "edit", brand: brand });
    };

    const closeBrandModal = () => {
        setModalState({ isOpen: false, mode: "add", brand: null });
    };

    const handleSaveBrand = async (formData, brandId) => {
        const toastId = toast.loading(modalState.mode === "add" ? 'Creating brand...' : 'Saving brand...');
        try {
            if (modalState.mode === "add") {
                await createBrandMutation.mutateAsync(formData);
                toast.success('Brand created successfully.', { id: toastId });
            } else if (modalState.mode === "edit" && brandId) {
                await updateBrandMutation.mutateAsync({ id: brandId, brandData: formData });
                toast.success('Brand updated successfully.', { id: toastId });
            }
            closeBrandModal();
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    };

    // Handlers for Delete Confirmation
    const confirmDeleteBrand = (brandId) => {
        setBrandToDelete(brandId);
    };

    const executeDelete = async () => {
        if (!brandToDelete) return;
        const toastId = toast.loading('Deleting brand...');
        try {
            await deleteBrandMutation.mutateAsync(brandToDelete);
            toast.success('Brand status updated successfully.', { id: toastId });
            setBrandToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-6">Loading brands...</div>;
    }

    return (
        <div className="flex">
            <main className="flex-1">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Brands</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage your product brands
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="gap-2 bg-primary hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Add Brand
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
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {filteredBrands.length} brand
                            {filteredBrands.length !== 1 ? "s" : ""} found
                        </span>
                    </div>
                </div>

                <BrandsTable
                    brands={filteredBrands}
                    onEdit={openEditModal}
                    onDelete={confirmDeleteBrand}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            {/* Brand Modal */}
            <BrandModal
                isOpen={modalState.isOpen}
                onClose={closeBrandModal}
                onSave={handleSaveBrand}
                brand={modalState.brand}
                mode={modalState.mode}
                createBrandMutation={createBrandMutation}
                updateBrandMutation={updateBrandMutation}
            />

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!brandToDelete} onOpenChange={(open) => !open && setBrandToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will toggle the status of the brand. You can reactivate it later.
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

export default Brands;