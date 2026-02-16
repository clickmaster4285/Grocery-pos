"use client";

import { useMemo, useState } from "react";
import { Plus, Tag, Search, Layers, SlidersHorizontal, Building2 } from "lucide-react";
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import CategoriesTable from "@/components/shared-components/inventory/categories/categories-table";
import CategoryModal from "@/components/shared-components/inventory/categories/category-modal";
import {
    useGetAllCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
} from "@/features/category.api";
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

const Categories = () => {
    const router = useRouter();
    const { user } = useAuth();
    const userPrimaryRole = user?.role?.toLowerCase() || 'customer';

    const { data, isLoading, refetch } = useGetAllCategories();
    const createCategoryMutation = useCreateCategory();
    const updateCategoryMutation = useUpdateCategory();
    const deleteCategoryMutation = useDeleteCategory();


    const categories = data?.data ?? [];

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [modalState, setModalState] = useState({ isOpen: false, mode: "add", category: null });
    const [categoryToDelete, setCategoryToDelete] = useState(null);

    // Filter categories based on search and status
    const filteredCategories = useMemo(() => {
        return categories.filter((category) => {
            const matchesSearch =
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                category.category_code?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "ACTIVE" && category.isActive) ||
                (statusFilter === "INACTIVE" && !category.isActive);

            const matchesType =
                typeFilter === "all" || category.category_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [categories, searchQuery, statusFilter, typeFilter]);

    // Handlers for Category Modal
    const openAddModal = () => {
        setModalState({ isOpen: true, mode: "add", category: null });
    };

    const openEditModal = (category) => {
        setModalState({ isOpen: true, mode: "edit", category: category });
    };

    const closeCategoryModal = () => {
        setModalState({ isOpen: false, mode: "add", category: null });
    };

    const handleSaveCategory = async (formData, categoryId) => {
        const toastId = toast.loading(modalState.mode === "add" ? 'Deploying category node...' : 'Synchronizing node data...');
        try {
            if (modalState.mode === "add") {
                await createCategoryMutation.mutateAsync(formData);
                toast.success('Category node deployed successfully.', { id: toastId });
            } else if (modalState.mode === "edit" && categoryId) {
                await updateCategoryMutation.mutateAsync({ id: categoryId, categoryData: formData });
                toast.success('Category record synchronized.', { id: toastId });
            }
            closeCategoryModal();
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred during database commit.',
            });
        }
    };


    // Handlers for Delete Confirmation
    const confirmDeleteCategory = (categoryId) => {
        const cat = categories.find(c => c._id === categoryId);
        setCategoryToDelete(cat);
    };

    const executeDelete = async () => {
        if (!categoryToDelete) return;
        const toastId = toast.loading('Archiving category node...');
        try {
            await deleteCategoryMutation.mutateAsync(categoryToDelete._id);
            toast.success('Category node archived successfully.', { id: toastId });
            setCategoryToDelete(null);
            refetch();
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.response?.data?.message || err.message || 'An unexpected error occurred.',
            });
        }
    };


    if (isLoading) {
        return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Analyzing Category Network...</div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <main className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Categories</h1>
                        <p className="text-muted-foreground font-medium mt-1">
                            Classify and organize your architectural product catalog nodes.
                        </p>
                    </div>
                    <Button
                        onClick={openAddModal}
                        className="gap-2 bg-primary hover:bg-primary/90 font-semibold px-5 h-11 shadow-sm"
                    >
                        <Plus className="h-4 w-4" />
                        New Category
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center bg-card p-4 rounded-xl border shadow-sm">
                    <div className="lg:col-span-2 relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by code or name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 border-muted bg-muted/20 focus-visible:bg-background transition-colors"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="h-10 font-medium bg-muted/20 border-muted">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-3.5 w-3.5 opacity-60" />
                                    <SelectValue placeholder="Type" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="PHYSICAL">Physical</SelectItem>
                                <SelectItem value="SERVICE">Service</SelectItem>
                                <SelectItem value="DIGITAL">Digital</SelectItem>
                            </SelectContent>
                        </Select>

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
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-semibold text-foreground">
                                {filteredCategories.length} <span className="text-muted-foreground font-medium">Nodes</span>
                            </span>
                        </div>
                    </div>
                </div>

                <CategoriesTable
                    categories={filteredCategories}
                    onEdit={openEditModal}
                    onDelete={confirmDeleteCategory}
                    userPrimaryRole={userPrimaryRole}
                />
            </main>

            {/* Category Modal */}
            <CategoryModal
                isOpen={modalState.isOpen}
                onClose={closeCategoryModal}
                onSave={handleSaveCategory}
                category={modalState.category}
                mode={modalState.mode}
                createCategoryMutation={createCategoryMutation}
                updateCategoryMutation={updateCategoryMutation}
            />

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
                <AlertDialogContent className="border-none shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-destructive">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground py-2 leading-relaxed">
                            Are you sure you want to remove <span className="text-foreground font-semibold underline underline-offset-4 decoration-primary/30">{categoryToDelete?.name}</span>?
                            This node will be archived and hidden from all active production operations.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="font-semibold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={executeDelete}
                            className="bg-destructive hover:bg-destructive/90 text-white font-semibold"
                        >
                            Delete Category
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default Categories;