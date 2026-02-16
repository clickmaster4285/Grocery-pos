"use client";

import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Search, Globe, SlidersHorizontal } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import BrandsTable from "@/components/shared-components/inventory/brands/brands-table";
import BrandModal from "@/components/shared-components/inventory/brands/brand-modal";
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


    const brands = data?.data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", brand: null });
    const [brandToDelete, setBrandToDelete] = useState(null);

    const filteredBrands = useMemo(() => {
        return brands.filter((brand) => {
            const matchesSearch =
                brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                brand.brand_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                brand.origin?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" || brand.status === statusFilter;

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

    const handleSaveBrand = async (brandData, brandId) => {
        const toastId = toast.loading(modalState.mode === "add" ? 'Deploying brand node...' : 'Synchronizing node data...');
        try {
            // Convert to FormData for file upload support
            const formData = new FormData();

            // Append all non-file fields first
            Object.keys(brandData).forEach(key => {
                if (key !== 'logo' && brandData[key] !== null && brandData[key] !== undefined) {
                    formData.append(key, brandData[key]);
                }
            });

            // Append logo last if it's a file
            if (brandData.logo instanceof File) {
                formData.append('logo', brandData.logo);
            } else if (typeof brandData.logo === 'string') {
                formData.append('logo', brandData.logo);
            }

            if (modalState.mode === "add") {
                await createBrandMutation.mutateAsync(formData);
                toast.success('Brand node deployed successfully.', { id: toastId });
            } else if (modalState.mode === "edit" && brandId) {
                await updateBrandMutation.mutateAsync({ id: brandId, brandData: formData });
                toast.success('Brand record synchronized.', { id: toastId });
            }
            closeBrandModal();
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred during database commit.',
            });
        }
    };

    // Handlers for Delete Confirmation
    const confirmDeleteBrand = (brandId) => {
        const brand = brands.find(b => b._id === brandId);
        setBrandToDelete(brand);
    };

    const executeDelete = async () => {
        if (!brandToDelete) return;
        const toastId = toast.loading('Archiving brand node...');
        try {
            await deleteBrandMutation.mutateAsync(brandToDelete._id);
            toast.success('Brand node archived successfully.', { id: toastId });
            setBrandToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Analyzing Brand Network...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <main className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Brands</h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Manage and oversee your product brand portfolio.
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="gap-2 bg-primary hover:bg-primary/90 font-semibold px-5 h-11 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Brand
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by name, code, or origin..."
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
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">
                                {filteredBrands.length} <span className="text-muted-foreground font-medium">Entities</span>
                            </span>
                        </div>
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
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-destructive">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground py-2 leading-relaxed">
                            Are you sure you want to remove <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary/30">{brandToDelete?.name}</span>?
                            This entity will be archived and hidden from all active production operations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white font-semibold"
                        >
                            Delete Brand
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Brands;